export interface DashboardFilter {
  id: string
  datasetId: number
  column: string
  operator: "eq" | "in" | "gte" | "lte" | "between"
  defaultValue: string | string[]
  scope: "dashboard" | string[]
}

export interface DashboardWidget {
  id: string
  analysisId: string
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface Dashboard {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
  filters: DashboardFilter[]
  createdAt: string
  updatedAt: string
}
