import { apiGet, apiPost, apiPut, apiDelete } from "../api"

export type SourceType = "postgresql" | "csv" | "excel" | "parquet"

export interface SourceTypeConfig {
  id: SourceType
  label: string
  icon: string
  description: string
  needsConnection: boolean
}

export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    id: "postgresql",
    label: "PostgreSQL",
    icon: "Database",
    description: "Conexão com banco de dados PostgreSQL.",
    needsConnection: true,
  },
  {
    id: "csv",
    label: "CSV",
    icon: "FileText",
    description: "Arquivo de valores separados por vírgula.",
    needsConnection: false,
  },
  {
    id: "excel",
    label: "Excel",
    icon: "Table",
    description: "Planilha Microsoft Excel (.xlsx).",
    needsConnection: false,
  },
  {
    id: "parquet",
    label: "Parquet",
    icon: "FileStack",
    description: "Arquivo Apache Parquet colunar.",
    needsConnection: false,
  },
]

export function getSourceTypeConfig(engine: string): SourceTypeConfig {
  const normalized = engine?.toLowerCase() ?? ""
  return (
    SOURCE_TYPES.find((t) => t.id === normalized) ?? SOURCE_TYPES[0]
  )
}

export interface SourceListItem {
  id: number
  database_name: string
  engine: string
}

export interface SourcesListResponse {
  count: number
  result: SourceListItem[]
}

export interface SourceDetail {
  id: number
  database_name: string
  engine: string
}

export interface CreateSourceRequest {
  database_name: string
  engine?: string
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface UpdateSourceRequest {
  database_name?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
}

export interface TestConnectionRequest {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  detail?: string
}

export async function listSources(): Promise<SourcesListResponse> {
  return apiGet<SourcesListResponse>("/api/sources")
}

export async function getSource(id: number): Promise<SourceDetail> {
  return apiGet<SourceDetail>(`/api/sources/${id}`)
}

export async function createSource(data: CreateSourceRequest): Promise<unknown> {
  return apiPost<unknown>("/api/sources", data)
}

export async function updateSource(
  id: number,
  data: UpdateSourceRequest
): Promise<unknown> {
  return apiPut<unknown>(`/api/sources/${id}`, data)
}

export async function deleteSource(id: number): Promise<void> {
  return apiDelete(`/api/sources/${id}`)
}

export async function testConnection(
  data: TestConnectionRequest
): Promise<TestConnectionResponse> {
  return apiPost<TestConnectionResponse>("/api/sources/test", data)
}

export async function getSourceDatasets(sourceId: number): Promise<unknown> {
  return apiGet<unknown>(`/api/sources/${sourceId}/datasets`)
}
