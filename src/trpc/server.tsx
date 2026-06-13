import "server-only"

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query"
import { headers } from "next/headers"
import { cache } from "react"
import { createTRPCContext } from "../server/trpc/trpc"
import { makeQueryClient } from "../server/trpc/query-client"
import appRouter from "../server/trpc/appRouter"

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
    ctx: async () => createTRPCContext({headers: await headers()}),
    router: appRouter,
    queryClient: getQueryClient
})