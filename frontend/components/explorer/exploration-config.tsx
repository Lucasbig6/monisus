"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import { BarChart3, LineChart, Play, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DatasetColumn } from "@/lib/api/datasets"
import type {
  AggregationType,
  ChartVisualization,
  ExplorationRequest,
} from "@/lib/explorer/sql"
import { DraggableField } from "./draggable-field"
import { FieldDropSlot } from "./field-drop-slot"

export type { AggregationType, ChartVisualization, ExplorationRequest }

interface ExplorationConfigProps {
  columns: DatasetColumn[]
  onExecute: (config: ExplorationRequest) => void
  loading: boolean
  disabled?: boolean
}

const NUMERIC_TYPES = new Set([
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "NUMERIC",
  "DECIMAL",
  "FLOAT",
  "DOUBLE PRECISION",
  "REAL",
  "INT",
  "SERIAL",
  "BIGSERIAL",
])

function isDimensionColumn(col: DatasetColumn): boolean {
  if (col.groupby) return true
  if (col.is_dttm) return true
  const upper = col.type.toUpperCase()
  return (
    upper.includes("VARCHAR") ||
    upper.includes("CHAR") ||
    upper.includes("TEXT") ||
    upper === "DATE" ||
    upper.includes("TIMESTAMP")
  )
}

function isMetricColumn(col: DatasetColumn): boolean {
  const upper = col.type.toUpperCase()
  if (NUMERIC_TYPES.has(upper)) return true
  return (
    upper.includes("INT") ||
    upper.includes("NUMERIC") ||
    upper.includes("DECIMAL") ||
    upper.includes("FLOAT")
  )
}

type SlotType = "dimension" | "metric"

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: "SUM", label: "Soma" },
  { value: "AVG", label: "Média" },
  { value: "COUNT", label: "Contagem" },
]

const CHART_OPTIONS: {
  value: ChartVisualization
  label: string
  icon: typeof BarChart3
}[] = [
  { value: "bar", label: "Barras", icon: BarChart3 },
  { value: "line", label: "Linha", icon: LineChart },
  { value: "table", label: "Tabela", icon: Table2 },
]

export function ExplorationConfig({
  columns,
  onExecute,
  loading,
  disabled = false,
}: ExplorationConfigProps) {
  const [dimension, setDimension] = useState("")
  const [metric, setMetric] = useState("")
  const [aggregation, setAggregation] = useState<AggregationType>("SUM")
  const [chartType, setChartType] = useState<ChartVisualization>("bar")

  const [dragOverSlot, setDragOverSlot] = useState<SlotType | null>(null)
  const [dragError, setDragError] = useState<SlotType | null>(null)
  const dragErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const usedFields = useMemo(() => {
    const set = new Set<string>()
    if (dimension) set.add(dimension)
    if (metric && metric !== "__count__") set.add(metric)
    return set
  }, [dimension, metric])

  const canExecute = dimension !== "" && metric !== "" && !loading

  const showDragError = useCallback((slot: SlotType) => {
    setDragError(slot)
    if (dragErrorTimer.current) clearTimeout(dragErrorTimer.current)
    dragErrorTimer.current = setTimeout(() => setDragError(null), 1500)
  }, [])

  function handleDragStart(e: React.DragEvent, columnName: string) {
    e.dataTransfer.setData("text/plain", columnName)
    e.dataTransfer.effectAllowed = "copy"
  }

  function handleDragOver(
    e: React.DragEvent,
    slot: SlotType,
    compatible: boolean
  ) {
    e.preventDefault()
    if (compatible) {
      e.dataTransfer.dropEffect = "copy"
      setDragOverSlot(slot)
    } else {
      e.dataTransfer.dropEffect = "none"
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOverSlot(null)
  }

  function handleDrop(e: React.DragEvent, slot: SlotType) {
    e.preventDefault()
    setDragOverSlot(null)

    const columnName = e.dataTransfer.getData("text/plain")
    if (!columnName) return

    const col = columns.find((c) => c.column_name === columnName)
    if (!col) return

    if (slot === "dimension" && isDimensionColumn(col)) {
      setDimension(columnName)
    } else if (slot === "metric" && isMetricColumn(col)) {
      setMetric(columnName)
    } else {
      showDragError(slot)
    }
  }

  function handleFieldClick(columnName: string) {
    if (disabled) return
    if (usedFields.has(columnName)) return

    const col = columns.find((c) => c.column_name === columnName)
    if (!col) return

    if (isDimensionColumn(col) && !dimension) {
      setDimension(columnName)
    } else if (isMetricColumn(col) && !metric) {
      setMetric(columnName)
    }
  }

  function handleRemoveFromSlot(slot: SlotType) {
    if (slot === "dimension") setDimension("")
    else setMetric("")
  }

  function handleExecute() {
    if (!dimension || !metric) return
    onExecute({ dimension, metric, aggregation, chartType })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Left: Fields panel */}
      <Card className="border-slate-200 bg-white self-start">
        <CardHeader>
          <CardTitle className="text-sm">Campos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {columns.map((col) => {
            const isUsed = usedFields.has(col.column_name)
            const kind = isMetricColumn(col) ? "metric" : "dimension"
            return (
              <DraggableField
                key={col.column_name}
                name={col.column_name}
                kind={kind}
                isUsed={isUsed}
                disabled={disabled}
                onDragStart={handleDragStart}
                onClick={handleFieldClick}
              />
            )
          })}
        </CardContent>
      </Card>

      {/* Right: Configuration panel */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-sm">Configurar análise</CardTitle>
          <p className="text-xs text-slate-500">
            Mesmo dataset da aba SQL: escolha dimensão e métrica, ou arraste os
            campos para os slots.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dimension slot */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Dimensão
            </span>
            <FieldDropSlot
              value={dimension || null}
              label="Arraste um campo categórico ou temporal aqui"
              dragOver={dragOverSlot === "dimension"}
              error={dragError === "dimension"}
              onDragOver={(e) => handleDragOver(e, "dimension", true)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "dimension")}
              onRemove={() => handleRemoveFromSlot("dimension")}
            />
          </div>

          {/* Metric slot */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Métrica
            </span>
            <FieldDropSlot
              value={metric || null}
              label="Arraste um campo numérico aqui"
              dragOver={dragOverSlot === "metric"}
              error={dragError === "metric"}
              onDragOver={(e) => handleDragOver(e, "metric", true)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "metric")}
              onRemove={() => handleRemoveFromSlot("metric")}
            />
          </div>

          {/* Aggregation */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Agregação
            </span>
            <div className="flex gap-1.5">
              {AGGREGATION_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={aggregation === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAggregation(opt.value)}
                  disabled={disabled}
                  className={
                    aggregation === opt.value
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : ""
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Visualization */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Visualização
            </span>
            <div className="flex gap-1.5">
              {CHART_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={chartType === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType(opt.value)}
                    disabled={disabled}
                    className={
                      chartType === opt.value
                        ? "bg-teal-600 text-white hover:bg-teal-700"
                        : ""
                    }
                  >
                    <Icon size={14} />
                    {opt.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Execute */}
          <Button
            type="button"
            onClick={handleExecute}
            disabled={!canExecute}
            className="w-full bg-teal-600 text-white hover:bg-teal-700 sm:w-auto"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                Executando...
              </>
            ) : (
              <>
                <Play size={16} />
                Executar análise
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
