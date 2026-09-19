"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2 } from "lucide-react"
import { VisualizationPanel } from "@/components/explorer/visualization-panel"

const PAGE_SIZE = 10

interface QueryResultProps {
  data: Record<string, unknown>[] | null
  loading: boolean
  error: string | null
}

export function QueryResult({ data, loading, error }: QueryResultProps) {
  const [pagination, setPagination] = useState({ data, page: 0 })
  const [viewMode, setViewMode] = useState<"table" | "chart">("table")
  const containerRef = useRef<HTMLDivElement>(null)
  const page = pagination.data === data ? pagination.page : 0

  function goToPage(p: number) {
    setPagination((prev) => ({ ...prev, page: p }))
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Executando consulta...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Erro ao executar consulta
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Inbox size={20} />
          Nenhum resultado retornado.
        </div>
      </div>
    )
  }

  const columns = Object.keys(data[0])
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const end = start + PAGE_SIZE
  const pageData = data.slice(start, end)

  function getPageNumbers(): (number | "...")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | "...")[] = []

    pages.push(1)

    if (page > 3) {
      pages.push("...")
    }

    const windowStart = Math.max(2, page)
    const windowEnd = Math.min(totalPages - 1, page + 2)

    for (let i = windowStart; i <= windowEnd; i++) {
      pages.push(i)
    }

    if (page < totalPages - 4) {
      pages.push("...")
    }

    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div ref={containerRef} className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">
          {data.length} registro{data.length !== 1 ? "s" : ""}
        </span>
        <div
          className="inline-flex w-full gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 sm:w-auto"
          role="group"
          aria-label="Modo de visualização"
        >
          <Button
            type="button"
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            className="flex-1 sm:flex-none"
          >
            Tabela
          </Button>
          <Button
            type="button"
            variant={viewMode === "chart" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("chart")}
            aria-pressed={viewMode === "chart"}
            className="flex-1 sm:flex-none"
          >
            Visualizar
          </Button>
        </div>
      </div>

      {viewMode === "chart" ? (
        <VisualizationPanel
          data={data}
          onBackToTable={() => setViewMode("table")}
        />
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="lg:hidden px-4 py-4 space-y-3">
        {pageData.map((row, i) => (
          <div key={start + i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {columns.map((col) => (
              <div key={col} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {col}
                </span>
                <span className="text-sm text-slate-900 font-mono text-right max-w-[60%] truncate">
                  {row[col] === null || row[col] === undefined ? "—" : String(row[col])}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-b-slate-300 hover:bg-slate-50">
                {columns.map((col) => (
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
              {pageData.map((row, i) => (
                <TableRow key={start + i} className="even:bg-slate-50/50">
                  {columns.map((col, colIdx) => (
                    <TableCell
                      key={col}
                      className={cn(
                        "px-4 py-3 text-sm text-slate-700",
                        colIdx < columns.length - 1 && "border-r border-r-slate-100"
                      )}
                    >
                      {row[col] === null || row[col] === undefined
                        ? "—"
                        : String(row[col])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className={cn("flex items-center justify-between border-t border-slate-200 px-4 py-2", "flex-col sm:flex-row gap-2 sm:gap-0")}>
          <span className="text-xs text-slate-500">
            {data.length} registro{data.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="sm:hidden"
            >
              <ChevronLeft size={14} />
            </Button>

            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-xs text-slate-400">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page + 1 ? "default" : "outline"}
                  size="icon-xs"
                  onClick={() => goToPage(p - 1)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages - 1}
              className="sm:hidden"
            >
              <ChevronRight size={14} />
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => goToPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft size={14} />
              </Button>

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-slate-400">
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page + 1 ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => goToPage(p - 1)}
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages - 1}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
