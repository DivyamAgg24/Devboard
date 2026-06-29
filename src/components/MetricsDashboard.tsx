// src/components/MetricsDashboard.tsx
"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useTRPC } from "@/src/trpc/client"
import { Suspense } from "react"
import { MetricsStatCards } from "./MetricsStatCards"
import { DeploymentFrequencyChart } from "./DeploymenyFrequencyChart"
import { PRSizeChart } from "./PRSizeChart"
import { PRDataTable } from "./PRDataTable"
import { ContributorLeaderboard } from "./ContributorLeaderboard"
import { Skeleton } from "@/src/components/ui/skeleton"
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

function SyncStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; className: string }> = {
        done:    { label: "Synced",   className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
        syncing: { label: "Syncing",  className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
        error:   { label: "Error",    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
        pending: { label: "Pending",  className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
    }
    const { label, className } = map[status] ?? map.pending
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
            {label}
        </span>
    )
}

function MetricsDashboardInner({ owner, name }: { owner: string; name: string }) {
    const trpc = useTRPC()
    const { data } = useSuspenseQuery(trpc.github.repoMetrics.queryOptions({ owner, name }))
    const { metrics, repo } = data

    const lastSynced = repo.lastSyncedAt
        ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
            -Math.round((Date.now() - new Date(repo.lastSyncedAt).getTime()) / 60000),
            "minute"
          )
        : null

    return (
        <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">

            {/* Page header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeftIcon className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold tracking-tight">{owner} / {name}</h1>
                            {repo.isPrivate && (
                                <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                            <SyncStatusBadge status={repo.syncStatus} />
                        </div>
                        {lastSynced && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Last synced {lastSynced}
                            </p>
                        )}
                    </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto">
                    <RefreshCwIcon className="h-3.5 w-3.5" />
                    Resync
                </Button>
            </div>

            {/* Stat cards */}
            <MetricsStatCards metrics={metrics} />

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Deployment frequency — wider */}
                <div className="lg:col-span-3">
                    <DeploymentFrequencyChart data={metrics.deploymentFrequency} />
                </div>
                {/* PR size distribution — narrower */}
                <div className="lg:col-span-2">
                    <PRSizeChart distribution={metrics.sizeDistribution} />
                </div>
            </div>

            {/* Contributor leaderboard */}
            <ContributorLeaderboard contributors={metrics.contributors} />

            {/* PR list */}
            <PRDataTable owner={owner} name={name} />

        </div>
    )
}

function MetricsDashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 @xl/main:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <Skeleton className="lg:col-span-3 h-72 rounded-xl" />
                <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
        </div>
    )
}

export function MetricsDashboard({ owner, name }: { owner: string; name: string }) {
    return (
        <Suspense fallback={<MetricsDashboardSkeleton />}>
            <MetricsDashboardInner owner={owner} name={name} />
        </Suspense>
    )
}