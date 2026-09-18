"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Database } from "lucide-react"
import dynamic from "next/dynamic"
import { DatasetSelector } from "@/components/explorer/dataset-selector"
import { QueryResult } from "@/components/explorer/query-result"
import {
  listDatasets,
  getDataset,
  DatasetListItem,
} from "@/lib/api/datasets"
import { executeQuery } from "@/lib/api/queries"
import { ApiError } from "@/lib/api"

const SqlEditor = dynamic(
  () =>
    import("@/components/explorer/sql-editor").then((m) => ({
      default: m.SqlEditor,
    })),
  { ssr: false }
)

const DEFAULT_SQL = ""

export default function ExplorarPage() {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([])
  const [loadingDatasets, setLoadingDatasets] = useState(true)
  const [datasetsError, setDatasetsError] = useState<string | null>(null)

  const [selectedDataset, setSelectedDataset] = useState<DatasetListItem | null>(null)
  const [sql, setSql] = useState(DEFAULT_SQL)

  const [result, setResult] = useState<Record<string, unknown>[] | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await listDatasets()
        setDatasets(data.result ?? [])
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.detail
            : "Erro ao carregar datasets."
        setDatasetsError(msg)
      } finally {
        setLoadingDatasets(false)
      }
    }
    load()
  }, [])

  async function handleSelectDataset(dataset: DatasetListItem) {
    setSelectedDataset(dataset)

    try {
      const detail = await getDataset(dataset.id)
      if (detail.database?.id) {
        const schema = detail.schema || "public"
        setSql(
          `SELECT *\nFROM ${dataset.table_name}\nWHERE schema = '${schema}'\nLIMIT 100;`
        )
      }
    } catch {
      setSql(`SELECT *\nFROM ${dataset.table_name}\nLIMIT 100;`)
    }
  }

  async function handleExecute() {
    if (!selectedDataset) return

    setExecuting(true)
    setExecuteError(null)
    setResult(null)

    try {
      const response = await executeQuery({
        database_id: selectedDataset.database.id,
        sql,
        db_schema: selectedDataset.schema || undefined,
      })

      if (response.status === "error") {
        setExecuteError(response.message || "Erro ao executar a consulta.")
      } else {
        setResult(response.data ?? [])
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.detail
          : "Não foi possível executar a consulta."
      setExecuteError(msg)
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Explorar dados
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulte e analise os dados disponíveis no MoniSUS.
        </p>
      </section>

      {/* Dataset selector */}
      <section className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Conjuntos de dados</h2>
              <p className="text-xs text-slate-500">
                Selecione o conjunto de dados para consulta.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {datasetsError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle size={16} />
                {datasetsError}
              </div>
            ) : (
              <DatasetSelector
                datasets={datasets}
                value={selectedDataset?.id ?? null}
                onChange={handleSelectDataset}
                loading={loadingDatasets}
              />
            )}
          </div>

          {selectedDataset && selectedDataset.columns?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">
                Colunas disponíveis:
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedDataset.columns.map((col) => (
                  <span
                    key={col.column_name}
                    className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                  >
                    {col.column_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SQL Editor */}
      <section className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Consulta SQL
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Escreva sua consulta SQL abaixo. Use Ctrl+Enter para executar.
          </p>

          <div className="mt-4">
            <SqlEditor
              value={sql}
              onChange={setSql}
              onExecute={handleExecute}
              loading={executing}
              disabled={!selectedDataset}
              datasets={datasets}
              columns={selectedDataset?.columns ?? []}
            />
          </div>
        </div>
      </section>

      {/* Result */}
      <section className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Resultado</h2>

          <div className="mt-4">
            <QueryResult
              key={result ? JSON.stringify(result) : "empty"}
              data={result}
              loading={executing}
              error={executeError}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
