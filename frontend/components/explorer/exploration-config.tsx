"use client"

import React, { useMemo, useState } from "react"
import { BarChart3, LineChart, Play, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ColumnSelector,
  type ColumnSelectorOption,
} from "./column-selector"
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
  return upper.includes("INT") || upper.includes("NUMERIC") || upper.includes("DECIMAL") || upper.includes("FLOAT")
}

export function ExplorationConfig({
  columns,
  onExecute,
  loading,
  disabled = false,
}: ExplorationConfigProps) {
  const dimensionOptions = useMemo<ColumnSelectorOption[]>(
    () =>
      columns
        .filter(isDimensionColumn)
        .map((col) => ({
          value: col.column_name,
          label: col.column_name,
        })),
    [columns]
  )

  const metricOptions = useMemo<ColumnSelectorOption[]>(() => {
    const numericColumns = columns.filter(isMetricColumn)

    return [
      { value: "__count__", label: "Contagem de registros" },
      ...numericColumns.map((col) => ({
        value: col.column_name,
        label: col.column_name,
      })),
    ]
  }, [columns])

  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [aggregation, setAggregation] = useState<AggregationType>("SUM")
  const [chartType, setChartType] = useState<ChartVisualization>("bar")

  const effectiveDimension = useMemo(() => {
    if (selectedDimension && dimensionOptions.some((o) => o.value === selectedDimension)) {
      return selectedDimension
    }
    return dimensionOptions[0]?.value ?? null
  }, [selectedDimension, dimensionOptions])

  const effectiveMetric = useMemo(() => {
    if (selectedMetric && metricOptions.some((o) => o.value === selectedMetric)) {
      return selectedMetric
    }
    return metricOptions[0]?.value ?? null
  }, [selectedMetric, metricOptions])

  const canExecute = effectiveDimension !== null && effectiveMetric !== null && !loading

  function handleExecute() {
    if (!effectiveDimension || !effectiveMetric) return

    onExecute({
      dimension: effectiveDimension,
      metric: effectiveMetric,
      aggregation,
      chartType,
    })
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Configurar análise</CardTitle>
        <p className="text-sm text-slate-500">
          Selecione a dimensão, métrica e tipo de visualização.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ColumnSelector
            label="Dimensão (eixo X)"
            options={dimensionOptions}
            value={effectiveDimension}
            onChange={setSelectedDimension}
            placeholder="Selecione uma dimensão"
            disabled={disabled || dimensionOptions.length === 0}
          />

          <ColumnSelector
            label="Métrica"
            options={metricOptions}
            value={effectiveMetric}
            onChange={setSelectedMetric}
            placeholder="Selecione uma métrica"
            disabled={disabled || metricOptions.length === 0}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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
  )
}
