import { api } from "./client";
import type { Chart } from "../types";

export const chartsApi = {
  get: (id: number) => api.get<Chart>(`/api/charts/${id}`),
  getData: (id: number) => api.get<unknown>(`/api/charts/${id}/data`),
};
