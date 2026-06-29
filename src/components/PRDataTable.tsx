// src/components/PRDataTable.tsx

import { useCallback, useState } from "react"
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
import { ExternalLinkIcon, Loader2Icon, SearchIcon } from "lucide-react"
import { useTRPC } from "../trpc/client"
import { useDebounce } from "@/src/hooks/useDebounce"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Button } from "./ui/button"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMins(mins: number | null): string {
    if (mins === null) return "—"
    if (mins < 60) return `${Math.round(mins)}m`
    const h = Math.floor(mins / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
}

const STATE_STYLES: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    merged: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
    closed: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
}

const SIZE_STYLES: Record<string, string> = {
    small: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800",
    medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    large: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
    xl: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    owner: string
    name:  string
}

export function PRDataTable({ owner, name }: Props) {
    const trpc = useTRPC()

    const [search,      setSearch]      = useState("")
    const [stateFilter, setStateFilter] = useState("all")
    const [sizeFilter,  setSizeFilter]  = useState("all")

    const debouncedSearch = useDebounce(search, 300)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery(
        trpc.github.repoPRs.infiniteQueryOptions(
            {
                owner,
                name,
                limit:  20,
                state:  stateFilter as any,
                size:   sizeFilter  as any,
                search: debouncedSearch || undefined,
            },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
            }
        )
    )

    // Flatten pages into a single list
    const prs = data?.pages.flatMap(p => p.prs) ?? []
    const totalFetched = prs.length

    const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
        setter(v)
    }, [])

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-base">Pull Requests</CardTitle>
                        <CardDescription>
                            {isLoading ? "Loading..." : `${totalFetched} loaded${hasNextPage ? " · more available" : ""}`}
                        </CardDescription>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search PRs..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="h-8 w-44 pl-8 text-sm"
                            />
                        </div>
                        <Select value={stateFilter} onValueChange={handleFilterChange(setStateFilter)}>
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
                        <Select value={sizeFilter} onValueChange={handleFilterChange(setSizeFilter)}>
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

            <CardContent className="px-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-6 w-12">#</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden sm:table-cell">Author</TableHead>
                            <TableHead className="hidden md:table-cell">State</TableHead>
                            <TableHead className="hidden md:table-cell">Size</TableHead>
                            <TableHead className="hidden lg:table-cell text-right">1st Review</TableHead>
                            <TableHead className="hidden lg:table-cell text-right pr-6">Cycle Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(7)].map((_, j) => (
                                        <TableCell key={j}>
                                            <div className="h-4 rounded bg-muted animate-pulse" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : prs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                                    No pull requests match your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            prs.map((pr) => (
                                <TableRow key={pr.githubPrId} className="group">
                                    <TableCell className="pl-6 text-muted-foreground text-xs tabular-nums">
                                        {pr.number}
                                    </TableCell>
                                    <TableCell className="max-w-70">
                                        <a
                                            href={`https://github.com/${owner}/${name}/pull/${pr.number}`}
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
                                        {pr.cycleTime !== null ? `${pr.cycleTime}h` : "—"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Load more */}
                {hasNextPage && (
                    <div className="flex justify-center border-t py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="gap-2"
                        >
                            {isFetchingNextPage && (
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                            )}
                            {isFetchingNextPage ? "Loading..." : "Load more"}
                        </Button>
                    </div>
                )}

                {/* End of results */}
                {!hasNextPage && prs.length > 0 && (
                    <div className="border-t py-3 text-center text-xs text-muted-foreground">
                        All {totalFetched} pull requests loaded
                    </div>
                )}
            </CardContent>
        </Card>
    )
}