"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { isAuthenticated } from "@/lib/auth"
import { getAnalyses } from "@/lib/api/analyses"
import type { Analysis } from "@/lib/types/analysis"
import type { Dashboard } from "@/lib/types/dashboard"
import {
  buildDashboardAnalysisContext,
  emptyDashboardAnalysisContext,
  type DashboardAnalysisContext,
} from "@/lib/dashboard-analysis-context"

interface CopilotMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface DashboardCopilotProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboard: Dashboard
  /**
   * Contrato futuro do agente — não implementado nesta etapa.
   * Quando conectado, receberá a mensagem + contexto estrutural do dashboard.
   */
  onSendMessage?: (message: string, context: DashboardAnalysisContext) => void
}

const SUGGESTIONS = [
  "O que chama atenção neste painel?",
  "Qual é o principal indicador?",
  "Compare os principais resultados.",
  "Existe alguma tendência nos dados?",
] as const

const ASSISTANT_PREAMBLE =
  "Posso ajudar a analisar os dados apresentados neste painel."

const MOCK_REPLY =
  "Quando a análise inteligente estiver habilitada, esta pergunta será respondida utilizando os dados e indicadores deste painel."

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function DashboardCopilot({
  open,
  onOpenChange,
  dashboard,
  onSendMessage,
}: DashboardCopilotProps) {
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [analyses, setAnalyses] = useState<Analysis[] | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Só consulta a API quando o painel está aberto e há sessão: o painel
  // público (/painel/[slug]) nunca dispara request de análises.
  useEffect(() => {
    if (!open || !isAuthenticated()) return
    let cancelled = false

    getAnalyses()
      .then((list) => {
        if (!cancelled) setAnalyses(list)
      })
      .catch(() => {
        // contexto é auxiliar: mantém "não carregado" (contexto vazio)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  const context = useMemo(
    () =>
      analyses === null
        ? emptyDashboardAnalysisContext(dashboard)
        : buildDashboardAnalysisContext(dashboard, analyses),
    [dashboard, analyses]
  )

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [open, messages])

  function handleSubmit(raw: string) {
    const message = raw.trim()
    if (!message) return

    const userMsg: CopilotMessage = {
      id: createId(),
      role: "user",
      content: message,
    }
    const assistantMsg: CopilotMessage = {
      id: createId(),
      role: "assistant",
      content: MOCK_REPLY,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setDraft("")

    // Contrato futuro — sem framework de agente nesta etapa.
    onSendMessage?.(message, context)
  }

  function handleSuggestion(suggestion: string) {
    handleSubmit(suggestion)
  }

  return (
    <>
      {/* Backdrop only on small screens so desktop can keep reading the grid */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="dashboard-copilot-panel"
        data-slot="dashboard-copilot"
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-in-out sm:w-[min(100%,24rem)] lg:w-[22rem] xl:w-[24rem]",
          open ? "translate-x-0" : "translate-x-full",
          "pointer-events-none",
          open && "pointer-events-auto"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
              <Sparkles size={15} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                Copiloto de Análise
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {dashboard.name}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar copiloto"
            className="shrink-0 text-slate-500 hover:text-slate-800"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Conversation */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-3.5 py-3">
                <p className="text-sm leading-relaxed text-slate-700">
                  {ASSISTANT_PREAMBLE}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sugestões
                </p>
                <ul className="space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => handleSuggestion(suggestion)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-800"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                A análise inteligente ainda não está conectada. As mensagens
                ficam apenas neste navegador, sem respostas geradas por IA.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-teal-700">
                        <Sparkles size={11} />
                        Copiloto
                      </span>
                    )}
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              <p className="pt-1 text-center text-[11px] text-slate-400">
                Agente de IA ainda não conectado · histórico local
              </p>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          className="border-t border-slate-200 px-3 py-3"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(draft)
          }}
        >
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Digite sua pergunta sobre o painel..."
              aria-label="Mensagem para o copiloto"
              className="h-9 bg-slate-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim()}
              className="shrink-0 bg-teal-600 text-white hover:bg-teal-700"
              aria-label="Enviar mensagem"
            >
              <Send size={15} />
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Contexto do painel pronto para o agente futuramente (
            {context.widgets.length} widget
            {context.widgets.length !== 1 ? "s" : ""}).
          </p>
        </form>
      </aside>
    </>
  )
}
