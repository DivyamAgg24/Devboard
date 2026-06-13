// src/components/RepoGrid.tsx
"use client"

import Link from "next/link"
import { GitFork, Star, Lock, Circle, CheckCircle2, Loader2, AlertCircle, PlusCircle, X } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/src/components/ui/card"

type Repo = {
    githubRepoId: string
    name:         string
    fullName:     string
    owner:        string
    description:  string | null
    isPrivate:    boolean
    language:     string | null
    stars:        number
    forks:        number
    updatedAt:    string
    tracked: {
        syncStatus:  string
        lastSyncedAt: string | null
        syncError?:  string | null
    } | null
}

type TrackInput = {
    githubRepoId: string
    name:         string
    fullName:     string
    owner:        string
    isPrivate:    boolean
}

interface RepoGridProps {
    repos:     Repo[]
    onTrack:   (input: TrackInput) => void
    onUntrack: (githubRepoId: string) => void
    pendingId?: string
}

export function RepoGrid({ repos, onTrack, onUntrack, pendingId }: RepoGridProps) {
    if (!repos.length) {
        return (
            <p className="text-sm text-muted-foreground py-4">No repositories found.</p>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
            {repos.map(repo => (
                <RepoCard
                    key={repo.githubRepoId}
                    repo={repo}
                    onTrack={onTrack}
                    onUntrack={onUntrack}
                    isPending={pendingId === repo.githubRepoId}
                />
            ))}
        </div>
    )
}

function RepoCard({
    repo,
    onTrack,
    onUntrack,
    isPending,
}: {
    repo:      Repo
    onTrack:   (input: TrackInput) => void
    onUntrack: (id: string) => void
    isPending: boolean
}) {
    const { tracked } = repo
    const status = isPending ? "pending" : tracked?.syncStatus

    const cardContent = (
        <Card className={[
            "h-full transition-all",
            status === "done"  ? "hover:ring-foreground/20 cursor-pointer" : "",
            status === "error" ? "ring-red-300 dark:ring-red-800" : "",
        ].join(" ")}>

            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate text-sm">{repo.name}</CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {repo.isPrivate && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground border rounded-full px-1.5 py-0.5">
                                <Lock className="size-2.5" /> Private
                            </span>
                        )}
                        <StatusBadge
                            status={status}
                            lastSyncedAt={tracked?.lastSyncedAt ?? null}
                        />
                    </div>
                </div>

                {repo.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                        {repo.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardFooter className="flex items-center gap-3 text-xs text-muted-foreground">
                {repo.language && (
                    <span className="flex items-center gap-1">
                        <Circle className="size-2.5 fill-current" />
                        {repo.language}
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <Star className="size-3" /> {repo.stars}
                </span>
                <span className="flex items-center gap-1">
                    <GitFork className="size-3" /> {repo.forks}
                </span>

                {/* Track / Untrack button */}
                <span className="ml-auto">
                    <TrackButton
                        status={status}
                        isPending={isPending}
                        onTrack={() => onTrack({
                            githubRepoId: repo.githubRepoId,
                            name:         repo.name,
                            fullName:     repo.fullName,
                            owner:        repo.owner,
                            isPrivate:    repo.isPrivate,
                        })}
                        onUntrack={() => onUntrack(repo.githubRepoId)}
                    />
                </span>
            </CardFooter>
        </Card>
    )

    // Only tracked+done repos are clickable to metrics page
    if (status === "done") {
        return (
            <Link href={`/dashboard/repos/${repo.owner}/${repo.name}`}>
                {cardContent}
            </Link>
        )
    }

    return cardContent
}

function StatusBadge({
    status,
    lastSyncedAt,
}: {
    status?:      string
    lastSyncedAt: string | null
}) {
    if (!status) return null

    if (status === "done") {
        const ago = lastSyncedAt ? timeAgo(lastSyncedAt) : null
        return (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                {ago ? `synced ${ago}` : "synced"}
            </span>
        )
    }

    if (status === "syncing") {
        return (
            <span className="flex items-center gap-1 text-[10px] text-blue-500">
                <Loader2 className="size-3 animate-spin" />
                syncing
            </span>
        )
    }

    if (status === "pending") {
        return (
            <span className="flex items-center gap-1 text-[10px] text-amber-500">
                <Loader2 className="size-3 animate-spin" />
                queued
            </span>
        )
    }

    if (status === "error") {
        return (
            <span className="flex items-center gap-1 text-[10px] text-red-500">
                <AlertCircle className="size-3" />
                error
            </span>
        )
    }

    return null
}

function TrackButton({
    status,
    isPending,
    onTrack,
    onUntrack,
}: {
    status?:   string
    isPending: boolean
    onTrack:   () => void
    onUntrack: () => void
}) {
    if (!status) {
        return (
            <button
                onClick={e => { e.preventDefault(); onTrack() }}
                disabled={isPending}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
            >
                <PlusCircle className="size-3.5" />
                Track
            </button>
        )
    }

    if (status === "pending" || status === "syncing") {
        return (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {status === "syncing" ? "Syncing..." : "Queued..."}
            </span>
        )
    }

    if (status === "error") {
        return (
            <button
                onClick={e => { e.preventDefault(); onTrack() }}
                className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-400 transition-colors"
            >
                <AlertCircle className="size-3.5" />
                Retry
            </button>
        )
    }

    // done — show untrack option
    return (
        <button
            onClick={e => { e.preventDefault(); onUntrack() }}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors group"
        >
            <CheckCircle2 className="size-3.5 text-emerald-500 group-hover:hidden" />
            <X className="size-3.5 hidden group-hover:block" />
            <span className="group-hover:hidden">Tracking</span>
            <span className="hidden group-hover:block">Untrack</span>
        </button>
    )
}

export function RepoGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
        </div>
    )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}