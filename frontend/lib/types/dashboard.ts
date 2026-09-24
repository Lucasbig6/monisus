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

export interface DashboardAppearance {
  theme?: "light" | "dark"
  showBrand?: boolean
}

export interface Dashboard {
  id: string
  name: string
  description: string
  slug?: string
  widgets: DashboardWidget[]
  filters: DashboardFilter[]
  appearance?: DashboardAppearance
  createdAt: string
  updatedAt: string
}
