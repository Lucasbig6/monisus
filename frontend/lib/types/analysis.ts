export interface Analysis {
  id: string
  name: string
  description: string
  sql: string
  databaseId: number
  dbSchema: string | null
  datasetId: number | null
  chartType: "table" | "bar" | "line" | "pie"
  dimension: string | null
  metric: string | null
  createdAt: string
  updatedAt: string
}
