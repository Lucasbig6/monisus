"use client"

import { Code2, Bot, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ExplorationMode = "sql" | "ai" | "builder"

interface TabItem {
  id: ExplorationMode
  label: string
  icon: typeof Code2
}

const TABS: TabItem[] = [
  { id: "builder", label: "Construtor", icon: BarChart3 },
  { id: "ai", label: "Agente de IA", icon: Bot },
  { id: "sql", label: "Consulta SQL", icon: Code2 },
]

interface ExplorationTabsProps {
  mode: ExplorationMode
  onModeChange: (mode: ExplorationMode) => void
}

export function ExplorationTabs({ mode, onModeChange }: ExplorationTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = mode === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onModeChange(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
