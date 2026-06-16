// src/components/PRDataTable.tsx
"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { useTRPC } from "@/src/trpc/client"
import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { Badge } from "@/src/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import { Input } from "@/src/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { ExternalLinkIcon, SearchIcon } from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMins(mins: number | null): string {
    if (mins === null) return "—"
    if (mins < 60)    return `${Math.round(mins)}m`
    const h = Math.floor(mins / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
}

const STATE_STYLES: Record<string, string> = {
    open:   "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    merged: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
    closed: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
}

const SIZE_STYLES: Record<string, string> = {
    small:  "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800",
    medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    large:  "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
    xl:     "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    repoId: string // "owner/name"
}

export function PRDataTable({ repoId }: Props) {
    const trpc = useTRPC()
    const [owner, name] = repoId.split("/")

    const { data } = useSuspenseQuery(trpc.github.repoMetrics.queryOptions({ owner, name }))
    const { metrics } = data

    const [search,      setSearch]      = useState("")
    const [stateFilter, setStateFilter] = useState<string>("all")
    const [sizeFilter,  setSizeFilter]  = useState<string>("all")
    const [page,        setPage]        = useState(0)
    const PAGE_SIZE = 15

    // Get flat PR list from metrics — you may want a dedicated tRPC query
    // for large repos. For now pull from the metrics data already fetched.
    const { prs } = data as any // will be added to tRPC response below

    if (!prs?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Pull Requests</CardTitle>
                    <CardDescription>No pull requests found.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const filtered = prs.filter((pr: any) => {
        const matchSearch = !search
            || pr.title.toLowerCase().includes(search.toLowerCase())
            || String(pr.number).includes(search)
            || pr.authorLogin.toLowerCase().includes(search.toLowerCase())
        const matchState = stateFilter === "all" || pr.state === stateFilter
        const matchSize  = sizeFilter  === "all" || pr.prSize === sizeFilter
        return matchSearch && matchState && matchSize
    })

    const pages    = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-base">Pull Requests</CardTitle>
                        <CardDescription>
                            {filtered.length} of {prs.length} PRs
                        </CardDescription>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search PRs..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(0) }}
                                className="h-8 w-44 pl-8 text-sm"
                            />
                        </div>
                        <Select value={stateFilter} onValueChange={v => { setStateFilter(v); setPage(0) }}>
                            <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All states</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="merged">Merged</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sizeFilter} onValueChange={v => { setSizeFilter(v); setPage(0) }}>
                            <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sizes</SelectItem>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="xl">XL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="px-0 pb-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-6 w-12">#</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden sm:table-cell">Author</TableHead>
                            <TableHead className="hidden md:table-cell">State</TableHead>
                            <TableHead className="hidden md:table-cell">Size</TableHead>
                            <TableHead className="hidden lg:table-cell text-right">Review time</TableHead>
                            <TableHead className="hidden lg:table-cell text-right pr-6">Cycle time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.map((pr: any) => (
                            <TableRow key={pr.githubPrId} className="group">
                                <TableCell className="pl-6 text-muted-foreground text-xs tabular-nums">
                                    {pr.number}
                                </TableCell>
                                <TableCell className="max-w-70">
                                    <a
                                        href={`https://github.com/${repoId}/pull/${pr.number}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 font-medium text-sm hover:underline"
                                    >
                                        <span className="truncate">{pr.title}</span>
                                        <ExternalLinkIcon className="size-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                                    </a>
                                    {pr.isDraft && (
                                        <span className="text-[10px] text-muted-foreground">Draft</span>
                                    )}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage
                                                src={`https://github.com/${pr.authorLogin}.png?size=32`}
                                                alt={pr.authorLogin}
                                            />
                                            <AvatarFallback className="text-[9px]">
                                                {pr.authorLogin.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground">
                                            {pr.authorLogin}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] capitalize ${STATE_STYLES[pr.state] ?? ""}`}
                                    >
                                        {pr.state}
                                    </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {pr.prSize && (
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] capitalize ${SIZE_STYLES[pr.prSize] ?? ""}`}
                                        >
                                            {pr.prSize}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-right text-xs tabular-nums text-muted-foreground">
                                    {formatMins(pr.timeToFirstReview)}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-right text-xs tabular-nums text-muted-foreground pr-6">
                                    {formatMins(pr.cycleTime ? pr.cycleTime * 60 : null)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex items-center justify-between border-t px-6 py-3">
                        <span className="text-xs text-muted-foreground">
                            Page {page + 1} of {pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="rounded-md border px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-muted transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                                disabled={page >= pages - 1}
                                className="rounded-md border px-2.5 py-1 text-xs disabled:opacity-40 hover:bg-muted transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}