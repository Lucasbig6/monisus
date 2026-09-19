"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dashboard, DashboardFilter, DashboardWidget } from "@/lib/types/dashboard"
import type { Analysis } from "@/lib/types/analysis"
import { updateDashboard } from "@/lib/storage/dashboards"
import { DashboardWidgetView } from "./dashboard-widget"
import { AddAnalysisDialog } from "./add-analysis-dialog"
import { DashboardFiltersBar } from "./dashboard-filters-bar"

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
  const [refreshKey, setRefreshKey] = useState(0)

  const { width, mounted, containerRef } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 1280,
  })

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

  const handleLayoutChange = useCallback(
    () => {
      // only update state, do not persist yet
    },
    []
  )

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

  const handleAddFilter = useCallback(() => {
    const newFilter: DashboardFilter = {
      id: crypto.randomUUID(),
      column: "coluna_exemplo",
      type: "select",
      value: null,
      scope: "dashboard",
    }

    const updated = {
      ...dashboard,
      filters: [...dashboard.filters, newFilter],
    }

    updateDashboard(updated)
    onDashboardChange(updated)
  }, [dashboard, onDashboardChange])

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      const updated = {
        ...dashboard,
        filters: dashboard.filters.filter((f) => f.id !== filterId),
      }

      updateDashboard(updated)
      onDashboardChange(updated)
    },
    [dashboard, onDashboardChange]
  )

  const handleRefreshAll = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const excludeAnalysisIds = useMemo(
    () => dashboard.widgets.map((w) => w.analysisId),
    [dashboard.widgets]
  )

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {dashboard.name}
            </h1>
            {dashboard.description && (
              <p className="mt-1 text-sm text-slate-500">
                {dashboard.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              title="Atualizar dados de todos os widgets"
            >
              <RefreshCw size={14} />
              Atualizar dados
            </Button>

            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus size={14} />
                  Adicionar análise
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
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil size={14} />
                Editar
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      {dashboard.filters.length > 0 || editing ? (
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
                onAdd={handleAddFilter}
                onRemove={handleRemoveFilter}
              />
            </div>
          </div>
        </section>
      ) : null}

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
                Adicione análises salvas para visualizar seus dados neste painel.
              </p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="mt-6 bg-teal-600 text-white hover:bg-teal-700"
              >
                <Plus size={16} />
                Adicionar análise
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
    </div>
  )
}
