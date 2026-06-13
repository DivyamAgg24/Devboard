import { upsertPullRequest, verifyWebhookSignature } from "@/src/lib/github";
import { db } from "@/src/lib/prisma";
import { getGithubSession } from "@/src/utils/session";
import { Octokit } from "@octokit/rest";
import { error } from "console";
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
        await handlePullRequestEvent(body)
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
    if (!trackedRepo){
        return
    }

    const token = (await getGithubSession())?.token
    if (!token) return

    const octokit = new Octokit({auth: token})
    const prNumber = body.pull_request.number
    const owner = body.repository.owner.login
    const repo = body.repository.name
    const [{data: detail}, {data: reviews}] = await Promise.all([
        octokit.rest.pulls.get({owner, repo, pull_number: prNumber}),
        octokit.rest.pulls.listReviews({owner, repo, pull_number: prNumber})
    ])

    await upsertPullRequest(trackedRepo.githubRepoId, detail, reviews)
    
}

async function handlePullRequestReviewEvent(body: any) {
    // A review event also contains the full PR — reuse the same handler
    await handlePullRequestEvent(body)
}