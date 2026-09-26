import type { Dashboard, DashboardAppearance } from "@/lib/types/dashboard"

export { cn } from "cn"

// Espelha a função de slug do módulo legado de storage (arquivo órfão nesta
// etapa, removido numa etapa posterior); só entra em jogo sem slug vindo da API.
function slugifyDashboardName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return base || "dashboard"
}

export function getDashboardSharePath(dashboard: Dashboard): string {
  const slug = dashboard.slug?.trim() || slugifyDashboardName(dashboard.name)
  return `/painel/${slug}`
}

// Classe do container do painel: o grid mede o container (useContainerWidth),
// então trocar a largura aqui escala widgets e breakpoints automaticamente.
export function dashboardWidthClass(appearance?: DashboardAppearance): string {
  switch (appearance?.width) {
    case "wide":
      return "mx-auto max-w-screen-2xl"
    case "full":
      return ""
    default:
      return "mx-auto max-w-7xl"
  }
}
