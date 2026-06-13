import { getSession } from '@/src/utils/session';
import { initTRPC, TRPCError } from '@trpc/server';

export const createTRPCContext = async (opts: { headers: Headers }) => {
    const session = await getSession()
    return { session };
};
const t = initTRPC
    .context<Awaited<ReturnType<typeof createTRPCContext>>>()
    .create({});


const authCheck = t.middleware(({ ctx, next }) => {
    if (!ctx.session.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No session found" })
    }
    return next({ ctx: {session: { user: ctx.session.user }} })
})

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authCheck)