import type { DatasetColumn } from "@/lib/api/datasets"
import type { ChartVisualization } from "@/lib/types/charts"

export type { ChartVisualization } from "@/lib/types/charts"
export type AggregationType = "SUM" | "AVG" | "COUNT"

export interface ExplorationRequest {
  dimension: string
  metric: string
  aggregation: AggregationType
  chartType: ChartVisualization
}

const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export function isValidIdentifier(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name)
}

export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

export function validateIdentifiers(
  config: ExplorationRequest,
  columns: DatasetColumn[]
): string | null {
  const columnNames = new Set(columns.map((c) => c.column_name))

  if (!isValidIdentifier(config.dimension)) {
    return `Nome de dimensão inválido: "${config.dimension}"`
  }
  if (!columnNames.has(config.dimension)) {
    return `Dimensão "${config.dimension}" não existe no dataset`
  }

  if (config.metric !== "__count__") {
    if (!isValidIdentifier(config.metric)) {
      return `Nome de métrica inválido: "${config.metric}"`
    }
    if (!columnNames.has(config.metric)) {
      return `Métrica "${config.metric}" não existe no dataset`
    }
  }

  return null
}

export function generateExplorationSql(
  config: ExplorationRequest,
  tableName: string,
  columns: DatasetColumn[]
): string {
  const validationError = validateIdentifiers(config, columns)
  if (validationError) {
    throw new Error(validationError)
  }

  if (!tableName.trim()) {
    throw new Error("Nome de tabela vazio.")
  }

  const dim = quoteIdentifier(config.dimension)
  const from = quoteIdentifier(tableName)

  let aggExpression: string
  let metricAlias: string

  if (config.metric === "__count__") {
    aggExpression = "COUNT(*)"
    metricAlias = "total_registros"
  } else if (config.aggregation === "COUNT") {
    aggExpression = `COUNT(${quoteIdentifier(config.metric)})`
    metricAlias = `count_${config.metric}`
  } else {
    aggExpression = `${config.aggregation}(${quoteIdentifier(config.metric)})`
    metricAlias = `${config.aggregation.toLowerCase()}_${config.metric}`
  }

  const alias = quoteIdentifier(metricAlias)

  return [
    `SELECT ${dim}, ${aggExpression} AS ${alias}`,
    `FROM ${from}`,
    `GROUP BY ${dim}`,
    `ORDER BY ${alias} DESC`,
    `LIMIT 100`,
  ].join("\n")
}

export function generatePreviewSql(tableName: string): string {
  if (!tableName.trim()) {
    throw new Error("Nome de tabela vazio.")
  }
  return `SELECT *\nFROM ${quoteIdentifier(tableName)}\nLIMIT 100`
}
