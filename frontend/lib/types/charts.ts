import { BarChart3, LineChart, PieChart, Table2 } from "lucide-react"

export type ChartType = "table" | "bar" | "line" | "pie"

export type ChartVisualization = "bar" | "line" | "table"

export const chartTypeLabel: Record<ChartType, string> = {
  table: "Tabela",
  bar: "Barras",
  line: "Linha",
  pie: "Pizza",
}

export const chartTypeIcon: Record<ChartType, typeof Table2> = {
  table: Table2,
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
}
