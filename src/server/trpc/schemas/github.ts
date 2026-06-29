import z from "zod";

export const TrackRepo = z.object({
    githubRepoId: z.string(),
    name: z.string(),
    fullName: z.string(),
    owner: z.string(),
    isPrivate: z.boolean(),
})

export const UntrackRepo = z.object({
    githubRepoId: z.string()
})

export const SyncSchema = z.object({
    repoFullName: z.string()
})

export const RepoMetrics = z.object({ 
    owner: z.string(),
    name: z.string()
})

export const PRFilters = z.object({
    owner:       z.string(),
    name:        z.string(),
    cursor:      z.string().nullish(),
    limit:       z.number().min(1).max(100).default(20),
    state:       z.enum(["all", "open", "merged", "closed"]).default("all"),
    size:        z.enum(["all", "small", "medium", "large", "xl"]).default("all"),
    search:      z.string().optional(),
    dateFrom:    z.string().optional(),
    dateTo:      z.string().optional(),
})