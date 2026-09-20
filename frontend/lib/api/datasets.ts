import { apiGet } from "../api"

export interface DatasetColumn {
  column_name: string
  type: string
  is_dttm: boolean
  filterable: boolean
  groupby: boolean
}

export interface DatasetDatabase {
  id: number
  database_name: string
}

export interface DatasetListItem {
  id: number
  table_name: string
  schema: string
  database: DatasetDatabase
  columns: DatasetColumn[]
}

export interface DatasetsListResponse {
  count: number
  result: DatasetListItem[]
}

export interface DatasetDetail extends DatasetListItem {
  description: string | null
}

export interface DistinctValuesResponse {
  result: string[]
}

export async function listDatasets(): Promise<DatasetsListResponse> {
  return apiGet<DatasetsListResponse>("/api/datasets")
}

export async function getDataset(id: number): Promise<DatasetDetail> {
  return apiGet<DatasetDetail>(`/api/datasets/${id}`)
}

export async function getDistinctValues(
  datasetId: number,
  columnName: string
): Promise<DistinctValuesResponse> {
  return apiGet<DistinctValuesResponse>(
    `/api/datasets/${datasetId}/distinct/${encodeURIComponent(columnName)}`
  )
}
