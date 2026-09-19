"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartType } from "./visualization-panel"

interface ChartRendererProps {
  data: Record<string, unknown>[]
  chartType: Exclude<ChartType, "table">
  dimension: string | null
  metric: string | null
}

const CHART_COLORS = [
  "#0d9488",
  "#0f766e",
  "#14b8a6",
  "#64748b",
  "#94a3b8",
]

function getChartRows(
  data: Record<string, unknown>[],
  metric: string | null
): Record<string, unknown>[] {
  if (!metric) {
    return []
  }

  return data.filter((row) => {
    const value = row[metric]
    return (
      value !== null &&
      value !== undefined &&
      typeof value === "number" &&
      Number.isFinite(value)
    )
  })
}

export function ChartRenderer({
  data,
  chartType,
  dimension,
  metric,
}: ChartRendererProps) {
  const chartData = getChartRows(data, metric)

  if (!dimension || !metric || chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
        <p className="text-sm text-slate-500">
          Nenhum dado válido para visualizar.
        </p>
      </div>
    )
  }

  const commonChartProps = {
    data: chartData,
    margin: { top: 8, right: 16, bottom: 8, left: 8 } as const,
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" && (
          <BarChart {...commonChartProps}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey={dimension}
              tick={{ fill: "#475569", fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
              }}
            />
            <Bar
              dataKey={metric}
              name={metric}
              fill="#0d9488"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}

        {chartType === "line" && (
          <LineChart {...commonChartProps}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey={dimension}
              tick={{ fill: "#475569", fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              name={metric}
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0d9488" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        )}

        {chartType === "pie" && (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={metric}
              nameKey={dimension}
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {chartData.map((row, index) => (
                <Cell
                  key={`${String(row[dimension])}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
              }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
