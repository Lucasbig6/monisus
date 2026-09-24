"use client"

import { useState } from "react"
import { Bot, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AiAgentTabProps {
  disabled?: boolean
}

export function AiAgentTab({ disabled = false }: AiAgentTabProps) {
  const [prompt, setPrompt] = useState("")

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
            <Bot size={20} />
          </div>
          <div>
            <CardTitle className="text-base">Agente IA</CardTitle>
            <p className="text-sm text-slate-500">
              Analise o mesmo dataset em linguagem natural — uma alternativa ao
              SQL e ao modo Visual.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Mostre o total de atendimentos por município, do maior para o menor"
            disabled={disabled}
            rows={3}
            aria-label="Pergunta para o agente de IA"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 resize-none"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            <Sparkles size={12} className="inline mr-1" />
            Em breve — a integração com IA será disponibilizada.
          </p>

          <Button
            type="button"
            disabled={disabled || true}
            className="shrink-0 bg-purple-600 text-white hover:bg-purple-700 opacity-50 cursor-not-allowed"
          >
            <Bot size={16} />
            Analisar
          </Button>
        </div>

        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="text-center text-sm text-slate-500">
            Em breve: o agente transformará sua pergunta em consulta e
            visualização sobre o dataset selecionado — sem sair do Explorar.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
