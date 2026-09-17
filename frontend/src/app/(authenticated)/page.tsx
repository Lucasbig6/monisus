"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDashboards } from "@/lib/hooks/useDashboards";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LayoutDashboard, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const { user } = useAuth();
  const { dashboards, loading, error, refetch } = useDashboards();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Olá, {user?.first_name || user?.username || "Usuário"}
        </h1>
        <p className="text-slate-500 mt-1">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Dashboards</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {loading ? <Skeleton className="h-8 w-16 inline-block" /> : dashboards.length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Status</p>
          <p className="text-lg font-semibold text-green-600 mt-1">Online</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Plataforma</p>
          <p className="text-lg font-semibold text-monisus-700 mt-1">MoniSUS</p>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Dashboards recentes</h2>
          <Link href="/dashboards" className="text-sm text-monisus-700 hover:text-monisus-800 font-medium">
            Ver todos
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-3 w-24" />
              </Card>
            ))}
          </div>
        )}

        {error && <ErrorState message={error} onRetry={refetch} />}

        {!loading && !error && dashboards.length === 0 && (
          <Card className="p-8 text-center">
            <LayoutDashboard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum dashboard encontrado</p>
          </Card>
        )}

        {!loading && !error && dashboards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dashboards.slice(0, 4).map((d) => (
              <Link key={d.id} href={`/dashboards/${d.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                  <h3 className="font-medium text-slate-900 group-hover:text-monisus-700 transition-colors">
                    {d.dashboard_title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {formatDate(d.changed_on || d.created_on)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/explorar">
          <Button variant="secondary">
            <Search className="h-4 w-4" />
            Explorar dados
          </Button>
        </Link>
        <Link href="/dashboards">
          <Button variant="secondary">
            <LayoutDashboard className="h-4 w-4" />
            Ver dashboards
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
