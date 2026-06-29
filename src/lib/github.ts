import { Octokit } from "@octokit/rest";
import { db } from "@/src/lib/prisma";
import crypto from "crypto"
import { classifyPRSize, computeCycleTime, computeMetrics, GitHubCommit, GitHubPR, GitHubReview } from "@/src/lib/metrics";

function derivePRState(pr: GitHubPR): "open" | "closed" | "merged" {
    if (pr.merged_at) return "merged"
    if (pr.state === "closed") return "closed"
    return "open"
}

function deriveReviewState(state: string): "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | null {
    if (state === "APPROVED") return "APPROVED"
    if (state === "CHANGES_REQUESTED") return "CHANGES_REQUESTED"
    if (state === "COMMENTED") return "COMMENTED"
    return null // DISMISSED, PENDING — skip these
}

export const upsertPullRequest = async (githubrepoId: string, pr: GitHubPR, reviews: GitHubReview[], commits?: GitHubCommit) => {

    const state = derivePRState(pr)
    const { firstReviewAt, timeToFirstReview, timeToMerge } = computeMetrics(pr, reviews, pr.user.login)
    const githubPrId = String(pr.id)

    const firstCommitAt = commits?.length ? new Date(Math.min(...commits.map(c => new Date(c.commit.author?.date ?? c.commit.committer?.date ?? new Date()).getTime()))) : null

    const cycleTime = computeCycleTime(new Date(pr.created_at), pr.merged_at ? new Date(pr.merged_at) : null, firstCommitAt)

    const prSize = classifyPRSize(pr.additions, pr.deletions)

    const upsertedPR = await db.pullRequest.upsert({
        where: {
            repoId_githubPrId: {
                repoId: githubrepoId,
                githubPrId
            }
        },
        create: {
            repoId: githubrepoId,
            githubPrId,
            number: pr.number,
            title: pr.title,
            authorLogin: pr.user.login ?? "unknown",
            state,
            isDraft: pr.draft,
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            firstReviewAt,
            timeToFirstReview,
            timeToMerge,
            cycleTime,
            prSize,
            metricsComputedAt: new Date()
            
        },
        update: {
            title: pr.title,
            state,
            isDraft: pr.draft ?? false,
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            updatedAt: new Date(pr.updated_at),
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
            firstReviewAt,
            timeToFirstReview,
            timeToMerge,
            cycleTime,
            prSize,
            metricsComputedAt: new Date()
        }
    })
    console.log("Upserted pr in upsertPullRequest ================ : ", upsertedPR)
    const validReviews = reviews.filter(r => {
        const state = deriveReviewState(r.state)
        return state !== null && r.submitted_at
    })

    if (validReviews.length > 0) {
        await db.pRReview.deleteMany({ where: { prId: upsertedPR.id } })
        await db.pRReview.createMany({
            data: validReviews.map(r => ({
                prId: upsertedPR.id,
                reviewerLogin: r.user?.login ?? "unknown",
                state: deriveReviewState(r.state)!,
                submittedAt: new Date(r.submitted_at!),
            }))
        })
    }

    if (commits && commits?.length > 0) {
        const commitIds: string[] = []
        for (const c of commits) {
            console.log('inside upsert pull request creating commit entry : ', c)
            const dbCommit = await db.commit.upsert({
                where: {
                    repoId_sha: {
                        repoId: githubrepoId,
                        sha: c.sha
                    }
                },
                create: {
                    repoId: githubrepoId,
                    url: c.url,
                    sha: c.sha,
                    message: c.commit.message,
                    authorLogin: c.author?.login ?? null,
                    authorEmail: c.commit.author?.email ?? "unknown",
                    committedAt: new Date(c.commit.author?.date ?? c.commit.committer?.date ?? Date.now()),
                    commitFiles: c.files && c.files.length > 0 ? {
                        createMany: {
                            data: c.files.map(f => ({
                                    filename: f.filename,
                                    additions: f.additions,
                                    deletions: f.deletions,
                                    changes: f.changes
                                }))
                            
                        }
                    } : undefined
                },
                update: {
                    message: c.commit.message,
                    authorLogin: c.author?.login ?? null,
                },
                select: {
                    id: true
                }
            })

            commitIds.push(dbCommit.id)

        }
        if (commitIds && commitIds.length > 0){
            for (const cid of commitIds){
                await db.pullRequestCommit.upsert({
                    where: {
                        prId_commitId: {
                            commitId: cid,
                            prId: upsertedPR.githubPrId
                        }
                    },
                    update: {},
                    create: {
                        prId: upsertedPR.githubPrId,
                        commitId: cid,
                    }
                })
            }
        }
    }

    return upsertedPR
}

export async function registerWebhook(
    octokit: Octokit,
    owner: string,
    repo: string,
    trackedRepoId: string
): Promise<string | null> {
    const webhookUrl = process.env.WEBHOOK_BASE_URL
    if (!webhookUrl) {
        // In dev without a tunnel, skip silently
        console.warn("WEBHOOK_BASE_URL not set — skipping webhook registration")
        return null
    }

    try {
        const { data: hook } = await octokit.rest.repos.createWebhook({
            owner,
            repo,
            config: {
                url: `${webhookUrl}/api/webhooks/github`,
                content_type: "json",
                secret: process.env.GITHUB_WEBHOOK_SECRET!,
            },
            events: ["pull_request", "pull_request_review"],
            active: true,
        })

        return String(hook.id)
    } catch (e: any) {
        // 422 = webhook already exists for this URL
        if (e.status === 422) {
            console.log(`Webhook already registered for ${owner}/${repo}`)
            console.log("E: ", e)
            return null
        }
        throw e
    }
}

export function verifyWebhookSignature(
    payload: string,
    signature: string | null
): boolean {
    if (!signature) return false
    const secret = process.env.GITHUB_WEBHOOK_SECRET!
    const expected = "sha256=" + crypto
        .createHmac("sha256", secret)
        .update(payload, "utf8")
        .digest("hex")
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
    )
}