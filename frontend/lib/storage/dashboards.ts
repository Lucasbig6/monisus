import type { Dashboard } from "@/lib/types/dashboard"

const STORAGE_KEY = "monisus_dashboards"

export function slugifyDashboardName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return base || "dashboard"
}

export function ensureUniqueSlug(
  base: string,
  dashboards: Dashboard[],
  excludeId?: string
): string {
  let candidate = base
  let n = 2

  while (
    dashboards.some((d) => d.slug === candidate && d.id !== excludeId)
  ) {
    candidate = `${base}-${n}`
    n += 1
  }

  return candidate
}

function withSlugs(dashboards: Dashboard[]): Dashboard[] {
  let changed = false

  const next = dashboards.map((d) => {
    if (d.slug && d.slug.trim()) return d
    changed = true
    return {
      ...d,
      slug: ensureUniqueSlug(slugifyDashboardName(d.name), dashboards, d.id),
    }
  })

  if (changed) {
    const filled = dashboards.map((d, i) => next[i])
    safeSetItem(filled)
    return filled
  }

  return dashboards
}

function safeGetItem(): Dashboard[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return withSlugs(parsed as Dashboard[])
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

export function getDashboardBySlug(slug: string): Dashboard | null {
  const dashboards = safeGetItem()
  const normalized = slug.trim().toLowerCase()
  return (
    dashboards.find((d) => (d.slug ?? "").toLowerCase() === normalized) ?? null
  )
}

export function saveDashboard(
  data: Omit<Dashboard, "id" | "createdAt" | "updatedAt" | "slug"> & {
    slug?: string
  }
): Dashboard {
  const dashboards = safeGetItem()
  const now = new Date().toISOString()
  const baseSlug =
    data.slug?.trim() ||
    slugifyDashboardName(data.name)
  const slug = ensureUniqueSlug(baseSlug, dashboards)

  const dashboard: Dashboard = {
    ...data,
    slug,
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
  const existing = dashboards.find((d) => d.id === dashboard.id)
  const slug =
    existing?.slug?.trim() ||
    dashboard.slug?.trim() ||
    ensureUniqueSlug(
      slugifyDashboardName(dashboard.name),
      dashboards,
      dashboard.id
    )

  const updated: Dashboard = {
    ...dashboard,
    slug,
    updatedAt: new Date().toISOString(),
  }

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

export function getDashboardSharePath(dashboard: Dashboard): string {
  const slug =
    dashboard.slug?.trim() || slugifyDashboardName(dashboard.name)
  return `/painel/${slug}`
}
