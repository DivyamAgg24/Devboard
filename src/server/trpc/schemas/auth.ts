import z from "zod";

export const SignupSchema = z.object({
    username: z.string().min(5, { error: "Username should be at least 5 characters long" }).max(20, { error: "Username should be at most 20 characters long" }),
    email: z.email({ error: "Invalid email address" }),
    password: z.string().min(8, "Minimum 8 characters")
        .max(32, "Maximum 32 characters")
        .regex(/[A-Z]/, "Must contain one uppercase letter")
        .regex(/[a-z]/, "Must contain one lowercase letter")
        .regex(/[0-9]/, "Must contain one number")
        .regex(/[^A-Za-z0-9]/, "Must contain one special character")
})

export const SigninSchema = z.object({
    email: z.email({ error: "Invalid email address" }),
    password: z.string().min(8, "Minimum 8 characters")
        .max(32, "Maximum 32 characters")
        .regex(/[A-Z]/, "Must contain one uppercase letter")
        .regex(/[a-z]/, "Must contain one lowercase letter")
        .regex(/[0-9]/, "Must contain one number")
        .regex(/[^A-Za-z0-9]/, "Must contain one special character")
})