"use client"

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStudentDistribution } from "@/lib/hooks/use-student-distribution"
import type { DistributionEntry, ProgramEntry, YearLevelEntry } from "@/lib/hooks/use-student-distribution"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function buildConfig(items: { id: string; name: string }[]): ChartConfig {
  return Object.fromEntries(
    items.map((item, i) => [
      item.id,
      { label: item.name, color: CHART_COLORS[i % CHART_COLORS.length] },
    ])
  )
}

function DonutChart({
  title,
  data,
  nameKey,
  total,
}: {
  title: string
  data: (DistributionEntry | ProgramEntry)[]
  nameKey: "name" | "code"
  total: number
}) {
  const config = buildConfig(data)

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[160px]">
          <p className="text-xs text-muted-foreground">No data</p>
        </CardContent>
      </Card>
    )
  }

  const pieData = data.map((d) => ({
    id: d.id,
    name: nameKey === "code" ? (d as ProgramEntry).code : d.name,
    fullName: d.name,
    value: d.count,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{total} students</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[160px] w-full">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={2}
            >
              {pieData.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{item.payload?.fullName ?? name}</span>
                      <span className="text-xs text-muted-foreground">
                        {value} students ({total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)
                      </span>
                    </div>
                  )}
                  hideLabel
                />
              }
            />
          </PieChart>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-2 space-y-1">
          {pieData.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2 text-xs">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate text-muted-foreground flex-1">{d.fullName}</span>
              <span className="font-medium shrink-0">{d.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function YearLevelBar({ data }: { data: YearLevelEntry[] }) {
  const config: ChartConfig = {
    count: { label: "Students", color: "var(--chart-1)" },
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By Year Level</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[140px]">
          <p className="text-xs text-muted-foreground">No data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">By Year Level</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function StudentDistributionCharts({ yearId }: { yearId: string }) {
  const { distribution, isLoading } = useStudentDistribution(yearId)

  const totalStudents =
    distribution.by_college.reduce((sum, c) => sum + c.count, 0)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-[160px] bg-muted/50 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const hasData = totalStudents > 0

  if (!hasData) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No enrolled students found for this academic year.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Student population charts will appear once students are enrolled in classrooms.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DonutChart
          title="By College"
          data={distribution.by_college}
          nameKey="name"
          total={totalStudents}
        />
        <DonutChart
          title="By Department"
          data={distribution.by_department}
          nameKey="name"
          total={totalStudents}
        />
        <DonutChart
          title="By Program"
          data={distribution.by_program}
          nameKey="code"
          total={totalStudents}
        />
      </div>
      <YearLevelBar data={distribution.by_year_level} />
    </div>
  )
}
