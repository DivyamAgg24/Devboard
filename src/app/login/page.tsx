"use client"

import { useTRPC } from "@/src/trpc/client"
import { useMutation } from "@tanstack/react-query"
import { TRPCClientError } from "@trpc/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
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

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Enter a valid email address"
  }
  if (!password) {
    errors.password = "Password is required"
  }
  return errors
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const trpc = useTRPC()
  const router = useRouter()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [errors, setErrors]     = useState<FormErrors>({})
  const [touched, setTouched]   = useState<{ email?: boolean; password?: boolean }>({})
  const [serverError, setServerError] = useState("")

  const login = useMutation(
    trpc.auth.signin.mutationOptions({
      onSuccess: () => {
        router.push("/dashboard")
        router.refresh()
      },
      onError: (err) => {
        setServerError(parseErrorMessage(err))
      },
    })
  )

  function handleBlur(field: "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate(email, password))
  }

  function handleChange(field: "email" | "password", value: string) {
    if (field === "email") setEmail(value)
    else setPassword(value)
    setServerError("") // clear server error on any change
    if (touched[field]) {
      const next = field === "email" ? validate(value, password) : validate(email, value)
      setErrors(next)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const errs = validate(email, password)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setServerError("")
    login.mutate({ email: email.trim(), password })
  }

  const inputBase =
    "w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 bg-white outline-none transition-all placeholder:text-gray-400 focus:ring-2"

  const inputClass = (field: "email" | "password") => {
    const err = touched[field] ? errors[field] : undefined
    const ok  = touched[field] && !errors[field] && (field === "email" ? email : password)
    if (err) return `${inputBase} border-red-400 focus:ring-red-200`
    if (ok)  return `${inputBase} border-emerald-400 focus:ring-emerald-100`
    return       `${inputBase} border-gray-200 focus:ring-gray-200`
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
          <span className="text-lg tracking-tight text-gray-900">Devboard</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-normal tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue to your dashboard.
          </p>

          {/* Server error banner — only for UNAUTHORIZED / server failures */}
          {serverError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 6.5a.875.875 0 1 1 0-1.75A.875.875 0 0 1 8 11z" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-1">

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-gray-500">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass("email")}
                />
                {/* Green check when valid */}
                {touched.email && !errors.email && email && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </div>
              <FieldError message={touched.email ? errors.email : undefined} />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className={`${inputClass("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              <FieldError message={touched.password ? errors.password : undefined} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#332fb5] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {login.isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="/signup" className="font-medium text-[#332fb5] underline underline-offset-2">
            Sign up
          </a>
        </p>

      </div>
    </div>
  )
}