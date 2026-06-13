import { authRouter } from "./routers/auth";
import { gitRouter } from "./routers/github";
import { publicProcedure, createTRPCRouter } from "./trpc"
import { z } from "zod"


export const appRouter = createTRPCRouter({
    auth: authRouter,
    github: gitRouter
})

export type AppRouter = typeof appRouter
export default appRouter