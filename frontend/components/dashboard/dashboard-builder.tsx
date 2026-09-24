"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  Filter,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dashboard, DashboardAppearance, DashboardFilter, DashboardWidget } from "@/lib/types/dashboard"
import type { Analysis } from "@/lib/types/analysis"
import { updateDashboard, getDashboardSharePath } from "@/lib/storage/dashboards"
import { getDistinctValues } from "@/lib/api/datasets"
import { DashboardWidgetView } from "./dashboard-widget"
import { AddAnalysisDialog } from "./add-analysis-dialog"
import { AddFilterDialog } from "./add-filter-dialog"
import { DashboardFiltersBar } from "./dashboard-filters-bar"
import { ShareDashboardDialog } from "./share-dashboard-dialog"
import { EditDashboardInfoDialog } from "./edit-dashboard-info-dialog"

import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout"

const GRID_COLS = { lg: 12, md: 10, sm: 6 }
const GRID_BREAKPOINTS = { lg: 1024, md: 768, sm: 0 }
const GRID_ROW_HEIGHT = 80
const GRID_MARGIN: [number, number] = [16, 16]

interface DashboardBuilderProps {
  dashboard: Dashboard
  onDashboardChange: (dashboard: Dashboard) => void
}

export function DashboardBuilder({
  dashboard,
  onDashboardChange,
}: DashboardBuilderProps) {
  const [editing, setEditing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addFilterOpen, setAddFilterOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>(
    () => {
      const initial: Record<string, string | string[]> = {}
      for (const f of dashboard.filters) {
        initial[f.id] = f.defaultValue
      }
      return initial
    }
  )

  const [distinctValues, setDistinctValues] = useState<Record<string, string[]>>({})
  const [loadingDistinct, setLoadingDistinct] = useState(false)

  const { width, mounted, containerRef } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 1280,
  })

  useEffect(() => {
    requestAnimationFrame(() => {
      setFilterValues((prev) => {
        const next: Record<string, string | string[]> = {}
        for (const f of dashboard.filters) {
          next[f.id] = prev[f.id] ?? f.defaultValue
        }
        return next
      })
    })
  }, [dashboard.filters])

  useEffect(() => {
    if (dashboard.filters.length === 0) {
      requestAnimationFrame(() => setDistinctValues({}))
      return
    }

    let cancelled = false
    async function load() {
      setLoadingDistinct(true)
      const newDistinct: Record<string, string[]> = {}

      for (const f of dashboard.filters) {
        if (newDistinct[f.id]) continue
        try {
          const res = await getDistinctValues(f.datasetId, f.column)
          if (!cancelled) {
            newDistinct[f.id] = res.result ?? []
          }
        } catch {
          if (!cancelled) {
            newDistinct[f.id] = []
          }
        }
      }

      if (!cancelled) {
        setDistinctValues((prev) => ({ ...prev, ...newDistinct }))
        setLoadingDistinct(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [dashboard.filters])

  const layouts = useMemo(() => {
    const lg = dashboard.widgets.map((w) => ({
      i: w.id,
      x: w.layout.x,
      y: w.layout.y,
      w: w.layout.w,
      h: w.layout.h,
    }))

    const md = lg.map((item) => ({
      ...item,
      w: Math.min(item.w, 10),
      x: Math.min(item.x, 10 - item.w),
    }))

    const sm = lg.map((item) => ({
      ...item,
      w: 6,
      x: 0,
      y: item.y,
    }))

    return { lg, md, sm }
  }, [dashboard.widgets])

  const handleLayoutChange = useCallback(() => {}, [])

  const handleDragStop = useCallback(
    (newLayout: import("react-grid-layout").Layout) => {
      const updatedWidgets = dashboard.widgets.map((w) => {
        const layoutItem = newLayout.find((l) => l.i === w.id)
        if (!layoutItem) return w

        return {
          ...w,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        }
      })

      const updated = { ...dashboard, widgets: updatedWidgets }
      updateDashboard(updated)
      onDashboardChange(updated)
    },
    [dashboard, onDashboardChange]
  )

  const handleResizeStop = useCallback(
    (newLayout: import("react-grid-layout").Layout) => {
      const updatedWidgets = dashboard.widgets.map((w) => {
        const layoutItem = newLayout.find((l) => l.i === w.id)
        if (!layoutItem) return w

        return {
          ...w,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        }
      })

      const updated = { ...dashboard, widgets: updatedWidgets }
      updateDashboard(updated)
      onDashboardChange(updated)
    },
    [dashboard, onDashboardChange]
  )

  const handleAddAnalysis = useCallback(
    (analysis: Analysis) => {
      const newWidget: DashboardWidget = {
        id: crypto.randomUUID(),
        analysisId: analysis.id,
        layout: { x: 0, y: Infinity, w: 6, h: 4 },
      }

      const updated = {
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget],
      }

      updateDashboard(updated)
      onDashboardChange(updated)
    },
    [dashboard, onDashboardChange]
  )

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      const updated = {
        ...dashboard,
        widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
      }

      updateDashboard(updated)
      onDashboardChange(updated)
    },
    [dashboard, onDashboardChange]
  )

  const handleAddFilter = useCallback(
    (filterData: Omit<DashboardFilter, "id">) => {
      const newFilter: DashboardFilter = {
        ...filterData,
        id: crypto.randomUUID(),
      }

      const updated = {
        ...dashboard,
        filters: [...dashboard.filters, newFilter],
      }

      updateDashboard(updated)
      onDashboardChange(updated)

      setFilterValues((prev) => ({
        ...prev,
        [newFilter.id]: newFilter.defaultValue,
      }))

      setLoadingDistinct(true)
      getDistinctValues(newFilter.datasetId, newFilter.column)
        .then((res) => {
          setDistinctValues((prev) => ({
            ...prev,
            [newFilter.id]: res.result ?? [],
          }))
        })
        .catch(() => {
          setDistinctValues((prev) => ({ ...prev, [newFilter.id]: [] }))
        })
        .finally(() => setLoadingDistinct(false))
    },
    [dashboard, onDashboardChange]
  )

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      const updated = {
        ...dashboard,
        filters: dashboard.filters.filter((f) => f.id !== filterId),
      }

      updateDashboard(updated)
      onDashboardChange(updated)

      setFilterValues((prev) => {
        const next = { ...prev }
        delete next[filterId]
        return next
      })
      setDistinctValues((prev) => {
        const next = { ...prev }
        delete next[filterId]
        return next
      })
    },
    [dashboard, onDashboardChange]
  )

  const handleFilterValueChange = useCallback(
    (filterId: string, value: string | string[]) => {
      setFilterValues((prev) => ({ ...prev, [filterId]: value }))
    },
    []
  )

  const handleRefreshAll = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const excludeAnalysisIds = useMemo(
    () => dashboard.widgets.map((w) => w.analysisId),
    [dashboard.widgets]
  )

  const viewerHref = getDashboardSharePath(dashboard)

  function handleSaveInfo(data: {
    name: string
    description: string
    appearance: DashboardAppearance
  }) {
    const updated: Dashboard = {
      ...dashboard,
      name: data.name,
      description: data.description,
      appearance: data.appearance,
    }
    const saved = updateDashboard(updated)
    onDashboardChange(saved)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation */}
      <Link
        href="/paineis"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft size={14} />
        Painéis
      </Link>

      {/* Header */}
      <section className="mt-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {dashboard.name}
            </h1>
            {dashboard.description && (
              <p className="mt-1 text-sm text-slate-500">
                {dashboard.description}
              </p>
            )}
            {dashboard.slug && (
              <p className="mt-1 text-xs text-slate-400">
                /painel/{dashboard.slug}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              title="Atualizar dados de todos os widgets"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Atualizar dados</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setInfoOpen(true)}
              title="Editar informações"
            >
              <Info size={14} />
              <span className="hidden sm:inline">Informações</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              title="Compartilhar"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>

            <Link href={viewerHref}>
              <Button variant="outline" size="sm" title="Visualizar">
                <Eye size={14} />
                Visualizar
              </Button>
            </Link>

            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus size={14} />
                  Adicionar gráfico
                </Button>
                <Button
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="bg-teal-600 text-white hover:bg-teal-700"
                >
                  <Save size={14} />
                  Concluir edição
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setEditing(true)}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                <Pencil size={14} />
                Editar
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      {(dashboard.filters.length > 0 || editing) && (
        <section className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-500">
                Filtros
              </span>
            </div>
            <div className="mt-2">
              <DashboardFiltersBar
                filters={dashboard.filters}
                editing={editing}
                filterValues={filterValues}
                loadingDistinct={loadingDistinct}
                distinctValues={distinctValues}
                onAdd={() => setAddFilterOpen(true)}
                onRemove={handleRemoveFilter}
                onValueChange={handleFilterValueChange}
              />
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="mt-6">
        <div
          ref={containerRef}
          className={editing && dashboard.widgets.length > 0 ? "dashboard-edit-grid" : ""}
        >
          {dashboard.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Plus size={24} className="text-slate-400" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">
                Nenhum widget adicionado
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Adicione gráficos e análises salvos para visualizar seus dados
                neste painel.
              </p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="mt-6 bg-teal-600 text-white hover:bg-teal-700"
              >
                <Plus size={16} />
                Adicionar gráfico
              </Button>
            </div>
          ) : mounted ? (
            <ResponsiveGridLayout
              className="layout"
              width={width}
              layouts={layouts}
              breakpoints={GRID_BREAKPOINTS}
              cols={GRID_COLS}
              rowHeight={GRID_ROW_HEIGHT}
              margin={GRID_MARGIN}
              onLayoutChange={handleLayoutChange}
              onDragStop={handleDragStop}
              onResizeStop={handleResizeStop}
              dragConfig={{ enabled: editing, handle: ".drag-handle" }}
              resizeConfig={{ enabled: editing }}
              compactor={verticalCompactor}
            >
              {dashboard.widgets.map((widget) => (
                <div key={widget.id} className={editing ? "editing" : ""}>
                  {editing && (
                    <div className="drag-handle absolute left-0 right-0 top-0 z-20 flex h-6 cursor-grab items-center justify-center rounded-t-xl bg-slate-100/80 hover:bg-slate-200/80 active:cursor-grabbing">
                      <div className="flex gap-0.5">
                        <span className="block h-0.5 w-4 rounded-full bg-slate-400" />
                      </div>
                    </div>
                  )}
                  <div className={editing ? "pt-6 h-full" : "h-full"}>
                    <DashboardWidgetView
                      widget={widget}
                      filters={dashboard.filters}
                      filterValues={filterValues}
                      onRemove={handleRemoveWidget}
                      key={`${widget.id}-${refreshKey}`}
                    />
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          ) : null}
        </div>
      </section>

      {/* Add Analysis Dialog */}
      <AddAnalysisDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSelect={handleAddAnalysis}
        excludeIds={excludeAnalysisIds}
      />

      {/* Add Filter Dialog */}
      <AddFilterDialog
        open={addFilterOpen}
        onOpenChange={setAddFilterOpen}
        onAdd={handleAddFilter}
        existingFilters={dashboard.filters}
        dashboardWidgetAnalysisIds={dashboard.widgets.map((w) => w.analysisId)}
      />

      {/* Share */}
      <ShareDashboardDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        dashboard={dashboard}
      />

      {/* Edit info / appearance */}
      <EditDashboardInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        dashboard={dashboard}
        onSave={handleSaveInfo}
      />
    </div>
  )
}
