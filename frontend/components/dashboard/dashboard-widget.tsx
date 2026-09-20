"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  BarChart3,
  LineChart,
  Loader2,
  MoreVertical,
  PieChart,
  RefreshCw,
  Table2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChartRenderer } from "@/components/explorer/chart-renderer"
import type { Analysis } from "@/lib/types/analysis"
import type { DashboardFilter, DashboardWidget } from "@/lib/types/dashboard"
import { getAnalysis } from "@/lib/storage/analyses"
import { executeQuery, executeQueryFiltered } from "@/lib/api/queries"
import type { FilterClause } from "@/lib/api/queries"
import { ApiError } from "@/lib/api"

const chartTypeIcon: Record<Analysis["chartType"], typeof Table2> = {
  table: Table2,
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
}

interface DashboardWidgetViewProps {
  widget: DashboardWidget
  filters: DashboardFilter[]
  filterValues: Record<string, string | string[]>
  onRemove: (widgetId: string) => void
}

function buildFilterClauses(
  filters: DashboardFilter[],
  filterValues: Record<string, string | string[]>,
  analysis: Analysis
): FilterClause[] {
  return filters
    .filter((f) => {
      if (analysis.datasetId != null && analysis.datasetId !== f.datasetId) return false
      if (f.scope === "dashboard") return true
      return f.scope.includes(analysis.id)
    })
    .map((f) => {
      const rawValue = filterValues[f.id] ?? f.defaultValue
      if (rawValue === null || rawValue === undefined) return null
      if (Array.isArray(rawValue) && rawValue.length === 0) return null
      if (typeof rawValue === "string" && rawValue === "") return null

      let values: string | string[]
      if (f.operator === "in") {
        values = Array.isArray(rawValue) ? rawValue : [rawValue]
      } else if (f.operator === "between") {
        values = Array.isArray(rawValue) ? rawValue : [rawValue]
      } else {
        values = typeof rawValue === "string" ? rawValue : rawValue[0] ?? ""
      }

      return { column: f.column, operator: f.operator, values }
    })
    .filter((f): f is FilterClause => f !== null)
}

export function DashboardWidgetView({
  widget,
  filters,
  filterValues,
  onRemove,
}: DashboardWidgetViewProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisChecked, setAnalysisChecked] = useState(false)
  const [data, setData] = useState<Record<string, unknown>[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchQuery = useCallback(
    async (sql: string, databaseId: number, dbSchema: string | null) => {
      setLoading(true)
      setError(null)

      try {
        let response
        if (filters.length > 0 && analysis) {
          const filterClauses = buildFilterClauses(filters, filterValues, analysis)
          if (filterClauses.length > 0) {
            response = await executeQueryFiltered({
              database_id: databaseId,
              sql,
              db_schema: dbSchema ?? undefined,
              filters: filterClauses,
            })
          } else {
            response = await executeQuery({
              database_id: databaseId,
              sql,
              db_schema: dbSchema ?? undefined,
            })
          }
        } else {
          response = await executeQuery({
            database_id: databaseId,
            sql,
            db_schema: dbSchema ?? undefined,
          })
        }

        if (!mountedRef.current) return

        if (response.status === "error") {
          setError(response.message || "Erro ao executar a consulta.")
        } else {
          setData(response.data ?? [])
        }
      } catch (err) {
        if (!mountedRef.current) return

        const msg =
          err instanceof ApiError
            ? err.detail
            : "Não foi possível executar a consulta."
        setError(msg)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [filters, filterValues, analysis]
  )

  const fetchQueryRef = useRef(fetchQuery)
  useEffect(() => {
    fetchQueryRef.current = fetchQuery
  })

  useEffect(() => {
    mountedRef.current = true

    const loaded = getAnalysis(widget.analysisId)

    requestAnimationFrame(() => {
      if (!mountedRef.current) return
      setAnalysis(loaded)
      setAnalysisChecked(true)

      if (loaded?.databaseId && loaded.sql) {
        fetchQueryRef.current(loaded.sql, loaded.databaseId, loaded.dbSchema)
      }
    })

    return () => {
      mountedRef.current = false
    }
  }, [widget.analysisId])

  useEffect(() => {
    if (analysisChecked && !analysis) {
      onRemove(widget.id)
    }
  }, [analysisChecked, analysis, onRemove, widget.id])

  useEffect(() => {
    if (analysisChecked && analysis?.databaseId && analysis.sql) {
      requestAnimationFrame(() => {
        fetchQueryRef.current(analysis.sql, analysis.databaseId, analysis.dbSchema)
      })
    }
  }, [filterValues, analysisChecked, analysis])

  if (!analysisChecked || !analysis) {
    return null
  }

  const Icon = chartTypeIcon[analysis.chartType]

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={15} className="shrink-0 text-teal-600" />
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {analysis.name}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {!loading && !error && data && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                fetchQuery(analysis.sql, analysis.databaseId, analysis.dbSchema)
              }
              className="h-7 w-7 text-slate-400 hover:text-slate-700"
              title="Atualizar dados"
            >
              <RefreshCw size={13} />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRemove(widget.id)}>
                <Trash2 size={14} />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Carregando dados...
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <p className="text-center text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                fetchQuery(analysis.sql, analysis.databaseId, analysis.dbSchema)
              }
            >
              <RefreshCw size={13} />
              Tentar novamente
            </Button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {analysis.chartType === "table" ? (
              <div className="max-h-full overflow-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-b-slate-300 hover:bg-slate-50">
                      {Object.keys(data[0] ?? {}).map((col) => (
                        <TableHead
                          key={col}
                          className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 50).map((row, i) => (
                      <TableRow key={i} className="even:bg-slate-50/50">
                        {Object.keys(data[0] ?? {}).map((col) => (
                          <TableCell
                            key={col}
                            className="px-3 py-2 text-xs text-slate-700"
                          >
                            {row[col] === null || row[col] === undefined
                              ? "\u2014"
                              : String(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-full min-h-[200px]">
                <ChartRenderer
                  data={data}
                  chartType={analysis.chartType}
                  dimension={analysis.dimension}
                  metric={analysis.metric}
                />
              </div>
            )}
          </>
        )}

        {!loading && !error && data && data.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-500">Nenhum dado retornado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
