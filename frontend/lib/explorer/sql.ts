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

  if (!isValidIdentifier(tableName)) {
    throw new Error(`Nome de tabela inválido: "${tableName}"`)
  }

  let aggExpression: string
  let metricAlias: string

  if (config.metric === "__count__") {
    aggExpression = "COUNT(*)"
    metricAlias = "total_registros"
  } else if (config.aggregation === "COUNT") {
    aggExpression = `COUNT(${config.metric})`
    metricAlias = `count_${config.metric}`
  } else {
    aggExpression = `${config.aggregation}(${config.metric})`
    metricAlias = `${config.aggregation.toLowerCase()}_${config.metric}`
  }

  return [
    `SELECT ${config.dimension}, ${aggExpression} AS ${metricAlias}`,
    `FROM ${tableName}`,
    `GROUP BY ${config.dimension}`,
    `ORDER BY ${metricAlias} DESC`,
    `LIMIT 100`,
  ].join("\n")
}

export function generatePreviewSql(tableName: string): string {
  if (!isValidIdentifier(tableName)) {
    throw new Error(`Nome de tabela inválido: "${tableName}"`)
  }
  return `SELECT *\nFROM ${tableName}\nLIMIT 100`
}
