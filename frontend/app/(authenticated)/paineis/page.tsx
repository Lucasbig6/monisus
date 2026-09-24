"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  Inbox,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Input,
} from "@/components/ui/input"
import {
  Label,
} from "@/components/ui/label"
import type { Dashboard } from "@/lib/types/dashboard"
import { DeleteConfirmationDialog } from "@/components/shared/delete-confirmation-dialog"
import {
  getDashboards,
  saveDashboard,
  deleteDashboard,
} from "@/lib/storage/dashboards"

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function PaineisPage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<Dashboard[]>(getDashboards)
  const [deleteTarget, setDeleteTarget] = useState<Dashboard | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  function handleDelete() {
    if (!deleteTarget) return
    deleteDashboard(deleteTarget.id)
    setDashboards((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return

    setCreating(true)

    const dashboard = saveDashboard({
      name: trimmed,
      description: newDescription.trim(),
      widgets: [],
      filters: [],
    })

    setDashboards(getDashboards())
    setCreateOpen(false)
    setNewName("")
    setNewDescription("")
    setCreating(false)
    router.push(`/paineis/${dashboard.id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <section>
        <Link
          href="/inicio"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <BarChart3 size={14} />
          Início
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Painéis
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Dashboards personalizados com visualizações arrastáveis.
            </p>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            <Plus size={16} />
            Novo dashboard
          </Button>
        </div>
      </section>

      {/* Empty state */}
      {dashboards.length === 0 ? (
        <section className="mt-8">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Inbox size={24} className="text-slate-400" />
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">
              Nenhum dashboard criado
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Crie seu primeiro dashboard para organizar gráficos e análises em
              um painel personalizado.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-6 bg-teal-600 text-white hover:bg-teal-700"
            >
              <Plus size={16} />
              Novo dashboard
            </Button>
          </div>
        </section>
      ) : (
        /* Dashboard cards */
        <section className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <BarChart3 size={18} />
                  </div>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {dashboard.widgets.length} widget
                    {dashboard.widgets.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-semibold text-slate-900 line-clamp-1">
                  {dashboard.name}
                </h3>

                {dashboard.description && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  Atualizado em {formatDate(dashboard.updatedAt)}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/paineis/${dashboard.id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Abrir
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(dashboard)}
                    className="shrink-0 text-slate-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateOpen(false)
          setNewName("")
          setNewDescription("")
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo dashboard</DialogTitle>
            <DialogDescription>
              Dê um nome para seu dashboard para encontrá-lo facilmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Nome *</Label>
              <Input
                id="dashboard-name"
                placeholder="Ex: Atendimentos Mensais"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dashboard-description">Descrição</Label>
              <Input
                id="dashboard-description"
                placeholder="Ex: Visão geral de atendimentos por período."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setNewName("")
                setNewDescription("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Excluir dashboard"
        itemName={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
      />
    </div>
  )
}
