// src/components/MetricsStatCards.tsx
"use client"

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardFooter,
} from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import {
    GitMergeIcon,
    TimerIcon,
    MessageSquareIcon,
    ZapIcon,
} from "lucide-react"
import type { RepoMetrics } from "@/src/lib/metrics"

function formatMinutes(mins: number | null): string {
    if (mins === null) return "—"
    if (mins < 60) return `${Math.round(mins)}m`
    const h = Math.floor(mins / 60)
    const m = Math.round(mins % 60)
    if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`
    const d = Math.floor(h / 24)
    const rh = h % 24
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

function formatHours(hours: number | null): string {
    if (hours === null) return "—"
    if (hours < 24) return `${Math.round(hours)}h`
    const d = Math.floor(hours / 24)
    const h = Math.round(hours % 24)
    return h > 0 ? `${d}d ${h}h` : `${d}d`
}

interface Props {
    metrics: RepoMetrics
}

export function MetricsStatCards({ metrics }: Props) {
    // Avg merges/week over last 12 weeks
    const totalMerges   = metrics.deploymentFrequency.reduce((s, w) => s + w.merges, 0)
    const avgDeployFreq = (totalMerges / 12).toFixed(1)

    const cards = [
        {
            title:       "Total PRs",
            value:       metrics.totalPRs,
            description: `${metrics.mergedPRs} merged · ${metrics.openPRs} open · ${metrics.closedPRs} closed`,
            icon:        <GitMergeIcon className="size-4 text-muted-foreground" />,
            badge:       metrics.mergedPRs > 0
                ? `${Math.round((metrics.mergedPRs / metrics.totalPRs) * 100)}% merge rate`
                : null,
            footer:      "All time across this repository",
        },
        {
            title:       "Avg Cycle Time",
            value:       formatHours(metrics.avgCycleTime),
            description: `Median ${formatHours(metrics.medianCycleTime)}`,
            icon:        <TimerIcon className="size-4 text-muted-foreground" />,
            badge:       metrics.avgCycleTime !== null
                ? metrics.avgCycleTime <= 24  ? "Fast"
                : metrics.avgCycleTime <= 72  ? "Moderate"
                : "Slow"
                : null,
            footer:      "First commit → PR merged",
        },
        {
            title:       "Time to First Review",
            value:       formatMinutes(metrics.avgTimeToFirstReview),
            description: `Median ${formatMinutes(metrics.medianTimeToFirstReview)}`,
            icon:        <MessageSquareIcon className="size-4 text-muted-foreground" />,
            badge:       metrics.avgTimeToFirstReview !== null
                ? metrics.avgTimeToFirstReview <= 60   ? "Excellent"
                : metrics.avgTimeToFirstReview <= 480  ? "Good"
                : metrics.avgTimeToFirstReview <= 1440 ? "Slow"
                : "Critical"
                : null,
            footer:      "PR opened → first review submitted",
        },
        {
            title:       "Deploy Frequency",
            value:       `${avgDeployFreq}x`,
            description: `${totalMerges} merges over 12 weeks`,
            icon:        <ZapIcon className="size-4 text-muted-foreground" />,
            badge:       Number(avgDeployFreq) >= 5  ? "Elite"
                       : Number(avgDeployFreq) >= 1  ? "High"
                       : Number(avgDeployFreq) >= 0.5 ? "Medium"
                       : "Low",
            footer:      "Merges to main per week (DORA)",
        },
    ]

    const badgeStyle: Record<string, string> = {
        Fast:      "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950",
        Moderate:  "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950",
        Slow:      "text-orange-700 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950",
        Critical:  "text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
        Excellent: "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950",
        Good:      "text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
        Elite:     "text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950",
        High:      "text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950",
        Medium:    "text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950",
        Low:       "text-red-700 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
    }

    return (
        <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title} className="@container/card">
                    <CardHeader>
                        <CardDescription className="flex items-center gap-1.5">
                            {card.icon}
                            {card.title}
                        </CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                            {card.value}
                        </CardTitle>
                        {card.badge && (
                            <CardAction>
                                <Badge
                                    variant="outline"
                                    className={badgeStyle[card.badge] ?? ""}
                                >
                                    {card.badge}
                                </Badge>
                            </CardAction>
                        )}
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1 text-sm">
                        <div className="text-muted-foreground text-xs">{card.description}</div>
                        <div className="text-muted-foreground text-xs">{card.footer}</div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}