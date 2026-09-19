"use client"

import {
  BarChart3,
  FileChartColumn,
  LineChart,
  PieChart,
  Search,
  Table2,
} from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Analysis } from "@/lib/types/analysis"
import { getAnalyses } from "@/lib/storage/analyses"

const chartTypeLabel: Record<Analysis["chartType"], string> = {
  table: "Tabela",
  bar: "Barras",
  line: "Linha",
  pie: "Pizza",
}

const chartTypeIcon: Record<Analysis["chartType"], typeof Table2> = {
  table: Table2,
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
}

interface AddAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (analysis: Analysis) => void
  excludeIds: string[]
}

export function AddAnalysisDialog({
  open,
  onOpenChange,
  onSelect,
  excludeIds,
}: AddAnalysisDialogProps) {
  const [search, setSearch] = useState("")

  const analyses = useMemo(() => {
    const all = getAnalyses()
    const filtered = all.filter((a) => !excludeIds.includes(a.id))

    if (!search.trim()) return filtered

    const term = search.toLowerCase()
    return filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term)
    )
  }, [excludeIds, search])

  function handleSelect(analysis: Analysis) {
    onSelect(analysis)
    onOpenChange(false)
    setSearch("")
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch("")
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar análise</DialogTitle>
          <DialogDescription>
            Selecione uma análise existente para adicionar ao painel.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Buscar análises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="mt-2 max-h-80 overflow-y-auto">
          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <FileChartColumn size={18} className="text-slate-400" />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900">
                Nenhuma análise encontrada
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {excludeIds.length > 0
                  ? "Todas as análises já foram adicionadas a este painel."
                  : "Crie uma análise no Explorer primeiro."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.map((analysis) => {
                const Icon = chartTypeIcon[analysis.chartType]

                return (
                  <button
                    key={analysis.id}
                    type="button"
                    onClick={() => handleSelect(analysis)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/50 cursor-pointer"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {analysis.name}
                      </p>
                      {analysis.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {analysis.description}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {chartTypeLabel[analysis.chartType]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
