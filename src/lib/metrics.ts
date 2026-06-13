import { Octokit } from "@octokit/rest"
import { differenceInMinutes, differenceInHours, startOfWeek, format } from "date-fns"

export type GitHubPR = Awaited<ReturnType<Octokit["rest"]["pulls"]["get"]>>["data"]

export type GitHubReview = Awaited<ReturnType<Octokit["rest"]["pulls"]["listReviews"]>>["data"][number]

export type GitHubCommit = Awaited<ReturnType<Octokit["rest"]["pulls"]["listCommits"]>>["data"]

export type PRSizeLabel = "small" | "medium" | "large" | "xl"

export function computeMetrics(pr: GitHubPR, reviews: GitHubReview[]) {
    const openedAt = new Date(pr.created_at).getTime()

    // First review = earliest submitted_at across all reviews
    const reviewTimes = reviews
        .filter(r => r.submitted_at)
        .map(r => new Date(r.submitted_at!).getTime())
        .sort((a, b) => a - b)

    const firstReviewAt = reviewTimes.length > 0 ? new Date(reviewTimes[0]) : null

    // timeToFirstReview: minutes from PR open to first review
    const timeToFirstReview = firstReviewAt
        ? Math.floor((firstReviewAt.getTime() - openedAt) / 60000)
        : null

    // timeToMerge: minutes from PR open to merge
    const timeToMerge = pr.merged_at
        ? Math.floor((new Date(pr.merged_at).getTime() - openedAt) / 60000)
        : null

    return { firstReviewAt, timeToFirstReview, timeToMerge }
}

export function computeCycleTime(prCreatedAt: Date, mergedAt: Date | null, firstCommitAt: Date | null): number | null {
    if (!mergedAt) return null  // only compute for merged PRs

    const startDate = firstCommitAt
        ? new Date(Math.min(firstCommitAt.getTime(), prCreatedAt.getTime()))
        : prCreatedAt

    return differenceInHours(mergedAt, startDate)
}

export function classifyPRSize(additions: number, deletions: number) {
    const total = additions + deletions

    if (total <= 50) return "small"
    if (total <= 250) return "medium"
    if (total <= 1000) return "large"
    return "xl"
}

type PRRow = {
    githubPrId: string
    authorLogin: string
    state: string
    additions: number
    deletions: number
    prSize: PRSizeLabel | null
    cycleTime: number | null
    timeToFirstReview: number | null
    timeToMerge: number | null
    mergedAt: Date | null
    createdAt: Date
    reviews: { reviewerLogin: string }[]
    pullRequestCommits: {
        commit: { committedAt: Date; commitFiles: { filename: string }[] }
    }[]
}

export function computeRepoMetrics(prs: PRRow[]) {
    const merged = prs.filter(p => p.state === "merged")
    const open = prs.filter(p => p.state === "open")
    const closed = prs.filter(p => p.state === "closed")

    const cycleTimes = merged.map(p => p.cycleTime).filter((v): v is number => v !== null)

    const ttfrValues = prs
        .map(p => p.timeToFirstReview)
        .filter((v): v is number => v !== null)

    const ttmValues = merged
        .map(p => p.timeToMerge)
        .filter((v): v is number => v !== null)

    const sizeDistribution: Record<PRSizeLabel, number> = { small: 0, medium: 0, large: 0, xl: 0 }
    for (const pr of prs) {
        const size = pr.prSize ?? classifyPRSize(pr.additions, pr.deletions)
        sizeDistribution[size]++
    }

    const now = new Date()
    const weekBuckets: Record<string, number> = {}

    for (let i = 11; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 7)
        const key = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
        weekBuckets[key] = 0
    }

    for (const pr of merged) {
        if (!pr.mergedAt) continue
        const key = format(startOfWeek(pr.mergedAt, { weekStartsOn: 1 }), "yyyy-MM-dd")
        if (key in weekBuckets) weekBuckets[key]++
    }

    const deploymentFrequency = Object.entries(weekBuckets).map(([week, merges]) => ({
        week,
        merges,
    }))

    const contributorMap = new Map<string, {
        prsOpened: number
        prsReviewed: Set<string>
        totalSize: number
        mergeTimes: number[]
    }>()
}