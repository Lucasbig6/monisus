"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardsApi } from "@/lib/api/dashboards";
import type { Dashboard, Chart } from "@/lib/types";

export function useDashboard(id: string) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, c] = await Promise.all([
        dashboardsApi.get(id),
        dashboardsApi.getCharts(id),
      ]);
      setDashboard(d);
      setCharts(Array.isArray(c) ? c : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { dashboard, charts, loading, error, refetch: fetchData };
}
