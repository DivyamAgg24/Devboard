// src/components/ContributorLeaderboard.tsx
"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { GitPullRequestIcon, EyeIcon, ClockIcon, CodeIcon } from "lucide-react"
import type { RepoMetrics } from "@/src/lib/metrics"

type Contributor = RepoMetrics["contributors"][number]

function formatMergeTime(mins: number | null): string {
    if (mins === null) return "—"
    if (mins < 60)   return `${Math.round(mins)}m`
    const h = Math.floor(mins / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
}

function RankBadge({ rank }: { rank: number }) {
    const styles: Record<number, string> = {
        1: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
        2: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
        3: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
    }
    return (
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${styles[rank] ?? "bg-muted text-muted-foreground border-border"}`}>
            {rank}
        </span>
    )
}

function ContributorRow({ contributor, rank }: { contributor: Contributor; rank: number }) {
    const initials = contributor.login.slice(0, 2).toUpperCase()

    return (
        <div className="flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
            <RankBadge rank={rank} />

            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                    src={`https://github.com/${contributor.login}.png?size=64`}
                    alt={contributor.login}
                />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <a
                    href={`https://github.com/${contributor.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                >
                    {contributor.login}
                </a>
            </div>

            {/* Stats */}
            <div className="hidden gap-6 sm:flex">
                <Stat
                    icon={<GitPullRequestIcon className="size-3.5" />}
                    value={contributor.prsOpened}
                    label="PRs opened"
                />
                <Stat
                    icon={<EyeIcon className="size-3.5" />}
                    value={contributor.prsReviewed}
                    label="PRs reviewed"
                />
                <Stat
                    icon={<CodeIcon className="size-3.5" />}
                    value={`~${contributor.avgPRSize}`}
                    label="avg lines"
                />
                <Stat
                    icon={<ClockIcon className="size-3.5" />}
                    value={formatMergeTime(contributor.avgTimeToMerge)}
                    label="avg merge time"
                />
            </div>

            {/* Mobile — just show PR count */}
            <div className="flex sm:hidden">
                <Badge variant="outline" className="text-xs">
                    {contributor.prsOpened} PRs
                </Badge>
            </div>
        </div>
    )
}

function Stat({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode
    value: string | number
    label: string
}) {
    return (
        <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1 text-xs font-medium tabular-nums">
                <span className="text-muted-foreground">{icon}</span>
                {value}
            </div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
    )
}

interface Props {
    contributors: Contributor[]
}

export function ContributorLeaderboard({ contributors }: Props) {
    if (!contributors.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Contributors</CardTitle>
                    <CardDescription>No contributor data yet.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Contributor Leaderboard</CardTitle>
                        <CardDescription>
                            {contributors.length} contributor{contributors.length !== 1 ? "s" : ""} · ranked by PRs opened
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
                <div className="divide-y divide-border/50">
                    {contributors.slice(0, 10).map((contributor, i) => (
                        <ContributorRow
                            key={contributor.login}
                            contributor={contributor}
                            rank={i + 1}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}