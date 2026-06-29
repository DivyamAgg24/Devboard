import { upsertPullRequest, verifyWebhookSignature } from "@/src/lib/github";
import { classifyPRSize, computeCycleTime, computeMetrics } from "@/src/lib/metrics";
import { db } from "@/src/lib/prisma";
import { getGithubSession } from "@/src/utils/session";
import { Octokit } from "@octokit/rest";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const payload = await req.text()
    const signature = req.headers.get("x-hub-signature-256")
    const event = req.headers.get("x-github-event")

    if (!verifyWebhookSignature(payload, signature)) {
        return NextResponse.json({ error: "Invalid Signature" }, { status: 401 })
    }

    const body = JSON.parse(payload)
    if (event === "pull_request") {
        console.log("Event is pull_request")
        const action = body.action
        const refetchActions = ["closed", "synchronize", "ready_for_review", "converted_to_draft"]

        // These actions only need a lightweight metric recompute from existing DB data
        const recomputeOnly = ["reopened"]

        if (refetchActions.includes(action)) {
            await handlePullRequestEvent(body)
        } else if (recomputeOnly.includes(action)) {
            await recomputeMetricsFromDB(body)
        }
    } else if (event === "pull_request_review") {
        console.log("Event is pull_request_review")
        await handlePullRequestReviewEvent(body)
    }

    return NextResponse.json({ ok: true })
}

async function handlePullRequestEvent(body: any) {
    const repoGithubId = String(body.repository.id)

    const trackedRepo = await db.trackedRepo.findUnique({
        where: { githubRepoId: repoGithubId },
        select: {
            id: true,
            githubRepoId: true,
            user: {
                select: {
                    oauthConnections: {
                        where: {
                            provider: "GitHub"
                        }
                    }
                }
            }
        }
    })
    if (!trackedRepo) {
        return
    }

    const token = (await getGithubSession())?.token
    if (!token) return

    const octokit = new Octokit({ auth: token })
    const prNumber = body.pull_request.number
    const owner = body.repository.owner.login
    const repo = body.repository.name
    const [{ data: detail }, { data: reviews }] = await Promise.all([
        octokit.rest.pulls.get({ owner, repo, pull_number: prNumber }),
        octokit.rest.pulls.listReviews({ owner, repo, pull_number: prNumber })
    ])

    await upsertPullRequest(trackedRepo.githubRepoId, detail, reviews)

}

async function handlePullRequestReviewEvent(body: any) {
    await handlePullRequestEvent(body)
}


async function recomputeMetricsFromDB(body: any) {
    const repoGithubId = String(body.repository.id)
    const githubPrId   = String(body.pull_request.id)

    const pr = await db.pullRequest.findUnique({
        where:   { githubPrId },
        include: {
            reviews: true,
            pullRequestCommits: {
                include: { commit: true }
            }
        }
    })

    if (!pr) return

    const commits = pr.pullRequestCommits.map(pc => pc.commit)
    const firstCommitAt = commits.length > 0
        ? new Date(Math.min(...commits.map(c => c.committedAt.getTime())))
        : null

    const cycleTime = computeCycleTime(pr.createdAt, pr.mergedAt, firstCommitAt)
    const prSize    = classifyPRSize(pr.additions, pr.deletions)
    const { firstReviewAt, timeToFirstReview } = computeMetrics(
        
        { created_at: pr.createdAt.toISOString(), merged_at: pr.mergedAt?.toISOString() ?? null } as any,
        pr.reviews.map(r => ({ submitted_at: r.submittedAt.toISOString(), state: r.state })) as any,
        pr.authorLogin
    )

    await db.pullRequest.update({
        where: { githubPrId },
        data: {
            cycleTime,
            prSize,
            firstReviewAt,
            timeToFirstReview,
            metricsComputedAt: new Date(),
        }
    })
}