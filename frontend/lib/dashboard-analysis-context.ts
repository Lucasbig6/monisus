import type { Dashboard } from "@/lib/types/dashboard"
import type { ChartType } from "@/lib/types/charts"
import { getAnalysis } from "@/lib/storage/analyses"

/**
 * Contexto estrutural do dashboard para o futuro Copiloto/Agente.
 *
 * IMPORTANTE (ETAPA 6): apenas contrato de dados. NÃO implementa LangChain,
 * LangGraph, LLM, ferramentas de agente, streaming, memória ou RAG.
 *
 * Fluxo futuro (não implementado):
 *   Dashboard
 *     → Copiloto
 *       → Agente
 *         → Ferramentas controladas
 *              - get_dashboard_context()
 *              - get_dataset_schema()
 *              - execute_query()
 *              - analyze_result()
 *              - create_chart()
 *              - explain_result()
 *
 * Contrato de envio futuro (sem acoplamento a frameworks):
 *   onSendMessage(message: string, context: DashboardAnalysisContext)
 */
export interface DashboardAnalysisContextWidget {
  analysisId: string
  title: string
  chartType: ChartType
  datasetId: number | null
  databaseId: number
  dbSchema: string | null
  dimension: string | null
  metric: string | null
  sql: string
}

export interface DashboardAnalysisContext {
  dashboard: {
    id: string
    name: string
    description: string
  }
  widgets: DashboardAnalysisContextWidget[]
}

/**
 * Monta o contexto do dashboard resolvendo cada analysisId via storage
 * existente (getAnalysis). Não duplica dados de análise no dashboard.
 */
export function getDashboardAnalysisContext(
  dashboard: Dashboard
): DashboardAnalysisContext {
  const widgets: DashboardAnalysisContextWidget[] = []

  for (const widget of dashboard.widgets) {
    const analysis = getAnalysis(widget.analysisId)
    if (!analysis) continue

    widgets.push({
      analysisId: analysis.id,
      title: analysis.name,
      chartType: analysis.chartType,
      datasetId: analysis.datasetId,
      databaseId: analysis.databaseId,
      dbSchema: analysis.dbSchema,
      dimension: analysis.dimension,
      metric: analysis.metric,
      sql: analysis.sql,
    })
  }

  return {
    dashboard: {
      id: dashboard.id,
      name: dashboard.name,
      description: dashboard.description,
    },
    widgets,
  }
}
