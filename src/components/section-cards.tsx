// src/components/section-cards.tsx
"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { GitFork, Star, Circle, Lock } from "lucide-react"

type Repo = {
    id: number
    name: string
    description: string | null
    stargazers_count: number
    forks_count: number
    language: string | null
    private: boolean
    updated_at: string
    html_url: string
}

export function SectionCards({ repos }: { repos: Repo[] }) {
    if (!repos?.length) {
        return (
            <div className="px-4 lg:px-6 text-sm text-muted-foreground">
                No repositories found.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {repos.map((repo) => (  // ← was missing return
                <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    <Card className="hover:ring-foreground/20 transition-all cursor-pointer h-full">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="truncate">{repo.name}</CardTitle>
                                {repo.private && (
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                        <Lock className="size-3 mr-1" />
                                        Private
                                    </Badge>
                                )}
                            </div>
                            {repo.description && (
                                <CardDescription className="line-clamp-2">
                                    {repo.description}
                                </CardDescription>
                            )}
                        </CardHeader>

                        <CardFooter className="flex items-center gap-3 text-xs text-muted-foreground">
                            {repo.language && (
                                <span className="flex items-center gap-1">
                                    <Circle className="size-2.5 fill-[#332fb5]" />
                                    {repo.language}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Star className="size-3" />
                                {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                                <GitFork className="size-3" />
                                {repo.forks_count}
                            </span>
                            <span className="ml-auto">
                                {new Date(repo.updated_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        </CardFooter>
                    </Card>
                </a>
            ))}
        </div>
    )
}