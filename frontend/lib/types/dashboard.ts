export interface DashboardFilter {
  id: string
  column: string
  type: "select" | "multi-select" | "date-range"
  value: string | string[] | null
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
