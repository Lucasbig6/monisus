"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardsApi } from "@/lib/api/dashboards";
import type { Dashboard } from "@/lib/types";

export function useDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardsApi.list();
      setDashboards(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  return { dashboards, loading, error, refetch: fetchDashboards };
}
