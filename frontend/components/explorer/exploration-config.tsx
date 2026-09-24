"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import {
  BarChart3,
  GripVertical,
  Hash,
  LineChart,
  Play,
  Table2,
  Type,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DatasetColumn } from "@/lib/api/datasets"
import type {
  AggregationType,
  ChartVisualization,
  ExplorationRequest,
} from "@/lib/explorer/sql"

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

function getFieldIcon(col: DatasetColumn) {
  return isMetricColumn(col) ? Hash : Type
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

  const dimensionColumns = useMemo(
    () => columns.filter(isDimensionColumn),
    [columns]
  )

  const metricColumns = useMemo(
    () => columns.filter(isMetricColumn),
    [columns]
  )

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

  function handleFieldClick(col: DatasetColumn) {
    if (disabled) return
    if (usedFields.has(col.column_name)) return

    if (isDimensionColumn(col) && !dimension) {
      setDimension(col.column_name)
    } else if (isMetricColumn(col) && !metric) {
      setMetric(col.column_name)
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
            const Icon = getFieldIcon(col)
            const isUsed = usedFields.has(col.column_name)
            return (
              <div
                key={col.column_name}
                draggable={!isUsed && !disabled}
                onDragStart={(e) => handleDragStart(e, col.column_name)}
                onClick={() => handleFieldClick(col)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  isUsed
                    ? "border-slate-100 bg-slate-50 opacity-50 cursor-default"
                    : "border-slate-200 bg-white cursor-grab active:cursor-grabbing hover:border-slate-300 hover:bg-slate-50",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                <GripVertical
                  size={14}
                  className={cn(
                    "shrink-0",
                    isUsed ? "text-slate-300" : "text-slate-400"
                  )}
                />
                <Icon
                  size={14}
                  className={cn(
                    "shrink-0",
                    isMetricColumn(col) ? "text-blue-500" : "text-slate-500"
                  )}
                />
                <span className="truncate text-slate-700">
                  {col.column_name}
                </span>
              </div>
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
            <DropSlot
              slot="dimension"
              value={dimension}
              label="Arraste um campo categórico ou temporal aqui"
              dragOver={dragOverSlot === "dimension"}
              error={dragError === "dimension"}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onRemove={() => handleRemoveFromSlot("dimension")}
            />
          </div>

          {/* Metric slot */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Métrica
            </span>
            <DropSlot
              slot="metric"
              value={metric}
              label="Arraste um campo numérico aqui"
              dragOver={dragOverSlot === "metric"}
              error={dragError === "metric"}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
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

/* ------------------------------------------------------------------ */
/*  DropSlot                                                          */
/* ------------------------------------------------------------------ */

interface DropSlotProps {
  slot: SlotType
  value: string
  label: string
  dragOver: boolean
  error: boolean
  onDragOver: (
    e: React.DragEvent,
    slot: SlotType,
    compatible: boolean
  ) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, slot: SlotType) => void
  onRemove: () => void
}

function DropSlot({
  slot,
  value,
  label,
  dragOver,
  error,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: DropSlotProps) {
  const compatibleRef = useRef(false)

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      const columnName = e.dataTransfer.types.includes("text/plain")
      if (!columnName) return

      // We can't read data during dragover, so we rely on the parent
      // to determine compatibility via the drop handler.
      // For visual feedback, we always show the "compatible" state
      // during dragover and handle rejection on drop.
      compatibleRef.current = true
      onDragOver(e, slot, true)
    },
    [onDragOver, slot]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      compatibleRef.current = false
      onDragLeave(e)
    },
    [onDragLeave]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      compatibleRef.current = false
      onDrop(e, slot)
    },
    [onDrop, slot]
  )

  if (value) {
    return (
      <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-teal-200 bg-white px-3 text-sm text-slate-900 shadow-sm">
        <span className="truncate font-medium">{value}</span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={`Remover ${value}`}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex h-10 items-center justify-center rounded-lg border-2 border-dashed px-3 text-sm transition-colors",
        error
          ? "border-red-300 bg-red-50 text-red-500"
          : dragOver
            ? "border-teal-400 bg-teal-50 text-teal-600"
            : "border-slate-200 bg-slate-50/50 text-slate-400 hover:border-slate-300"
      )}
    >
      {error ? "Tipo incompatível" : label}
    </div>
  )
}
