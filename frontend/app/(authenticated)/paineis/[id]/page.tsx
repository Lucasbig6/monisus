"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { use } from "react"
import {
  ArrowLeft,
  FileChartColumn,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dashboard } from "@/lib/types/dashboard"
import { getDashboard } from "@/lib/storage/dashboards"
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder"

export default function DashboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    setDashboard(getDashboard(id))
  }, [id])

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/paineis"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Painéis
        </Link>

        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <FileChartColumn size={24} className="text-slate-400" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-slate-900">
            Painel não encontrado
          </h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Este painel pode ter sido excluído ou o link está incorreto.
          </p>
          <Link href="/paineis" className="mt-6">
            <Button variant="outline">Voltar para Painéis</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <DashboardBuilder
      dashboard={dashboard}
      onDashboardChange={setDashboard}
    />
  )
}
