"use client"

import { useState, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/src/trpc/client"
import { useRouter } from "next/navigation"
import { TRPCClientError } from "@trpc/client"

// ─── Password Strength ────────────────────────────────────────────────────────

type StrengthLevel = "empty" | "weak" | "fair" | "good" | "strong"

interface StrengthResult {
    level: StrengthLevel
    score: number       // 0–4
    label: string
    checks: {
        length: boolean   // >= 8 chars
        longEnough: boolean // >= 12 chars
        number: boolean
        symbol: boolean
        uppercase: boolean
    }
}

function getPasswordStrength(password: string): StrengthResult {
    const checks = {
        length: password.length >= 8,
        longEnough: password.length >= 12,
        number: /[0-9]/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
        uppercase: /[A-Z]/.test(password),
    }

    if (!password) return { level: "empty", score: 0, label: "", checks }

    let score = 0
    if (checks.length) score++
    if (checks.longEnough) score++
    if (checks.number) score++
    if (checks.symbol) score++
    // uppercase doesn't add score — just a displayed check

    const map: Record<number, { level: StrengthLevel; label: string }> = {
        0: { level: "weak", label: "Too short" },
        1: { level: "weak", label: "Weak" },
        2: { level: "fair", label: "Fair" },
        3: { level: "good", label: "Good" },
        4: { level: "strong", label: "Strong" },
    }

    return { ...map[score], score, checks }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PasswordMeter({ password }: { password: string }) {
    const { level, label, score, checks } = getPasswordStrength(password)
    if (!password) return null

    const barColor: Record<StrengthLevel, string> = {
        empty: "",
        weak: "bg-red-500",
        fair: "bg-amber-400",
        good: "bg-lime-500",
        strong: "bg-emerald-500",
    }

    const labelColor: Record<StrengthLevel, string> = {
        empty: "",
        weak: "text-red-500",
        fair: "text-amber-500",
        good: "text-lime-600",
        strong: "text-emerald-600",
    }

    return (
        <div className="mt-2 space-y-2">
            {/* Bars */}
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={[
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            i < score ? barColor[level] : "bg-gray-200 ",
                        ].join(" ")}
                    />
                ))}
            </div>

            {/* Label + checks row */}
            <div className="flex items-center justify-between">
                <span className={`text-xs font-medium transition-colors ${labelColor[level]}`}>
                    {label}
                </span>
                <div className="flex gap-3">
                    {(
                        [
                            { key: "length", label: "8+ chars" },
                            { key: "number", label: "number" },
                            { key: "symbol", label: "symbol" },
                            { key: "uppercase", label: "A-Z" },
                        ] as const
                    ).map(({ key, label }) => (
                        <span
                            key={key}
                            className={[
                                "flex items-center gap-1 text-[11px] transition-colors",
                                checks[key]
                                    ? "text-emerald-600 "
                                    : "text-gray-400",
                            ].join(" ")}
                        >
                            <svg
                                viewBox="0 0 12 12"
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                {checks[key] ? (
                                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                    <circle cx="6" cy="6" r="4" strokeDasharray="2 2" />
                                )}
                            </svg>
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

function parseErrorMessage(err: unknown): string {
    if (!(err instanceof TRPCClientError)) return "Something went wrong. Please try again."

    // BAD_REQUEST means Zod validation failed — message is a JSON string of issues
    if (err.data?.code === "BAD_REQUEST") {
        try {
            const issues = JSON.parse(err.message) as { path: string[]; message: string }[]
            // Map each issue to "fieldName: message", filter to fields we care about
            return issues
                .map((i) => {
                    const field = i.path.length > 0 ? `${i.path[0]}: ` : ""
                    return `${field}${i.message}`
                })
                .join(" · ")
        } catch {
            return err.message
        }
    }

    // UNAUTHORIZED → show as-is (our own message from the server)
    if (err.data?.code === "UNAUTHORIZED") return err.message

    return "Something went wrong. Please try again."
}

interface FieldErrorProps {
    message?: string
}

function FieldError({ message }: FieldErrorProps) {
    if (!message) return <div className="mt-1.5 h-4" />
    return (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11z" />
            </svg>
            {message}
        </p>
    )
}

// ─── Form state / validation ──────────────────────────────────────────────────

interface FormValues {
    username: string
    email: string
    password: string
    confirm: string
}

interface FormErrors {
    username?: string
    email?: string
    password?: string
    confirm?: string
}

function validate(values: FormValues): FormErrors {
    const errors: FormErrors = {}

    if (!values.username.trim()) {
        errors.username = "Username is required"
    } else if (values.username.trim().length < 3) {
        errors.username = "Must be at least 3 characters"
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.username.trim())) {
        errors.username = "Only letters, numbers and underscores"
    }

    if (!values.email.trim()) {
        errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = "Enter a valid email address"
    }

    const strength = getPasswordStrength(values.password)
    if (!values.password) {
        errors.password = "Password is required"
    } else if (strength.score < 2) {
        errors.password = "Password is too weak"
    }

    if (!values.confirm) {
        errors.confirm = "Please confirm your password"
    } else if (values.confirm !== values.password) {
        errors.confirm = "Passwords do not match"
    }

    return errors
}

// ─── Eye icon ─────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" strokeLinecap="round" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" strokeLinecap="round" />
            <path d="M1 1l22 22" strokeLinecap="round" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupPage() {
    const router = useRouter()
    const trpc = useTRPC()

    const [values, setValues] = useState<FormValues>({
        username: "",
        email: "",
        password: "",
        confirm: "",
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [serverError, setServerError] = useState("")

    // Only show an error if the field has been touched
    const visibleError = useCallback(
        (field: keyof FormErrors) => (touched[field] ? errors[field] : undefined),
        [errors, touched]
    )

    const signup = useMutation(
        trpc.auth.signup.mutationOptions({
            onSuccess: () => {
                router.push("/dashboard")
                router.refresh()
            },
            onError: (err) => {
                setServerError(parseErrorMessage(err))
                if (err instanceof TRPCClientError) {
                    if (err.data?.code === "CONFLICT") {
                        if (err.message.toLowerCase().includes("username")) {
                            setErrors((prev) => ({ ...prev, username: err.message }))
                            setTouched((prev) => ({ ...prev, username: true }))
                        } else {
                            setErrors((prev) => ({ ...prev, email: err.message }))
                            setTouched((prev) => ({ ...prev, email: true }))
                        }
                    }
                    // INTERNAL_SERVER_ERROR surfaces via signup.error below
                }
            },
        })
    )

    function handleChange(field: keyof FormValues, value: string) {
        const next = { ...values, [field]: value }
        setValues(next)
        setServerError("")

        // Re-validate eagerly only for touched fields
        if (touched[field]) {
            setErrors(validate(next))
        }

        // Always re-validate confirm when password changes
        if (field === "password" && touched.confirm) {
            setErrors(validate(next))
        }
    }

    function handleBlur(field: keyof FormValues) {
        setTouched((prev) => ({ ...prev, [field]: true }))
        setErrors(validate(values))
    }

    function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault()

        // Touch all fields to surface all errors
        setTouched({ username: true, email: true, password: true, confirm: true })
        const errs = validate(values)
        setErrors(errs)
        if (Object.keys(errs).length > 0) return

        signup.mutate({
            username: values.username.trim(),
            email: values.email.trim(),
            password: values.password,
        })
    }

    const inputBase =
        "w-full rounded-lg border bg-white  px-3 py-2.5 text-sm text-gray-900  outline-none transition-all placeholder:text-gray-400 focus:ring-2"

    const inputClass = (field: keyof FormErrors) => {
        const err = visibleError(field)
        const ok = touched[field] && !errors[field] && values[field]
        if (err)
            return `${inputBase} border-red-400 focus:ring-red-200 `
        if (ok)
            return `${inputBase} border-emerald-400 focus:ring-emerald-100 `
        return `${inputBase} border-gray-200 focus:ring-gray-200 `
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md">

                {/* Brand */}
                <div className="mb-8 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#332fb5]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                    </div>
                    <span className="text-lg tracking-tight text-gray-900">
                        Devboard
                    </span>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-normal tracking-tight text-gray-900">
                        Create your account
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Join thousands of developers building in public.
                    </p>

                    {/* Server error banner */}
                    {signup.error instanceof TRPCClientError &&
                        signup.error.data?.code === "INTERNAL_SERVER_ERROR" && (
                          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 ">
                              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
                                 <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11z" />
                              </svg>
                              {signup.error.message}
                          </div>
                      )}
                    {serverError && (
                        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                            <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
                                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11z" />
                            </svg>
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">

                        {/* Username */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={values.username}
                                    onChange={(e) => handleChange("username", e.target.value)}
                                    onBlur={() => handleBlur("username")}
                                    placeholder="cooldev42"
                                    autoComplete="username"
                                    className={inputClass("username")}
                                />
                                {touched.username && !errors.username && values.username && (
                                    <CheckMark />
                                )}
                            </div>
                            <FieldError message={visibleError("username")} />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={values.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    onBlur={() => handleBlur("email")}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className={inputClass("email")}
                                />
                                {touched.email && !errors.email && values.email && (
                                    <CheckMark />
                                )}
                            </div>
                            <FieldError message={visibleError("email")} />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500 ">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={values.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    onBlur={() => handleBlur("password")}
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    className={`${inputClass("password")} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label="Toggle password visibility"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600  transition-colors"
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                            <PasswordMeter password={values.password} />
                            <FieldError message={visibleError("password")} />
                        </div>

                        {/* Confirm */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500 ">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={values.confirm}
                                    onChange={(e) => handleChange("confirm", e.target.value)}
                                    onBlur={() => handleBlur("confirm")}
                                    placeholder="Repeat password"
                                    autoComplete="new-password"
                                    className={`${inputClass("confirm")} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    aria-label="Toggle confirm password visibility"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600  transition-colors"
                                >
                                    <EyeIcon open={showConfirm} />
                                </button>
                                {touched.confirm && !errors.confirm && values.confirm && (
                                    <CheckMark right={30} />
                                )}
                            </div>
                            <FieldError message={visibleError("confirm")} />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={signup.isPending}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#332fb5]  px-4 py-2.5 text-sm font-medium text-white  transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {signup.isPending ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Creating account…
                                </>
                            ) : (
                                <>
                                    Create account
                                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-sm text-gray-500 ">
                    Already have an account?{" "}
                    <a href="/login" className="font-medium text-[#332fb5]  underline underline-offset-2">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
}

// Small inline checkmark for valid fields
function CheckMark({ right = 12 }: { right?: number }) {
    return (
        <span
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-emerald-500"
            style={{ right }}
        >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    )
}