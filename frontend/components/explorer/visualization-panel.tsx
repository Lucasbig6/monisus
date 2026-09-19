"use client"

import { useMemo, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartRenderer } from "./chart-renderer"
import {
  ColumnSelector,
  type ColumnSelectorOption,
} from "./column-selector"

export type ChartType = "table" | "bar" | "line" | "pie"
export type ColumnType = "numeric" | "categorical"

export interface ColumnInfo {
  name: string
  type: ColumnType
}

interface VisualizationPanelProps {
  data: Record<string, unknown>[]
  onBackToTable: () => void
}

export function analyzeColumns(
  data: Record<string, unknown>[]
): ColumnInfo[] {
  const sample = data.slice(0, 100)
  const columnNames = Array.from(
    new Set(sample.flatMap((row) => Object.keys(row)))
  )

  return columnNames.map((name) => {
    const values = sample
      .map((row) => row[name])
      .filter((value) => value !== null && value !== undefined)

    if (values.length === 0 || values.every((value) => typeof value === "number")) {
      return { name, type: values.length === 0 ? "categorical" : "numeric" }
    }

    return { name, type: "categorical" }
  })
}

export function VisualizationPanel({
  data,
  onBackToTable,
}: VisualizationPanelProps) {
  const columns = useMemo(() => analyzeColumns(data), [data])
  const dimensionOptions = useMemo<ColumnSelectorOption[]>(
    () =>
      columns
        .filter((column) => column.type === "categorical")
        .map((column) => ({ value: column.name, label: column.name })),
    [columns]
  )
  const metricOptions = useMemo<ColumnSelectorOption[]>(
    () =>
      columns
        .filter((column) => column.type === "numeric")
        .map((column) => ({ value: column.name, label: column.name })),
    [columns]
  )

  const [chartType, setChartType] = useState<Exclude<ChartType, "table">>("bar")
  const [dimension, setDimension] = useState<string | null>(null)
  const [metric, setMetric] = useState<string | null>(null)

  const effectiveDimension = useMemo(() => {
    if (dimension && dimensionOptions.some((o) => o.value === dimension)) {
      return dimension
    }
    return dimensionOptions[0]?.value ?? null
  }, [dimension, dimensionOptions])

  const effectiveMetric = useMemo(() => {
    if (metric && metricOptions.some((o) => o.value === metric)) {
      return metric
    }
    return metricOptions[0]?.value ?? null
  }, [metric, metricOptions])

  const hasValidMetricData =
    effectiveMetric !== null &&
    data.some((row) => {
      const value = row[effectiveMetric]
      return (
        value !== null &&
        value !== undefined &&
        typeof value === "number" &&
        Number.isFinite(value)
      )
    })

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Visualização</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Explore os resultados da consulta em formato gráfico.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBackToTable}
          className="shrink-0"
        >
          <ChevronLeft size={15} />
          Tabela
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <ColumnSelector
            label="Tipo de gráfico"
            options={[
              { value: "bar", label: "Barras" },
              { value: "line", label: "Linha" },
              { value: "pie", label: "Pizza" },
            ]}
            value={chartType}
            onChange={(value) => setChartType(value as Exclude<ChartType, "table">)}
            placeholder="Selecione um gráfico"
          />
          <ColumnSelector
            label="Dimensão"
            options={dimensionOptions}
            value={effectiveDimension}
            onChange={setDimension}
            placeholder="Selecione uma dimensão"
            disabled={dimensionOptions.length === 0}
          />
          <ColumnSelector
            label="Métrica"
            options={metricOptions}
            value={effectiveMetric}
            onChange={setMetric}
            placeholder="Selecione uma métrica"
            disabled={metricOptions.length === 0}
          />
        </div>

        <div className="space-y-2">
          {dimensionOptions.length === 0 && (
            <p className="text-sm text-amber-700">
              Selecione uma dimensão categórica
            </p>
          )}
          {metricOptions.length === 0 && (
            <p className="text-sm text-amber-700">
              Selecione uma métrica numérica
            </p>
          )}
          {dimensionOptions.length > 0 &&
            metricOptions.length > 0 &&
            !hasValidMetricData && (
              <p className="text-sm text-slate-500">
                Nenhum dado válido para visualizar
              </p>
            )}
        </div>

        <div className="h-[400px] rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <ChartRenderer
            data={data}
            chartType={chartType}
            dimension={effectiveDimension}
            metric={effectiveMetric}
          />
        </div>
      </CardContent>
    </Card>
  )
}
