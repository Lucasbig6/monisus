"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getSourceSchemas,
  getSourceTables,
  type TableItem,
} from "@/lib/api/sources"
import { ApiError } from "@/lib/api"

interface UseSchemaBrowserOptions {
  initialExpanded?: string[]
}

export function useSchemaBrowser(
  sourceId: number,
  options?: UseSchemaBrowserOptions,
) {
  const [schemas, setSchemas] = useState<string[]>([])
  const [schemasLoading, setSchemasLoading] = useState(true)
  const [schemasError, setSchemasError] = useState<string | null>(null)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    () => new Set(options?.initialExpanded ?? []),
  )
  const [schemaTables, setSchemaTables] = useState<Record<string, TableItem[]>>({})
  const [loadingSchemas, setLoadingSchemas] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const data = await getSourceSchemas(sourceId)
        setSchemas(data.schemas ?? [])
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.detail
            : "Erro ao carregar schemas."
        setSchemasError(msg)
      } finally {
        setSchemasLoading(false)
      }
    }
    load()
  }, [sourceId])

  const toggleSchema = useCallback(
    async (schema: string) => {
      setExpandedSchemas((prev) => {
        const next = new Set(prev)
        if (next.has(schema)) {
          next.delete(schema)
        } else {
          next.add(schema)
        }
        return next
      })

      if (!schemaTables[schema]) {
        setLoadingSchemas((prev) => new Set(prev).add(schema))
        try {
          const data = await getSourceTables(sourceId, schema)
          setSchemaTables((prev) => ({ ...prev, [schema]: data.tables ?? [] }))
        } catch {
          setSchemaTables((prev) => ({ ...prev, [schema]: [] }))
        } finally {
          setLoadingSchemas((prev) => {
            const next = new Set(prev)
            next.delete(schema)
            return next
          })
        }
      }
    },
    [sourceId, schemaTables],
  )

  return {
    schemas,
    schemasLoading,
    schemasError,
    expandedSchemas,
    schemaTables,
    loadingSchemas,
    toggleSchema,
  }
}
