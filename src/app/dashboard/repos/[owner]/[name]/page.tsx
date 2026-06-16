// app/dashboard/repos/[owner]/[name]/page.tsx
import { SiteHeader } from "@/src/components/site-header"
import { getQueryClient, trpc } from "@/src/trpc/server"
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { MetricsDashboard } from "@/src/components/MetricsDashboard"
import { notFound } from "next/navigation"

interface Props {
    params: Promise<{ owner: string; name: string }>
}

export default async function RepoMetricsPage({ params }: Props) {
    const { owner, name } = await params

    const queryClient = getQueryClient()

    try {
        await queryClient.prefetchQuery(
            trpc.github.repoMetrics.queryOptions({ owner, name })
        )
    } catch {
        notFound()
    }

    return (
        <>
            <SiteHeader title={`${owner} / ${name}`} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col">
                    <HydrationBoundary state={dehydrate(queryClient)}>
                        <MetricsDashboard owner={owner} name={name} />
                    </HydrationBoundary>
                </div>
            </div>
        </>
    )
}