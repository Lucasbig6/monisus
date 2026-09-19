"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  Inbox,
  LineChart,
  Pencil,
  PieChart,
  Search,
  Table2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Analysis } from "@/lib/types/analysis"
import { getAnalyses, deleteAnalysis } from "@/lib/storage/analyses"

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

export default function AnalisesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>(getAnalyses)
  const [deleteTarget, setDeleteTarget] = useState<Analysis | null>(null)

  function handleDelete() {
    if (!deleteTarget) return
    deleteAnalysis(deleteTarget.id)
    setAnalyses((prev) => prev.filter((a) => a.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <section>
        <Link
          href="/explorar"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar ao Explorer
        </Link>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Minhas Análises
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Análises salvas pelo usuário no Explorer.
        </p>
      </section>

      {/* Empty state */}
      {analyses.length === 0 ? (
        <section className="mt-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Inbox size={24} className="text-slate-400" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">
              Nenhuma análise salva
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Execute uma query no Explorer, configure a visualização e salve
              sua primeira análise.
            </p>
            <Link href="/explorar" className="mt-6">
              <Button className="bg-teal-600 text-white hover:bg-teal-700">
                <Search size={16} />
                Criar análise
              </Button>
            </Link>
          </div>
        </section>
      ) : (
        /* Analysis cards */
        <section className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => {
              const Icon = chartTypeIcon[analysis.chartType]

              return (
                <div
                  key={analysis.id}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon size={18} />
                    </div>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {chartTypeLabel[analysis.chartType]}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-slate-900 line-clamp-1">
                    {analysis.name}
                  </h3>

                  {analysis.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {analysis.description}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-400">
                    Atualizado em {formatDate(analysis.updatedAt)}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/analises/${analysis.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Abrir
                      </Button>
                    </Link>
                    <Link
                      href={`/explorar?analysisId=${analysis.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Pencil size={13} />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(analysis)}
                      className="shrink-0 text-slate-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir análise</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &ldquo;{deleteTarget?.name}&rdquo;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
