"use client"

import type React from "react"
import { GripVertical, Hash, Type } from "lucide-react"
import { cn } from "@/lib/utils"

export type DraggableFieldKind = "dimension" | "metric"

interface DraggableFieldProps {
  name: string
  kind: DraggableFieldKind
  isUsed?: boolean
  disabled?: boolean
  onDragStart?: (e: React.DragEvent, name: string) => void
  onClick?: (name: string) => void
}

export function DraggableField({
  name,
  kind,
  isUsed = false,
  disabled = false,
  onDragStart,
  onClick,
}: DraggableFieldProps) {
  const Icon = kind === "metric" ? Hash : Type
  const interactive = !isUsed && !disabled

  return (
    <div
      draggable={interactive}
      onDragStart={
        onDragStart ? (e) => onDragStart(e, name) : undefined
      }
      onClick={onClick ? () => onClick(name) : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        isUsed
          ? "border-slate-100 bg-slate-50 opacity-50 cursor-default"
          : "border-slate-200 bg-white cursor-grab active:cursor-grabbing hover:border-slate-300 hover:bg-slate-50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <GripVertical
        size={14}
        className={cn("shrink-0", isUsed ? "text-slate-300" : "text-slate-400")}
      />
      <Icon
        size={14}
        className={cn(
          "shrink-0",
          kind === "metric" ? "text-blue-500" : "text-slate-500"
        )}
      />
      <span className="truncate text-slate-700">{name}</span>
    </div>
  )
}
