"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboards } from "@/lib/hooks/useDashboards";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LayoutDashboard, Search, BarChart3, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const { dashboards, loading, error, refetch } = useDashboards();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const input = document.querySelector('input[placeholder*="Pesquisar"]') as HTMLInputElement;
      if (input) input.focus();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          { [1, 2, 3].map(function (i) {
            return (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <main className="flex-1 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Início</h1>
        <p className="text-text-secondary mt-2">
          Acompanhe, explore e analise os dados do SUS.
        </p>
      </header>
      <div className="mb-8">
        <h2 className="text-xl font-medium text-primary mb-3">O que você deseja analisar?</h2>
        <Input placeholder="Pesquisar dashboards, dados, indicadores..." className="w-full max-w-2xl" readOnly />
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/dashboards", "_self")} tabIndex={0}>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="text-font-medium">Dashboards</span>
          </div>
          <p className="text-text-secondary text-sm line-clamp-2">Visualize painéis e acompanhamentos disponíveis.</p>
        </Card>
        <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/explorar", "_self")} tabIndex={0}>
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <span className="text-font-medium">Explorar dados</span>
          </div>
          <p className="text-text-secondary text-sm line-clamp-2">Explore dados, dimensões, medidas e cruzamentos.</p>
        </Card>
        <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/indicadores", "_self")} tabIndex={0}>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-font-medium">Indicadores</span>
          </div>
          <p className="text-text-secondary text-sm line-clamp-2">Consulte indicadores e métricas do SUS.</p>
        </Card>
        <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.open("/analises", "_self")} tabIndex={0}>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-font-medium">Análises</span>
          </div>
          <p className="text-text-secondary text-sm line-clamp-2">Crie e consulte análises personalizadas.</p>
        </Card>
      </div>
      <section className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">Dashboards disponíveis</h2>
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(function (i) {
              return (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              );
            })}
          </div>
        )}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && dashboards.length === 0 && (
          <EmptyState title="Nenhum dashboard encontrado" description="Ainda não há dashboards disponíveis." icon={<LayoutDashboard className="h-8 w-8 text-slate-400" />} />
        )}
        {!loading && !error && dashboards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map(function (d) {
              return (
                <Card key={d.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-primary line-clamp-1">{d.dashboard_title}</h3>
                    <span className="text-text-secondary text-sm">{d.published !== false ? "Publicado" : "Rascunho"}</span>
                  </div>
                  <p className="text-text-secondary text-xs mt-1">{formatDate(d.changed_on || d.created_on)}</p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
      <section className="mt-8 p-6 bg-background rounded-xl border border-border">
        <h3 className="font-medium text-primary mb-3">Comece por aqui</h3>
        <ol className="list-decimal list-inside text-text-secondary space-y-2">
          <li>Escolha um conjunto de dados ou dashboard</li>
          <li>Explore dimensões, medidas e filtros</li>
          <li>Construa sua análise</li>
        </ol>
      </section>
    </main>
  );
}