"use client"

import { useState } from "react"
import { AlertCircle, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createDataset } from "@/lib/api/datasets"
import { ApiError } from "@/lib/api"

interface PublishDialogProps {
  open: boolean
  onClose: () => void
  sourceId: number
  tableName: string
  schemaName: string
  databaseName: string
}

export function PublishDialog({
  open,
  onClose,
  sourceId,
  tableName,
  schemaName,
  databaseName,
}: PublishDialogProps) {
  const [name, setName] = useState(tableName)
  const [description, setDescription] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleClose() {
    onClose()
    if (success) {
      setSuccess(false)
      setError(null)
      setName(tableName)
      setDescription("")
    }
  }

  async function handlePublish() {
    if (!name.trim()) return
    setPublishing(true)
    setError(null)
    try {
      await createDataset({
        database_id: sourceId,
        table_name: tableName,
        table_schema: schemaName,
        description: description.trim() || undefined,
      })
      setSuccess(true)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.detail : "Erro ao publicar dataset."
      setError(msg)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar como Dataset</DialogTitle>
          <DialogDescription>
            Registre a tabela {schemaName}.{tableName} como dataset no MoniSUS.
            A tabela original no banco externo não será alterada.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Send size={16} />
              Dataset publicado com sucesso!
            </div>
            <p className="mt-3 text-sm text-slate-500">
              O dataset está disponível na lista de datasets da fonte e no
              Explorar.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="pub-name">Nome *</Label>
                <Input
                  id="pub-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do dataset"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pub-desc">Descrição</Label>
                <Input
                  id="pub-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional"
                />
              </div>
              <p className="text-xs text-slate-400">
                Fonte: {databaseName} &middot; Tabela: {schemaName}.{tableName}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {success ? "Fechar" : "Cancelar"}
          </Button>
          {!success && (
            <Button
              onClick={handlePublish}
              disabled={!name.trim() || publishing}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {publishing && <Loader2 size={14} className="animate-spin" />}
              Publicar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
