"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, BarChart3 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

import { chartsApi } from "@/lib/api/charts";

type ChartDataState =
  | {
      type: "pie";
      data: Array<{ name: string; value: number }>;
    }
    | {
      type: "bar";
      data: Array<{ name: string; value: number }>;
    }
    | null;

type ChartLabelsState =
  | {
      type: "bar";
      data: Array<{ name: string; value: number }>;
    }
    | null;

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dashboard, charts, loading, error, refetch } = useDashboard(id);

  const [chartState, setChartState] = useState<ChartDataState>(null);
  const [chartLabels, setChartLabels] = useState<ChartLabelsState>(null);

  useEffect(() => {
    if (charts.length === 0) return;

    let mounted = true;

    async function fetchChartData(chartId: number) {
      try {
        const data = await chartsApi.getData(chartId);

        if (!mounted) return;

        // Type assertion for API response shape
        const result = (data as unknown as { result?: unknown[] }).result || data;
        if (!Array.isArray(result) || result.length === 0) return;

        const first = result[0];

        // Try pie chart config
        if (first.config && "pie" in first.config && first.config.pie) {
          const pieData = first.config.pie.data || [];
          const formatted = pieData.map(
            (item: { name: string; value: number }) => ({
              name: item.name,
              value: item.value,
            }),
          );
          if (mounted) setChartState({ type: "pie", data: formatted });
          return;
        }

        // Try bar config
        if (first.config && "bar" in first.config && first.config.bar) {
          const barData = first.config.bar.data || [];
          const formatted = barData.map(
            (item: { name: string; value: number }) => ({
              name: item.name,
              value: item.value,
            }),
          );
          if (mounted) setChartState({ type: "bar", data: formatted });
          if (mounted) setChartLabels({ type: "bar", data: formatted });
          return;
        }

        // Fallback: use metrics
        if (first.metrics) {
          const formatted = first.metrics.map(
            (m: { name: string; value: number; label?: string; id?: string }) => ({
              name: m.label || m.name || String(m.id || ""),
              value: Number(m.value) || 0,
            }),
          );
          if (mounted) setChartLabels({ type: "bar", data: formatted });
          if (mounted) setChartState({ type: "bar", data: formatted });
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Erro ao buscar dados do chart:", err);
      }
    }

    charts.forEach((chart) => fetchChartData(chart.id));

    return () => {
      mounted = false;
    };
  }, [charts]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-48 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboards">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4" />
            Dashboards
          </Button>
        </Link>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/dashboards">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboards
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {dashboard?.dashboard_title || "Dashboard"}
        </h1>
        {dashboard?.slug && (
          <p className="text-sm text-slate-500 mt-1">/{dashboard.slug}</p>
        )}
      </div>

      {charts.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum gráfico neste dashboard</p>
        </Card>
      ) : chartState === null && chartLabels === null ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.map((chart) => (
            <Card key={chart.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-slate-900 text-sm">
                  {chart.slice_name}
                </h3>
                {chart.viz_type && <Badge>{chart.viz_type}</Badge>}
              </div>
              <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                <p className="text-sm text-slate-400">Carregando visualização...</p>
              </div>
            </Card>
          ))}
        </div>
      ) : chartState !== null ? (
        <ResponsiveContainer width="100%" height={300}>
          {chartState.type === "pie" ? (
            <PieChart>
              <Pie
                data={chartState.data}
                cx="50%"
                cy="50%"
                r="50%"
                labelLine={false}
              >
                {chartState.data.map((entry, index) => (
                  <Cell key={index} fill={`hsl(${index * 36 + 200}, 70%, 60%)`} />
                ))}
              </Pie>
            </PieChart>
          ) : chartState.type === "bar" && (
            <BarChart data={chartState.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="name" fill="#8884d8" />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : chartLabels !== null ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartLabels.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="name" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}