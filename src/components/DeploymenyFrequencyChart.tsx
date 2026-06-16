// src/components/DeploymentFrequencyChart.tsx
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { format, parseISO } from "date-fns"

interface Props {
    data: { week: string; merges: number }[]
}

const chartConfig = {
    merges: {
        label: "Merges",
        color: "var(--primary)",
    },
} satisfies ChartConfig

export function DeploymentFrequencyChart({ data }: Props) {
    const formatted = data.map(d => ({
        ...d,
        label: format(parseISO(d.week), "MMM d"),
    }))

    const totalMerges = data.reduce((s, d) => s + d.merges, 0)
    const avgPerWeek  = (totalMerges / data.length).toFixed(1)

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base">Deployment Frequency</CardTitle>
                        <CardDescription>Merges to main per week · last 12 weeks</CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-semibold tabular-nums">{avgPerWeek}x</div>
                        <div className="text-xs text-muted-foreground">avg / week</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-55 w-full">
                    <AreaChart
                        data={formatted}
                        margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="deployGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}   />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            tickMargin={8}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11 }}
                            allowDecimals={false}
                            width={32}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(_, payload) => {
                                        const item = payload?.[0]?.payload
                                        return item ? `Week of ${item.label}` : ""
                                    }}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey="merges"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fill="url(#deployGradient)"
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}