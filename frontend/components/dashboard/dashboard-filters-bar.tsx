"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DashboardFilter } from "@/lib/types/dashboard"

const filterTypeLabel: Record<DashboardFilter["type"], string> = {
  select: "Select",
  "multi-select": "Multi-select",
  "date-range": "Período",
}

interface DashboardFiltersBarProps {
  filters: DashboardFilter[]
  editing: boolean
  onAdd: () => void
  onRemove: (filterId: string) => void
}

export function DashboardFiltersBar({
  filters,
  editing,
  onAdd,
  onRemove,
}: DashboardFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <span
          key={filter.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
        >
          <span className="text-slate-500">{filterTypeLabel[filter.type]}:</span>
          {filter.column}
          {editing && (
            <button
              type="button"
              onClick={() => onRemove(filter.id)}
              className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 cursor-pointer"
            >
              <X size={11} />
            </button>
          )}
        </span>
      ))}

      {editing && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-7 rounded-full text-xs"
        >
          <Plus size={12} />
          Adicionar filtro
        </Button>
      )}
    </div>
  )
}
