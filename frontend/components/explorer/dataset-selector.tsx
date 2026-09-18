"use client"

import { DatasetListItem } from "@/lib/api/datasets"
import { Loader2 } from "lucide-react"

interface DatasetSelectorProps {
  datasets: DatasetListItem[]
  value: number | null
  onChange: (dataset: DatasetListItem) => void
  loading: boolean
  disabled?: boolean
}

export function DatasetSelector({
  datasets,
  value,
  onChange,
  loading,
  disabled,
}: DatasetSelectorProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value)
    const dataset = datasets.find((d) => d.id === id)
    if (dataset) {
      onChange(dataset)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" />
        Carregando datasets...
      </div>
    )
  }

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors hover:border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled>
        Selecione um dataset...
      </option>
      {datasets.map((dataset) => (
        <option key={dataset.id} value={dataset.id}>
          {dataset.table_name}
        </option>
      ))}
    </select>
  )
}
