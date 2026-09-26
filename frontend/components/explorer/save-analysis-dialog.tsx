"use client"

import { useRef, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SaveAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Sucesso/falha são decididos pelo chamador: ele fecha o diálogo no sucesso e
   * expõe `error`. Em caso de rejeição os campos são preservados.
   */
  onSave: (name: string, description: string) => void | Promise<void>
  title?: string
  dialogDescription?: string
  saving?: boolean
  error?: string | null
}

export function SaveAnalysisDialog({
  open,
  onOpenChange,
  onSave,
  title = "Salvar análise",
  dialogDescription = "Dê um nome para esta análise para encontrá-la facilmente depois.",
  saving = false,
  error = null,
}: SaveAnalysisDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const savingRef = useRef(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed || saving || savingRef.current) return

    savingRef.current = true
    try {
      await onSave(trimmed, description.trim())
      setName("")
      setDescription("")
    } catch {
      // o chamador controla `error`; campos do usuário permanecem
    } finally {
      savingRef.current = false
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && saving) return
    if (!nextOpen) {
      setName("")
      setDescription("")
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="analysis-name">Nome *</Label>
            <Input
              id="analysis-name"
              placeholder="Ex: Atendimentos por município"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void handleSave()
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analysis-description">Descrição</Label>
            <Input
              id="analysis-description"
              placeholder="Ex: Total de atendimentos agrupados por município."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!name.trim() || saving}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
