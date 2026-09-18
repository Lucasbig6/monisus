import { apiPost } from "../api"

export interface ExecuteQueryRequest {
  database_id: number
  sql: string
  db_schema?: string
}

export interface QueryResult {
  status: string
  data: Record<string, unknown>[]
  message?: string
}

export async function executeQuery(params: ExecuteQueryRequest): Promise<QueryResult> {
  return apiPost<QueryResult>("/api/queries/execute", params)
}
