// src/components/RepoDashboard.tsx
"use client"

import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTRPC } from "@/src/trpc/client"
import { Suspense, useState } from "react"
import { RepoGrid, RepoGridSkeleton } from "./RepoGrid"

function RepoDashboardInner() {
    const trpc = useTRPC()
    const qc = useQueryClient()
    const [search, setSearch] = useState("")

    const { data } = useSuspenseQuery(trpc.github.repos.queryOptions())

    const trackMutation = useMutation(trpc.github.trackRepo.mutationOptions({
        onMutate: async (input) => {
            await qc.cancelQueries(trpc.github.repos.queryFilter())
            const previous = qc.getQueryData(trpc.github.repos.queryKey())
            qc.setQueryData(trpc.github.repos.queryKey(), (old: any) => ({
                ...old,
                repos: old.repos.map((r: any) =>
                    r.githubRepoId === input.githubRepoId
                        ? { ...r, tracked: { syncStatus: "pending", lastSyncedAt: null } }
                        : r
                )
            }))
            return { previous }
        },
        onSuccess: (_data, input) => {
            // Immediately update UI to "syncing" then kick off sync
            qc.setQueryData(trpc.github.repos.queryKey(), (old: any) => ({
                ...old,
                repos: old.repos.map((r: any) =>
                    r.githubRepoId === input.githubRepoId
                        ? { ...r, tracked: { syncStatus: "syncing", lastSyncedAt: null } }
                        : r
                )
            }))
            syncRepo.mutate({ repoFullName: input.fullName })
        },
        onError: (_err, _input, ctx) => {
            if (ctx?.previous) qc.setQueryData(trpc.github.repos.queryKey(), ctx.previous)
        },
    }))

    const untrackMutation = useMutation(trpc.github.untrackRepo.mutationOptions({
        onMutate: async (input) => {
            await qc.cancelQueries(trpc.github.repos.queryFilter())
            const previous = qc.getQueryData(trpc.github.repos.queryKey())
            qc.setQueryData(trpc.github.repos.queryKey(), (old: any) => ({
                ...old,
                repos: old.repos.map((r: any) =>
                    r.githubRepoId === input.githubRepoId
                        ? { ...r, tracked: null }
                        : r
                )
            }))
            return { previous }
        },
        onError: (_err, _input, ctx) => {
            if (ctx?.previous) qc.setQueryData(trpc.github.repos.queryKey(), ctx.previous)
        },
        onSettled: () => qc.invalidateQueries(trpc.github.repos.queryFilter()),
    }))

    const syncRepo = useMutation(trpc.github.syncRepo.mutationOptions({
        onSuccess: (_data, input) => {
            // Sync done — invalidate to fetch fresh syncStatus: "done" from DB
            qc.invalidateQueries(trpc.github.repos.queryFilter())
        },
        onError: (_err, input) => {
            // Show error state on the card
            qc.setQueryData(trpc.github.repos.queryKey(), (old: any) => ({
                ...old,
                repos: old.repos.map((r: any) =>
                    r.fullName === input.repoFullName
                        ? { ...r, tracked: { ...r.tracked, syncStatus: "error" } }
                        : r
                )
            }))
        }
    }))

    const repos = data.repos
    const tracked = repos.filter((r: any) => r.tracked)
    const filtered = repos.filter((r: any) =>
        !search || r.fullName.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-8 px-4 py-6 lg:px-6">

            {/* Tracked section */}
            {tracked.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Tracked
                        </h2>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {tracked.length} repo{tracked.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <RepoGrid
                        repos={tracked}
                        onTrack={r => trackMutation.mutate(r)}
                        onUntrack={id => untrackMutation.mutate({ githubRepoId: id })}
                        pendingId={trackMutation.isPending ? trackMutation.variables?.githubRepoId : undefined}
                    />
                </section>
            )}

            {/* All repos section */}
            <section>
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                        All Repos
                    </h2>
                    <input
                        type="text"
                        placeholder="Search repos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <RepoGrid
                    repos={filtered}
                    onTrack={r => trackMutation.mutate(r)}
                    onUntrack={id => untrackMutation.mutate({ githubRepoId: id })}
                    pendingId={trackMutation.isPending ? trackMutation.variables?.githubRepoId : undefined}
                />
            </section>

        </div>
    )
}

export function RepoDashboard() {
    return (
        <Suspense fallback={<RepoDashboardSkeleton />}>
            <RepoDashboardInner />
        </Suspense>
    )
}

function RepoDashboardSkeleton() {
    return (
        <div className="flex flex-col gap-8 px-4 py-6 lg:px-6">
            {["Tracked", "All Repos"].map(label => (
                <section key={label}>
                    <div className="h-4 w-24 rounded bg-muted animate-pulse mb-4" />
                    <RepoGridSkeleton />
                </section>
            ))}
        </div>
    )
}