import Link from "next/link";
import { getSession } from "@/src/utils/session";
import {
    GitMergeIcon,
    TimerIcon,
    ZapIcon,
    UsersIcon,
    TrendingUpIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    CheckIcon,
} from "lucide-react";

// ─── Inline stat card used in the hero ───────────────────────────────────────

function HeroStatCard({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-xl font-semibold tabular-nums text-gray-900">{value}</span>
            <span className="text-xs text-gray-500">{label}</span>
        </div>
    );
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#332fb5]/10 text-[#332fb5]">
                {icon}
            </div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{description}</p>
        </div>
    );
}

// ─── Metric pill used in "What you'll see" section ───────────────────────────

function MetricPill({ label, value, delta }: { label: string; value: string; delta?: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums text-gray-900">{value}</span>
                {delta && (
                    <span className="text-xs font-medium text-emerald-600">{delta}</span>
                )}
            </div>
        </div>
    );
}

// ─── Step in "How it works" ───────────────────────────────────────────────────

function Step({
    step,
    title,
    description,
}: {
    step: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#332fb5] text-sm font-semibold text-white">
                {step}
            </div>
            <div className="flex flex-col gap-1 pt-1">
                <span className="font-semibold text-gray-900">{title}</span>
                <span className="text-sm leading-relaxed text-gray-500">{description}</span>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
    const session = await getSession();
    const ctaHref = session ? "/dashboard" : "/signup";

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">

            <main className="mx-auto max-w-6xl px-6 lg:px-8">

                {/* ── Hero ── */}
                <section className="flex flex-col items-start gap-8 pb-20 pt-20 lg:pt-28">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#332fb5]/20 bg-[#332fb5]/5 px-3 py-1 text-xs font-medium text-[#332fb5]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#332fb5]" />
                        GitHub OAuth · No setup required
                    </div>

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
                        <div className="flex flex-col gap-6 lg:col-span-3">
                            <h1 className="text-5xl font-semibold uppercase leading-tight tracking-tight text-gray-900 lg:text-6xl">
                                Your team's engineering health,{" "}
                                <span className="text-[#332fb5]">visualised</span>
                            </h1>
                            <p className="max-w-lg text-lg leading-relaxed text-gray-500">
                                From your PRs to your deployments, view all your GitHub metrics in one place.
                                Devboard helps you find points of delay and optimize your workflows.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={ctaHref}
                                    className="flex items-center gap-2 rounded-full bg-[#332fb5] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2a26a0] transition-colors"
                                >
                                    Get started free
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="#how-it-works"
                                    className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                >
                                    See how it works
                                </Link>
                            </div>
                        </div>

                        {/* Hero stat cards */}
                        <div className="flex flex-col justify-center gap-3 lg:col-span-2">
                            <HeroStatCard value="1.4d"  label="Avg cycle time tracked" />
                            <HeroStatCard value="3.2x"  label="Deploy frequency (DORA elite)" />
                            <HeroStatCard value="47m"   label="Median time to first review" />
                            <HeroStatCard value="84%"   label="PR review coverage" />
                        </div>
                    </div>
                </section>

                {/* ── What you'll see ── */}
                <section className="rounded-2xl border border-gray-100 bg-gray-50 px-8 py-10">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-[#332fb5]">Live metrics</p>
                            <h2 className="mt-1 text-xl font-semibold text-gray-900">What you'll see in your dashboard</h2>
                        </div>
                        <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 sm:block">
                            Updated on every push
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        <MetricPill label="Avg PR cycle time"          value="1.4 days"   delta="↓ 18%" />
                        <MetricPill label="Time to first review"       value="47 min"     delta="↓ 22%" />
                        <MetricPill label="PRs merged this week"       value="24"         delta="↑ 6" />
                        <MetricPill label="Deploy frequency"           value="3.2x / wk"  />
                        <MetricPill label="Review coverage"            value="84%"        delta="↑ 4%" />
                        <MetricPill label="High-churn files detected"  value="3 files"    />
                    </div>
                </section>

                {/* ── Features ── */}
                <section id="features" className="py-20">
                    <div className="mb-12 text-center">
                        <p className="text-xs font-medium uppercase tracking-widest text-[#332fb5]">What we do</p>
                        <h2 className="mt-2 text-3xl font-semibold text-gray-900">One place for all your metrics</h2>
                        <p className="mx-auto mt-3 max-w-xl text-gray-500">
                            Connect your GitHub via OAuth. Every metric that matters to your engineering team, surfaced automatically.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard
                            icon={<TimerIcon className="h-5 w-5" />}
                            title="Cycle time"
                            description="Measure from first commit to merge. See exactly where time is lost — in review, in draft, or waiting on CI."
                        />
                        <FeatureCard
                            icon={<GitMergeIcon className="h-5 w-5" />}
                            title="PR analytics"
                            description="Track PR size, review turnaround, and merge rates per repo and per author. Spot bottlenecks before they slow your team."
                        />
                        <FeatureCard
                            icon={<ZapIcon className="h-5 w-5" />}
                            title="Deployment frequency"
                            description="DORA-aligned. See how often you ship to main, week by week. Compare against industry benchmarks."
                        />
                        <FeatureCard
                            icon={<UsersIcon className="h-5 w-5" />}
                            title="Contributor leaderboard"
                            description="Understand who's reviewing, who's merging, and who might be overloaded. Balance the load across your team."
                        />
                        <FeatureCard
                            icon={<TrendingUpIcon className="h-5 w-5" />}
                            title="Code churn"
                            description="Files changed repeatedly in short windows signal instability. Devboard flags them automatically so you can address the root cause."
                        />
                        <FeatureCard
                            icon={<ShieldCheckIcon className="h-5 w-5" />}
                            title="Live via webhooks"
                            description="Metrics update the moment a PR is opened, reviewed, or merged. No manual syncs. No stale data."
                        />
                    </div>
                </section>

                {/* ── How it works ── */}
                <section id="how-it-works" className="border-t border-gray-100 py-20">
                    <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-[#332pb5]">Setup</p>
                            <h2 className="mt-2 text-3xl font-semibold text-gray-900">Running in under two minutes</h2>
                            <p className="mt-3 text-gray-500">
                                No config files. No YAML. Connect GitHub, pick a repo, and your metrics appear.
                            </p>
                        </div>
                        <div className="flex flex-col gap-6">
                            <Step
                                step="1"
                                title="Create an account"
                                description="Sign up with your email. No credit card required."
                            />
                            <Step
                                step="2"
                                title="Connect GitHub"
                                description="OAuth in one click. We only request the permissions we need — read access to your repos and pull requests."
                            />
                            <Step
                                step="3"
                                title="Pick repos to track"
                                description="Choose which repositories you want metrics for. Devboard syncs your PR history and sets up a webhook for live updates."
                            />
                            <Step
                                step="4"
                                title="Read your dashboard"
                                description="Cycle time, review turnaround, deploy frequency, contributor activity — all in one view, updated automatically."
                            />
                        </div>
                    </div>
                </section>

                {/* ── CTA banner ── */}
                <section className="mb-20 rounded-2xl bg-[#332fb5] px-8 py-12 text-center">
                    <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                        Start understanding your engineering velocity
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-sm text-blue-200">
                        Free to use. Connect a repo in under two minutes.
                    </p>
                    <Link
                        href={ctaHref}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#332fb5] hover:bg-blue-50 transition-colors"
                    >
                        Get started
                        <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                </section>

            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-gray-100 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                        <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
                            <span className="font-semibold text-gray-900">Devboard</span>
                            <p className="text-xs leading-relaxed text-gray-400">
                                Engineering metrics for teams that ship.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Product</span>
                            <div className="flex flex-col gap-2">
                                <Link href="#features"      className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</Link>
                                <Link href="#how-it-works"  className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</Link>
                                <Link href="/dashboard"     className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <span className="text-xs font-medium uppercase tracking-widest text-gray-400">Account</span>
                            <div className="flex flex-col gap-2">
                                <Link href="/signup" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign up</Link>
                                <Link href="/login"  className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
                            </div>
                        </div>
                    
                    </div>
                    <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
                        <span className="text-xs text-gray-400">© {new Date().getFullYear()} Devboard</span>
                    </div>
                </div>
            </footer>

        </div>
    );
}