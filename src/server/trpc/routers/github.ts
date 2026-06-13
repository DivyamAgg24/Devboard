import { db } from "@/src/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server";
import { getGithubSession } from "@/src/utils/session";
import { Octokit } from "@octokit/rest"
import { RepoMetrics, SyncSchema, TrackRepo, UntrackRepo } from "@/src/server/trpc/schemas/github";
import { registerWebhook, upsertPullRequest } from "@/src/lib/github";


export const gitRouter = createTRPCRouter({
    repos: protectedProcedure
        .query(async ({ ctx }) => {
            const githubSession = await getGithubSession()
            if (!githubSession?.token) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "GitHub not connected" });
            }

            const [githubRepos, trackedRepos] = await Promise.all([
                fetch("https://api.github.com/user/repos?visibility=public&sort=updated&per_page=50", {
                    headers: { Authorization: `Bearer ${githubSession.token}` }
                }).then(r => r.json()),

                db.trackedRepo.findMany({
                    where: { userId: ctx.session.user.id },
                    select: {
                        id: true,
                        githubRepoId: true,
                        syncStatus: true,
                        lastSyncedAt: true,
                        syncError: true,
                        name: true,
                        owner: true,
                    }
                })
            ])

            const trackedMap = new Map(trackedRepos.map(r => [r.githubRepoId, r]))

            const repos = githubRepos.map((repo: any) => ({
                githubRepoId: String(repo.id),
                name: repo.name,
                fullName: repo.full_name,
                owner: repo.owner.login,
                description: repo.description,
                isPrivate: repo.private,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                updatedAt: repo.updated_at,
                tracked: trackedMap.get(String(repo.id)) ?? null,
            }))
            console.log("Repos: ", githubRepos.map((repo: any) => `${repo.id}-${repo.name}`))
            console.log("Tracked Map: ", trackedMap)
            return { repos }
        }),

    trackRepo: protectedProcedure.input(TrackRepo).mutation(async ({ ctx, input }) => {
        const existing = await db.trackedRepo.findUnique({
            where: {
                userId_githubRepoId: {
                    userId: ctx.session.user.id,
                    githubRepoId: input.githubRepoId
                }
            }
        })
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already tracking" })

        const tracked = await db.trackedRepo.create({
            data: {
                userId: ctx.session.user.id,
                githubRepoId: input.githubRepoId,
                name: input.name,
                fullName: input.fullName,
                owner: input.owner,
                isPrivate: input.isPrivate,
                syncStatus: "pending",
            }
        })

        return { success: true, trackedRepoId: tracked.id }
    }),

    untrackRepo: protectedProcedure
        .input(UntrackRepo)
        .mutation(async ({ ctx, input }) => {
            const trackedRepo = await db.trackedRepo.findUnique({
                where: {
                    userId_githubRepoId: {
                        userId: ctx.session.user.id,
                        githubRepoId: input.githubRepoId,
                    }
                },
                select: { id: true, githubRepoId: true }
            })

            if (!trackedRepo) return { success: true } // already gone

            await db.$transaction(async (tx) => {
                // 1. Find all PRs for this repo
                const prs = await tx.pullRequest.findMany({
                    where: { repoId: trackedRepo.githubRepoId },
                    select: { id: true }
                })
                const prIds = prs.map(p => p.id)

                // 2. Delete all reviews for those PRs
                if (prIds.length > 0) {
                    await tx.pRReview.deleteMany({
                        where: { prId: { in: prIds } }
                    })
                }

                // 3. Delete all PRs
                await tx.pullRequest.deleteMany({
                    where: { repoId: trackedRepo.githubRepoId }
                })

                // 4. Delete the tracked repo
                await tx.trackedRepo.delete({
                    where: { id: trackedRepo.id }
                })
            })

            return { success: true }
        }),

    syncRepo: protectedProcedure.input(SyncSchema).mutation(async ({ ctx, input }) => {
        const githubSession = await getGithubSession()
        if (!githubSession?.token) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "GitHub not connected" });
        }

        const trackedRepo = await db.trackedRepo.findFirst({
            where: { fullName: input.repoFullName, userId: ctx.session.user.id }
        })
        if (!trackedRepo) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Repo not tracked" })
        }

        // Mark as syncing immediately
        await db.trackedRepo.update({
            where: { id: trackedRepo.id },
            data: { syncStatus: "syncing", syncRequestedAt: new Date() }
        })
        try {
            const octokit = new Octokit({ auth: githubSession.token })
            const [owner, repo] = input.repoFullName.split("/")

            const webhookId = await registerWebhook(octokit, owner, repo, trackedRepo.id)

            const pullRequests = await octokit.paginate(octokit.rest.pulls.list, {
                owner, repo, state: "all", per_page: 100,
            })

            // Fetch PR details + reviews in parallel (much faster than sequential)
            await Promise.all(pullRequests.map(async (pr) => {
                const [{ data: detail }, { data: reviews }, {data: commits}] = await Promise.all([
                    octokit.rest.pulls.get({ owner, repo, pull_number: pr.number }),
                    octokit.rest.pulls.listReviews({ owner, repo, pull_number: pr.number }),
                    octokit.rest.pulls.listCommits({owner, repo, pull_number: pr.number,
                    })
                ])

                await upsertPullRequest(trackedRepo.githubRepoId, detail, reviews, commits)
            }))

            // Mark as done
            await db.trackedRepo.update({
                where: { id: trackedRepo.id },
                data: {
                    syncStatus: "done",
                    lastSyncedAt: new Date(),
                    syncError: null,
                    ...(webhookId ? { webhookId } : {}),
                }
            })

            return { success: true }

        } catch (e) {
            // Mark as error so the UI can show a retry button
            await db.trackedRepo.update({
                where: { id: trackedRepo.id },
                data: {
                    syncStatus: "error",
                    syncError: e instanceof Error ? e.message : "Unknown error"
                }
            })
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sync failed" })
        }
    }),

    repoMetrics: protectedProcedure.input(RepoMetrics).query(async ({ctx, input}) => {
        const trackedRepo = await db.trackedRepo.findFirst({
            where: {
                owner: input.owner,
                name: input.name,
                userId: ctx.session.user.id
            }
        })

        if(!trackedRepo){
            throw new TRPCError({ code: "NOT_FOUND", message: "Repo not tracked" })
        }

        const prs = await db.pullRequest.findMany
    })
})

export type github = typeof gitRouter