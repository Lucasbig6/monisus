"use client"

import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QueryTab {
  id: string
  label: string
}

interface QueryTabsProps {
  queries: QueryTab[]
  activeId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onClose: (id: string) => void
}

export function QueryTabs({
  queries,
  activeId,
  onSelect,
  onAdd,
  onClose,
}: QueryTabsProps) {
  return (
    <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2">
      {queries.map((q) => (
        <div
          key={q.id}
          className={cn(
            "group flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors cursor-pointer",
            q.id === activeId
              ? "border-teal-500 bg-white text-teal-700 font-medium"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          )}
          onClick={() => onSelect(q.id)}
        >
          <span className="max-w-[120px] truncate">{q.label}</span>
          {queries.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose(q.id)
              }}
              className="ml-0.5 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 cursor-pointer"
              aria-label={`Fechar ${q.label}`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="ml-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
        aria-label="Nova consulta"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
