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