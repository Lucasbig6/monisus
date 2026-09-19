import type { Dashboard } from "@/lib/types/dashboard"

const STORAGE_KEY = "monisus_dashboards"

function safeGetItem(): Dashboard[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed as Dashboard[]
  } catch {
    return []
  }
}

function safeSetItem(dashboards: Dashboard[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards))
  } catch {
    // silently ignore storage errors
  }
}

export function getDashboards(): Dashboard[] {
  return safeGetItem()
}

export function getDashboard(id: string): Dashboard | null {
  const dashboards = safeGetItem()
  return dashboards.find((d) => d.id === id) ?? null
}

export function saveDashboard(
  data: Omit<Dashboard, "id" | "createdAt" | "updatedAt">
): Dashboard {
  const dashboards = safeGetItem()
  const now = new Date().toISOString()

  const dashboard: Dashboard = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  dashboards.push(dashboard)
  safeSetItem(dashboards)

  return dashboard
}

export function updateDashboard(dashboard: Dashboard): Dashboard {
  const dashboards = safeGetItem()
  const updated = { ...dashboard, updatedAt: new Date().toISOString() }

  const index = dashboards.findIndex((d) => d.id === dashboard.id)
  if (index !== -1) {
    dashboards[index] = updated
  } else {
    dashboards.push(updated)
  }

  safeSetItem(dashboards)
  return updated
}

export function deleteDashboard(id: string): void {
  const dashboards = safeGetItem()
  safeSetItem(dashboards.filter((d) => d.id !== id))
}
