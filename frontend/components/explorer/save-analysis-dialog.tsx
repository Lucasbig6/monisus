"use client"

import { useState } from "react"
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
  onSave: (name: string, description: string) => void
}

export function SaveAnalysisDialog({
  open,
  onOpenChange,
  onSave,
}: SaveAnalysisDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    onSave(trimmed, description.trim())
    setName("")
    setDescription("")
  }

  function handleOpenChange(nextOpen: boolean) {
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
          <DialogTitle>Salvar análise</DialogTitle>
          <DialogDescription>
            Dê um nome para esta análise para encontrá-la facilmente depois.
          </DialogDescription>
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
                  handleSave()
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
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
