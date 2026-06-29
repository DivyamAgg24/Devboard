import { Octokit } from "@octokit/rest"
import { differenceInMinutes, differenceInHours, startOfWeek, format } from "date-fns"

export type GitHubPR = Awaited<ReturnType<Octokit["rest"]["pulls"]["get"]>>["data"]

export type GitHubReview = Awaited<ReturnType<Octokit["rest"]["pulls"]["listReviews"]>>["data"][number]

export type GitHubCommit = Awaited<ReturnType<Octokit["rest"]["pulls"]["listCommits"]>>["data"]

export type PRSizeLabel = "small" | "medium" | "large" | "xl"

export function computeMetrics(pr: GitHubPR | any, reviews: GitHubReview[] | any, prAuthorLogin: String) {
    const openedAt = new Date(pr.created_at).getTime()

    // First review = earliest submitted_at across all reviews
    const reviewTimes = reviews
        .filter((r: any) => r.submitted_at && r.user?.login !== prAuthorLogin)
        .map((r: any) => new Date(r.submitted_at!).getTime())
        .sort((a: any, b: any) => a - b)

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

function median(nums: number[]): number | null {
    if (!nums.length) return null
    const sorted = [...nums].sort((a, b) => a - b)
    const mid    = Math.floor(sorted.length / 2)
    if (sorted.length % 2 == 0){
        return (sorted[mid - 1] + sorted[mid]) / 2
    }
    else{
        return sorted[mid]
    }
}

function average(nums: number[]): number | null {
    if (!nums.length) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
}

export type RepoMetrics = {
    // Overview
    totalPRs:        number
    openPRs:         number
    mergedPRs:       number
    closedPRs:       number

    // Cycle time (hours)
    avgCycleTime:    number | null
    medianCycleTime: number | null

    // Review turnaround (minutes)
    avgTimeToFirstReview:    number | null
    medianTimeToFirstReview: number | null

    // Merge time (minutes)  
    avgTimeToMerge:    number | null
    medianTimeToMerge: number | null

    // PR size distribution
    sizeDistribution: Record<PRSizeLabel, number>

    // Deployment frequency (merges to main per week, last 12 weeks)
    deploymentFrequency: { week: string; merges: number }[]

    // Contributor leaderboard
    contributors: {
        login:        string
        prsOpened:    number
        prsReviewed:  number
        avgPRSize:    number
        avgTimeToMerge: number | null
        mergeCount: number
    }[]

    // Code churn (files changed multiple times within 2-week windows)
    churnedFiles: { filename: string; changeCount: number }[]
}

type PRRow = {
    id: string,
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

    for (const pr of prs) {
        const a = contributorMap.get(pr.authorLogin) ?? { prsOpened: 0, prsReviewed: new Set(), totalSize: 0, mergeTimes: [] }
        a.prsOpened++
        a.totalSize += pr.additions + pr.deletions
        if (pr.timeToMerge !== null) a.mergeTimes.push(pr.timeToMerge)
        contributorMap.set(pr.authorLogin, a)

        for (const review of pr.reviews) {
            const r = contributorMap.get(review.reviewerLogin) ?? { prsOpened: 0, prsReviewed: new Set(), totalSize: 0, mergeTimes: [] }
            r.prsReviewed.add(pr.githubPrId)
            contributorMap.set(review.reviewerLogin, r)
        }
    }
    const contributors = [...contributorMap.entries()].map(([login, data]) => ({
        login,
        prsOpened: data.prsOpened,
        prsReviewed: data.prsReviewed.size,
        avgPRSize: data.prsOpened > 0 ? Math.round(data.totalSize / data.prsOpened) : 0,
        avgTimeToMerge: average(data.mergeTimes),
        mergeCount: data.mergeTimes.length
    })).sort((a, b) => b.mergeCount - a.mergeCount)

    const fileWindows = new Map<string, Date[]>()
    const windowMs = 14 * 24 * 60 * 60 * 1000
    for (const pr of prs) {
        for (const prc of pr.pullRequestCommits) {
            const date = prc.commit.committedAt
            for (const file of prc.commit.commitFiles) {
                const times = fileWindows.get(file.filename) ?? []
                times.push(date)
                fileWindows.set(file.filename, times)
            }
        }
    }

    const churnedFiles = [...fileWindows.entries()].map(([filename, dates]) => {
        const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
        let maxInWindow = 1, windowStart = 0
        for (let i = 1; i < sorted.length; i++) {
            while (sorted[i].getTime() - sorted[windowStart].getTime() > windowMs) windowStart++
            maxInWindow = Math.max(maxInWindow, i - windowStart + 1)
        }
        return { filename, changeCount: maxInWindow }
    }).filter(f => f.changeCount >= 3).sort((a, b) => a.changeCount - b.changeCount)


    return {
        totalPRs: prs.length,
        openPRs:   open.length,
        mergedPRs: merged.length,
        closedPRs: closed.length,

        avgCycleTime: average(cycleTimes),
        medianCycleTime: median(cycleTimes),

        avgTimeToFirstReview:    average(ttfrValues),
        medianTimeToFirstReview: median(ttfrValues),

        avgTimeToMerge:    average(ttmValues),
        medianTimeToMerge: median(ttmValues),

        sizeDistribution,
        deploymentFrequency,
        contributors,
        churnedFiles,
    }
}