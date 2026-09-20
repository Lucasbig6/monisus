import { apiPost } from "../api"

export interface ExecuteQueryRequest {
  database_id: number
  sql: string
  db_schema?: string
}

export interface FilterClause {
  column: string
  operator: "eq" | "in" | "gte" | "lte" | "between"
  values: string | string[]
}

export interface ExecuteFilteredQueryRequest extends ExecuteQueryRequest {
  filters: FilterClause[]
}

export interface QueryResult {
  status: string
  data: Record<string, unknown>[]
  message?: string
}

export async function executeQuery(params: ExecuteQueryRequest): Promise<QueryResult> {
  return apiPost<QueryResult>("/api/queries/execute", params)
}

export async function executeQueryFiltered(
  params: ExecuteFilteredQueryRequest
): Promise<QueryResult> {
  return apiPost<QueryResult>("/api/queries/execute-filtered", params)
}
