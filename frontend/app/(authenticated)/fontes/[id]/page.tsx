"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  Database,
  FileStack,
  FileText,
  Inbox,
  Loader2,
  Table,
  Table2,
  Trash2,
  Upload,
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
import {
  getSource,
  getSourceDatasets,
  deleteSource,
  getSourceTypeConfig,
  type SourceDetail,
} from "@/lib/api/sources"
import { ApiError } from "@/lib/api"

const ICONS: Record<string, typeof Database> = {
  Database,
  FileText,
  Table,
  FileStack,
}

interface DatasetItem {
  id: number
  table_name: string
  schema: string
}

interface DatasetsResponse {
  count: number
  result: DatasetItem[]
}

export default function FonteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sourceId = Number(params.id)

  const [source, setSource] = useState<SourceDetail | null>(null)
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [datasetsLoading, setDatasetsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await getSource(sourceId)
        setSource(data)
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.detail : "Erro ao carregar fonte."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sourceId])

  useEffect(() => {
    async function load() {
      try {
        const data = (await getSourceDatasets(sourceId)) as DatasetsResponse
        setDatasets(data.result ?? [])
      } catch {
        // error silently handled
      } finally {
        setDatasetsLoading(false)
      }
    }
    load()
  }, [sourceId])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteSource(sourceId)
      router.push("/fontes")
    } catch {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center p-12">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  if (error || !source) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error || "Fonte não encontrada."}
        </div>
      </div>
    )
  }

  const typeConfig = getSourceTypeConfig(source.engine)
  const Icon = ICONS[typeConfig.icon] ?? Database
  const isFileSource = !typeConfig.needsConnection

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <section>
        <Link
          href="/fontes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar às Fontes
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Icon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {source.database_name}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {typeConfig.label}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-slate-500 hover:text-red-600"
          >
            <Trash2 size={14} />
            Excluir
          </Button>
        </div>
      </section>

      {/* File source placeholder */}
      {isFileSource && (
        <section className="mt-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Upload size={24} className="text-slate-400" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">
              Preparação de dados
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              O upload e a preparação de arquivos {typeConfig.label} serão
              disponibilizados em uma próxima versão.
            </p>
          </div>
        </section>
      )}

      {/* Datasets */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-slate-900">
          Datasets disponíveis
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Conjuntos de dados disponíveis nesta fonte de conexão.
        </p>

        {datasetsLoading ? (
          <div className="mt-4 flex items-center justify-center p-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Inbox size={20} className="text-slate-400" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Nenhum dataset encontrado
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Esta fonte de dados não possui datasets disponíveis no momento.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((dataset) => (
              <Link
                key={dataset.id}
                href={`/explorar?datasetId=${dataset.id}`}
              >
                <div className="group h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                      <Table2 size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {dataset.table_name}
                      </h3>
                      {dataset.schema && (
                        <p className="text-xs text-slate-500">
                          {dataset.schema}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Explorar dados
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir fonte</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &ldquo;{source.database_name}&rdquo;?
              Todos os datasets associados serão removidos do Superset. Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
