"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  ChevronDown,
  Database,
  FileChartColumn,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Dashboard } from "@/lib/types/dashboard"
import type { Analysis } from "@/lib/types/analysis"
import { chartTypeIcon, chartTypeLabel } from "@/lib/types/charts"
import { getDashboards } from "@/lib/api/dashboards"
import { getAnalyses } from "@/lib/api/analyses"
import {
  listDatasets,
  datasetDisplayName,
  type DatasetListItem,
} from "@/lib/api/datasets"
import { AddToDashboardDialog } from "@/components/dashboard/add-to-dashboard-dialog"
import { ApiError } from "@/lib/api"

type RecentKind = "dashboard" | "analysis" | "chart"
type DashboardFilter = "recent" | "mine" | "all"
type ChartFilter = "recent" | "mine" | "all"

interface RecentItem {
  id: string
  kind: RecentKind
  name: string
  updatedAt: string
  href: string
}

interface SearchHit {
  id: string
  kind: RecentKind | "dataset"
  name: string
  detail: string
  href: string
  chartType?: Analysis["chartType"]
}

const RECENT_LIMIT = 8
const DASHBOARD_LIMIT = 8
const CHART_LIMIT = 8
const ANALYSIS_LIMIT = 8
const DATASET_LIMIT = 10

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function formatRelative(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diffMs / 60_000)
    if (minutes < 1) return "agora mesmo"
    if (minutes < 60) return `há ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `há ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `há ${days}d`
    return formatDate(iso)
  } catch {
    return iso
  }
}

function kindLabel(kind: RecentKind | "dataset"): string {
  switch (kind) {
    case "dashboard":
      return "Dashboard"
    case "analysis":
      return "Análise"
    case "chart":
      return "Gráfico"
    case "dataset":
      return "Dataset"
  }
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true
  return normalize(haystack).includes(normalize(query))
}

function Section({
  title,
  count,
  open,
  onToggle,
  actions,
  children,
  emphasis = false,
}: {
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  actions?: React.ReactNode
  children: React.ReactNode
  emphasis?: boolean
}) {
  return (
    <section className="border-b border-slate-200/80 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex min-w-0 items-center gap-2 text-left"
        >
          <ChevronDown
            size={15}
            className={cn(
              "shrink-0 text-slate-400 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
          <h2
            className={cn(
              "text-sm font-semibold tracking-tight",
              emphasis ? "text-slate-900" : "text-slate-800"
            )}
          >
            {title}
          </h2>
          {typeof count === "number" && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-600">
              {count}
            </span>
          )}
        </button>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {open && <div className="pb-4">{children}</div>}
    </section>
  )
}

function Tabs({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function EmptyInline({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <Link href={actionHref} className="mt-3 inline-block">
        <Button size="sm" variant="outline" className="bg-white">
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}

function EntryCard({
  href,
  icon,
  iconClassName,
  title,
  description,
  countLabel,
  createHref,
  createLabel,
}: {
  href: string
  icon: React.ReactNode
  iconClassName: string
  title: string
  description: string
  countLabel: string
  createHref: string
  createLabel: string
}) {
  return (
    <div className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-200/80 hover:bg-slate-50/60">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {countLabel}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Link
          href={href}
          className="text-xs font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          Ver todos →
        </Link>
        <Link
          href={createHref}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Plus size={12} />
          {createLabel}
        </Link>
      </div>
    </div>
  )
}

function ListRow({
  href,
  icon,
  iconClassName,
  title,
  meta,
  badge,
  badgeClassName,
  right,
}: {
  href?: string
  icon: React.ReactNode
  iconClassName?: string
  title: string
  meta?: string
  badge?: string
  badgeClassName?: string
  right?: React.ReactNode
}) {
  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          iconClassName ?? "bg-slate-100 text-slate-600"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-900">
          {title}
        </span>
        {meta && (
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {meta}
          </span>
        )}
      </span>
      {badge && (
        <span
          className={cn(
            "hidden shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium sm:inline-flex",
            badgeClassName ?? "bg-slate-100 text-slate-600"
          )}
        >
          {badge}
        </span>
      )}
      {right}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-slate-50"
      >
        {content}
        <span className="shrink-0 text-slate-300 transition-colors group-hover:text-teal-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-slate-50">
      {content}
      {right}
    </div>
  )
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loadingDomain, setLoadingDomain] = useState(true)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [datasets, setDatasets] = useState<DatasetListItem[]>([])
  const [loadingDatasets, setLoadingDatasets] = useState(true)
  const [datasetsError, setDatasetsError] = useState<string | null>(null)
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>("recent")
  const [chartFilter, setChartFilter] = useState<ChartFilter>("recent")
  const [addToDashboardTarget, setAddToDashboardTarget] =
    useState<Analysis | null>(null)

  const [openSections, setOpenSections] = useState({
    recent: true,
    dashboards: true,
    charts: true,
    analyses: true,
    datasets: true,
  })

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [dashboardList, analysisList] = await Promise.all([
          getDashboards(),
          getAnalyses(),
        ])
        if (!cancelled) {
          setDashboards(dashboardList)
          setAnalyses(analysisList)
          setDomainError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setDomainError(
            err instanceof ApiError
              ? err.detail
              : "Erro ao carregar painéis e análises."
          )
        }
      } finally {
        if (!cancelled) setLoadingDomain(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await listDatasets()
        if (!cancelled) {
          setDatasets(data.result ?? [])
          setDatasetsError(null)
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiError
              ? err.detail
              : "Erro ao carregar conjuntos de dados."
          setDatasetsError(msg)
        }
      } finally {
        if (!cancelled) setLoadingDatasets(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const chartItems = useMemo(
    () =>
      analyses
        .filter((a) => a.chartType !== "table")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [analyses]
  )

  const analysisItems = useMemo(
    () =>
      analyses
        .filter((a) => a.chartType === "table")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [analyses]
  )

  const sortedDashboards = useMemo(
    () =>
      [...dashboards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [dashboards]
  )

  const recentItems = useMemo<RecentItem[]>(() => {
    const fromDashboards: RecentItem[] = sortedDashboards.map((d) => ({
      id: d.id,
      kind: "dashboard" as const,
      name: d.name,
      updatedAt: d.updatedAt,
      href: `/paineis/${d.id}`,
    }))

    const fromAnalyses: RecentItem[] = analyses.map((a) => ({
      id: a.id,
      kind: a.chartType === "table" ? ("analysis" as const) : ("chart" as const),
      name: a.name,
      updatedAt: a.updatedAt,
      href: `/analises/${a.id}`,
    }))

    return [...fromDashboards, ...fromAnalyses]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, RECENT_LIMIT)
  }, [sortedDashboards, analyses])

  const searchHits = useMemo<SearchHit[]>(() => {
    const trimmed = query.trim()
    if (!trimmed) return []

    const hits: SearchHit[] = []

    for (const d of sortedDashboards) {
      const hay = `${d.name} ${d.description}`
      if (matchesQuery(hay, trimmed)) {
        hits.push({
          id: `dashboard-${d.id}`,
          kind: "dashboard",
          name: d.name,
          detail: d.description,
          href: `/paineis/${d.id}`,
        })
      }
    }

    for (const a of analyses) {
      const hay = `${a.name} ${a.description} ${chartTypeLabel[a.chartType]}`
      if (matchesQuery(hay, trimmed)) {
        hits.push({
          id: `${a.chartType === "table" ? "analysis" : "chart"}-${a.id}`,
          kind: a.chartType === "table" ? "analysis" : "chart",
          name: a.name,
          detail: chartTypeLabel[a.chartType],
          href: `/analises/${a.id}`,
          chartType: a.chartType,
        })
      }
    }

    for (const ds of datasets) {
      const name = datasetDisplayName(ds)
      const hay = `${name} ${ds.description ?? ""} ${ds.table_name}`
      if (matchesQuery(hay, trimmed)) {
        hits.push({
          id: `dataset-${ds.id}`,
          kind: "dataset",
          name,
          detail: ds.description || ds.table_name,
          href: `/explorar?datasetId=${ds.id}`,
        })
      }
    }

    return hits.slice(0, 12)
  }, [query, sortedDashboards, analyses, datasets])

  const visibleDashboards = useMemo(() => {
    if (dashboardFilter === "recent") {
      return sortedDashboards.slice(0, DASHBOARD_LIMIT)
    }
    return sortedDashboards
  }, [sortedDashboards, dashboardFilter])

  const visibleCharts = useMemo(() => {
    if (chartFilter === "recent") {
      return chartItems.slice(0, CHART_LIMIT)
    }
    return chartItems
  }, [chartItems, chartFilter])

  const visibleAnalyses = analysisItems.slice(0, ANALYSIS_LIMIT)
  const visibleDatasets = datasets.slice(0, DATASET_LIMIT)

  const trimmedQuery = query.trim()
  const showSearchResults = trimmedQuery.length > 0

  const filterOptions = [
    { value: "recent", label: "Recentes" },
    { value: "mine", label: "Meus" },
    { value: "all", label: "Todos" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro + search (sem hero verde) */}
      <section className="pb-6 border-b border-slate-200">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-600">
          Saude360
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
          O que você deseja analisar?
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Pesquise dashboards, gráficos, análises ou dados.
        </p>

        <div className="relative mt-5 max-w-2xl">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar dashboards, gráficos, análises ou dados..."
            aria-label="Pesquisar na plataforma"
            className="h-10 rounded-lg border-slate-200 bg-white pl-9 pr-10 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-teal-500/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* Cards de entrada — atalhos por área */}
      <section aria-label="Atalhos por área" className="pt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <EntryCard
            href="/paineis"
            icon={<LayoutDashboard size={17} />}
            iconClassName="bg-teal-50 text-teal-700"
            title="Dashboards"
            description="Painéis para acompanhamento de indicadores."
            countLabel={
              loadingDomain
                ? "…"
                : dashboards.length === 1
                  ? "1 painel"
                  : `${dashboards.length} painéis`
            }
            createHref="/paineis"
            createLabel="Novo"
          />
          <EntryCard
            href="/analises"
            icon={<BarChart3 size={17} />}
            iconClassName="bg-purple-50 text-purple-700"
            title="Gráficos"
            description="Visualizações salvas a partir de consultas."
            countLabel={
              loadingDomain
                ? "…"
                : chartItems.length === 1
                  ? "1 gráfico"
                  : `${chartItems.length} gráficos`
            }
            createHref="/explorar"
            createLabel="Novo"
          />
          <EntryCard
            href="/analises"
            icon={<FileChartColumn size={17} />}
            iconClassName="bg-slate-100 text-slate-700"
            title="Análises"
            description="Consultas e tabelas analíticas salvas."
            countLabel={
              loadingDomain
                ? "…"
                : analysisItems.length === 1
                  ? "1 análise"
                  : `${analysisItems.length} análises`
            }
            createHref="/explorar"
            createLabel="Nova"
          />
          <EntryCard
            href="/explorar"
            icon={<Database size={17} />}
            iconClassName="bg-sky-50 text-sky-700"
            title="Conjuntos de dados"
            description="Dados prontos para exploração e análise."
            countLabel={
              loadingDatasets
                ? "…"
                : datasets.length === 1
                  ? "1 dataset"
                  : `${datasets.length} datasets`
            }
            createHref="/fontes"
            createLabel="Fontes"
          />
        </div>
      </section>

      {loadingDomain ? (
        <section className="pt-6" aria-label="Carregando painéis e análises">
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-teal-600" />
            Carregando painéis e análises...
          </div>
        </section>
      ) : domainError ? (
        <section className="pt-6" aria-label="Erro ao carregar">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            {domainError}
          </div>
        </section>
      ) : showSearchResults ? (
        <section className="pt-6" aria-label="Resultados da busca">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Resultados para “{trimmedQuery}”
              </h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-600">
                {searchHits.length}
              </span>
            </div>
          </div>

          {searchHits.length === 0 ? (
            <div className="mt-4">
              <EmptyInline
                title="Nenhum resultado encontrado"
                description="Tente outro termo ou use os atalhos acima."
                actionLabel="Explorar dados"
                actionHref="/explorar"
              />
            </div>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {searchHits.map((hit) => {
                const Icon =
                  hit.kind === "dashboard"
                    ? LayoutDashboard
                    : hit.kind === "dataset"
                      ? Database
                      : hit.kind === "analysis"
                        ? FileChartColumn
                        : hit.chartType
                          ? chartTypeIcon[hit.chartType]
                          : BarChart3

                const iconCls =
                  hit.kind === "dataset"
                    ? "bg-sky-50 text-sky-700"
                    : hit.kind === "chart"
                      ? "bg-purple-50 text-purple-700"
                      : hit.kind === "analysis"
                        ? "bg-teal-50 text-teal-700"
                        : "bg-slate-100 text-slate-700"

                return (
                  <ListRow
                    key={hit.id}
                    href={hit.href}
                    icon={<Icon size={15} />}
                    iconClassName={iconCls}
                    title={hit.name}
                    meta={hit.detail || undefined}
                    badge={kindLabel(hit.kind)}
                  />
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="mt-6 border-t border-slate-200 pt-2">
          {/* Recentes */}
          <Section
            title="Recentes"
            count={recentItems.length}
            open={openSections.recent}
            onToggle={() => toggleSection("recent")}
            actions={
              <Link
                href="/analises"
                className="text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                Ver todos →
              </Link>
            }
          >
            {recentItems.length === 0 ? (
              <EmptyInline
                title="Nada por aqui ainda"
                description="Crie um dashboard ou execute uma análise para começar."
                actionLabel="Explorar dados"
                actionHref="/explorar"
              />
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
                {recentItems.map((item) => {
                  const Icon =
                    item.kind === "dashboard"
                      ? LayoutDashboard
                      : item.kind === "chart"
                        ? BarChart3
                        : FileChartColumn

                  const iconCls =
                    item.kind === "dashboard"
                      ? "bg-teal-50 text-teal-700"
                      : item.kind === "chart"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-slate-100 text-slate-700"

                  return (
                    <ListRow
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      icon={<Icon size={15} />}
                      iconClassName={iconCls}
                      title={item.name}
                      meta={formatRelative(item.updatedAt)}
                      badge={kindLabel(item.kind)}
                    />
                  )
                })}
              </div>
            )}
          </Section>

          {/* Dashboards — maior destaque */}
          <Section
            title="Dashboards"
            count={dashboards.length}
            open={openSections.dashboards}
            onToggle={() => toggleSection("dashboards")}
            emphasis
            actions={
              <>
                <Tabs
                  value={dashboardFilter}
                  onChange={(v) => setDashboardFilter(v as DashboardFilter)}
                  options={filterOptions}
                />
                <Link href="/paineis">
                  <Button size="sm" className="bg-teal-600 text-white hover:bg-teal-700">
                    <Plus size={14} />
                    Dashboard
                  </Button>
                </Link>
              </>
            }
          >
            {dashboards.length === 0 ? (
              <EmptyInline
                title="Nenhum dashboard criado"
                description="Crie seu primeiro dashboard para acompanhar seus indicadores."
                actionLabel="+ Criar dashboard"
                actionHref="/paineis"
              />
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
                {visibleDashboards.map((d) => (
                  <ListRow
                    key={d.id}
                    href={`/paineis/${d.id}`}
                    icon={<LayoutDashboard size={15} />}
                    iconClassName="bg-teal-50 text-teal-700"
                    title={d.name}
                    meta={`${d.widgets.length} widget${
                      d.widgets.length !== 1 ? "s" : ""
                    } · ${formatRelative(d.updatedAt)}`}
                  />
                ))}
              </div>
            )}
            {dashboards.length > DASHBOARD_LIMIT && dashboardFilter === "recent" && (
              <button
                type="button"
                onClick={() => setDashboardFilter("all")}
                className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                Ver todos ({dashboards.length})
              </button>
            )}
          </Section>

          {/* Gráficos */}
          <Section
            title="Gráficos"
            count={chartItems.length}
            open={openSections.charts}
            onToggle={() => toggleSection("charts")}
            actions={
              <>
                <Tabs
                  value={chartFilter}
                  onChange={(v) => setChartFilter(v as ChartFilter)}
                  options={filterOptions}
                />
                <Link href="/explorar">
                  <Button size="sm" variant="outline" className="bg-white">
                    <Plus size={14} />
                    Gráfico
                  </Button>
                </Link>
              </>
            }
          >
            {chartItems.length === 0 ? (
              <EmptyInline
                title="Nenhum gráfico salvo"
                description="No Explorer, use Visualizar e salve um gráfico."
                actionLabel="+ Novo gráfico"
                actionHref="/explorar"
              />
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
                {visibleCharts.map((a) => {
                  const Icon = chartTypeIcon[a.chartType]
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-1 px-1"
                    >
                      <div className="min-w-0 flex-1">
                        <ListRow
                          href={`/analises/${a.id}`}
                          icon={<Icon size={15} />}
                          iconClassName="bg-purple-50 text-purple-700"
                          title={a.name}
                          meta={`${chartTypeLabel[a.chartType]} · ${formatRelative(
                            a.updatedAt
                          )}`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-slate-500 hover:text-teal-700"
                        onClick={() => setAddToDashboardTarget(a)}
                      >
                        Ao painel
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
            {chartItems.length > CHART_LIMIT && chartFilter === "recent" && (
              <button
                type="button"
                onClick={() => setChartFilter("all")}
                className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                Ver todos ({chartItems.length})
              </button>
            )}
          </Section>

          {/* Análises */}
          <Section
            title="Análises"
            count={analysisItems.length}
            open={openSections.analyses}
            onToggle={() => toggleSection("analyses")}
            actions={
              <Link href="/explorar">
                <Button size="sm" variant="outline" className="bg-white">
                  <Plus size={14} />
                  Análise
                </Button>
              </Link>
            }
          >
            {analysisItems.length === 0 ? (
              <EmptyInline
                title="Nenhuma análise salva ainda."
                description="Execute uma consulta ou análise para começar."
                actionLabel="Nova análise"
                actionHref="/explorar"
              />
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
                {visibleAnalyses.map((a) => (
                  <ListRow
                    key={a.id}
                    href={`/analises/${a.id}`}
                    icon={<FileChartColumn size={15} />}
                    iconClassName="bg-slate-100 text-slate-700"
                    title={a.name}
                    meta={`${chartTypeLabel[a.chartType]} · ${formatRelative(
                      a.updatedAt
                    )}`}
                  />
                ))}
              </div>
            )}
            {analysisItems.length > ANALYSIS_LIMIT && (
              <Link
                href="/analises"
                className="mt-2 inline-block text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                Ver todas ({analysisItems.length})
              </Link>
            )}
          </Section>

          {/* Conjuntos de dados */}
          <Section
            title="Conjuntos de dados"
            count={loadingDatasets ? undefined : datasets.length}
            open={openSections.datasets}
            onToggle={() => toggleSection("datasets")}
            actions={
              <Link
                href="/fontes"
                className="text-xs font-medium text-slate-500 hover:text-teal-700"
              >
                Gerenciar fontes →
              </Link>
            }
          >
            {loadingDatasets ? (
              <div className="flex items-center gap-2 px-2 py-3 text-sm text-slate-500">
                <Loader2 size={15} className="animate-spin text-teal-600" />
                Carregando conjuntos de dados...
              </div>
            ) : datasetsError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                {datasetsError}
              </div>
            ) : datasets.length === 0 ? (
              <EmptyInline
                title="Nenhum dataset disponível"
                description="Publique um dataset a partir de uma fonte."
                actionLabel="Gerenciar fontes"
                actionHref="/fontes"
              />
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
                {visibleDatasets.map((ds) => {
                  const name = datasetDisplayName(ds)
                  const cols = ds.columns?.length ?? 0
                  return (
                    <ListRow
                      key={ds.id}
                      href={`/explorar?datasetId=${ds.id}`}
                      icon={<Database size={15} />}
                      iconClassName="bg-sky-50 text-sky-700"
                      title={name}
                      meta={`${cols} coluna${cols !== 1 ? "s" : ""} · pronto para análise`}
                      badge="Explorar"
                      badgeClassName="bg-teal-50 text-teal-700"
                    />
                  )
                })}
              </div>
            )}
            {!loadingDatasets &&
              !datasetsError &&
              datasets.length > DATASET_LIMIT && (
                <Link
                  href="/explorar"
                  className="mt-2 inline-block text-xs font-medium text-teal-700 hover:text-teal-800"
                >
                  Explorar no Explorer ({datasets.length})
                </Link>
              )}
          </Section>
        </div>
      )}

      <AddToDashboardDialog
        open={addToDashboardTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAddToDashboardTarget(null)
        }}
        analysis={addToDashboardTarget}
      />
    </div>
  )
}
