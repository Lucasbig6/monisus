import { api } from "./client";
import type { Dashboard, Chart, PaginatedResponse } from "../types";

export const dashboardsApi = {
  list: (page = 0, pageSize = 50) =>
    api.get<PaginatedResponse<Dashboard>>(
      `/api/dashboards?page=${page}&page_size=${pageSize}`,
    ),

  get: (id: number | string) => api.get<Dashboard>(`/api/dashboards/${id}`),

  getCharts: (id: number | string) =>
    api.get<Chart[]>(`/api/dashboards/${id}/charts`),
};
