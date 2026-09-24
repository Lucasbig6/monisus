"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FileChartColumn } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Dashboard } from "@/lib/types/dashboard"
import { getDashboardBySlug } from "@/lib/storage/dashboards"
import { isAuthenticated } from "@/lib/auth"
import { DashboardViewer } from "@/components/dashboard/dashboard-viewer"

export default function PainelViewerPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    requestAnimationFrame(() => {
      setDashboard(getDashboardBySlug(slug))
      try {
        setCanEdit(isAuthenticated())
      } catch {
        setCanEdit(false)
      }
      setLoaded(true)
    })
  }, [slug])

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Carregando painel...</p>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <FileChartColumn size={24} className="text-slate-400" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Painel não encontrado
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            O link pode estar incorreto ou o painel ainda não foi criado neste
            navegador.
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button variant="outline">Ir para o Saude360</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardViewer
      dashboard={dashboard}
      canEdit={canEdit}
      editHref={`/paineis/${dashboard.id}`}
    />
  )
}
