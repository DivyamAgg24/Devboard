// src/components/PRSizeChart.tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/src/components/ui/chart"
import type { PRSizeLabel } from "@/src/lib/metrics"

interface Props {
    distribution: Record<PRSizeLabel, number>
}

const SIZE_META: {
    key:         PRSizeLabel
    label:       string
    description: string
    color:       string
}[] = [
    { key: "small",  label: "Small",  description: "≤ 50 lines",   color: "var(--chart-1)" },
    { key: "medium", label: "Medium", description: "51-250 lines",  color: "var(--chart-2)" },
    { key: "large",  label: "Large",  description: "251-1000 lines",color: "var(--chart-3)" },
    { key: "xl",     label: "XL",     description: "> 1000 lines",  color: "var(--chart-4)" },
]

const chartConfig = {
    count: { label: "PRs" },
} satisfies ChartConfig

export function PRSizeChart({ distribution }: Props) {
    const data  = SIZE_META.map(s => ({ ...s, count: distribution[s.key] ?? 0 }))
    const total = data.reduce((s, d) => s + d.count, 0)

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">PR Size Distribution</CardTitle>
                <CardDescription>Lines changed per pull request · {total} total PRs</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <ChartContainer config={chartConfig} className="h-40 w-full">
                    <BarChart
                        data={data}
                        margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                        barSize={36}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            allowDecimals={false}
                            width={28}
                        />
                        <ChartTooltip
                            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) => {
                                        const item = payload?.[0]?.payload
                                        return item ? `${item.label} (${item.description})` : ""
                                    }}
                                />
                            }
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {data.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>

                {/* Legend with percentages */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {data.map(item => (
                        <div key={item.key} className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                style={{ background: item.color }}
                            />
                            <span className="text-xs text-muted-foreground flex-1 truncate">
                                {item.label}
                            </span>
                            <span className="text-xs font-medium tabular-nums">
                                {total > 0 ? Math.round((item.count / total) * 100) : 0}%
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}