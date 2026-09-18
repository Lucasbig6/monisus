"use client"

import { useRef, useState } from "react"
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

const PAGE_SIZE = 10

interface QueryResultProps {
  data: Record<string, unknown>[] | null
  loading: boolean
  error: string | null
}

export function QueryResult({ data, loading, error }: QueryResultProps) {
  const [page, setPage] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  function goToPage(p: number) {
    setPage(p)
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
      <div className="border-b border-slate-200 px-4 py-2">
        <span className="text-xs text-slate-500">
          {data.length} registro{data.length !== 1 ? "s" : ""}
        </span>
      </div>

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
                    className={`px-4 py-3 text-sm text-slate-700 ${colIdx < columns.length - 1 ? "border-r border-r-slate-100" : ""}`}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2">
          <span className="text-xs text-slate-500">
            {data.length} registro{data.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
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
      )}
    </div>
  )
}
