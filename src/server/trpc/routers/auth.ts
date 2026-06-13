import { db } from "@/src/lib/prisma";
import { SigninSchema, SignupSchema } from "../schemas/auth";
import { publicProcedure, createTRPCRouter, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs"
import { createSession, deleteAllSessions, deleteSession } from "@/src/utils/session";

export const authRouter = createTRPCRouter({
    signup: publicProcedure
        .input(SignupSchema)
        .mutation(async ({ ctx, input }) => {
            const existingEmail = await db.user.findFirst({
                where: {
                    email: input.email
                }
            })
            if (existingEmail) {
                throw new TRPCError({ code: "CONFLICT", message: "Email already in use" })
            }

            const existingUsername = await db.user.findFirst({
                where: {
                    username: input.username
                }
            })
            if (existingUsername) {
                throw new TRPCError({ code: "CONFLICT", message: "Username already taken" })
            }

            const hashed = await bcrypt.hash(input.password, 12)
            const user = await db.user.create({
                data: {
                    email: input.email,
                    username: input.username,
                    password: hashed
                }
            })
            await createSession(user.id)

            return { success: true, message: "User created successfully", userId: user.id }

        }),

    signin: publicProcedure
        .input(SigninSchema)
        .mutation(async ({ ctx, input }) => {

            const user = await db.user.findUnique({
                where: {
                    email: input.email
                },
                select: {
                    id: true,
                    password: true,
                    email: true
                }
            })
            if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" })
            console.log(ctx, input, user)

            const valid = await bcrypt.compare(input.password, user.password)
            if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });

            await deleteAllSessions(user.id)

            await createSession(user.id)

            return { success: true, message: "Signed in successfully", userId: user.id }

        }),

    logout: protectedProcedure.mutation(async () => {

        await deleteSession();
        return { success: true, message: "Signed Out successfully" };

    }),

    me: protectedProcedure.query(({ ctx }) => {
        return ctx.session.user;
    }),
})

export type auth = typeof authRouter