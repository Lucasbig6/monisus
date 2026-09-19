import type { Analysis } from "@/lib/types/analysis"

const STORAGE_KEY = "monisus_analyses"

function safeGetItem(): Analysis[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed as Analysis[]
  } catch {
    return []
  }
}

function safeSetItem(analyses: Analysis[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses))
  } catch {
    // silently ignore storage errors
  }
}

export function getAnalyses(): Analysis[] {
  return safeGetItem()
}

export function getAnalysis(id: string): Analysis | null {
  const analyses = safeGetItem()
  return analyses.find((a) => a.id === id) ?? null
}

export function saveAnalysis(
  data: Omit<Analysis, "id" | "createdAt" | "updatedAt">
): Analysis {
  const analyses = safeGetItem()
  const now = new Date().toISOString()

  const analysis: Analysis = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  analyses.push(analysis)
  safeSetItem(analyses)

  return analysis
}

export function updateAnalysis(analysis: Analysis): Analysis {
  const analyses = safeGetItem()
  const updated = { ...analysis, updatedAt: new Date().toISOString() }

  const index = analyses.findIndex((a) => a.id === analysis.id)
  if (index !== -1) {
    analyses[index] = updated
  } else {
    analyses.push(updated)
  }

  safeSetItem(analyses)
  return updated
}

export function deleteAnalysis(id: string): void {
  const analyses = safeGetItem()
  safeSetItem(analyses.filter((a) => a.id !== id))
}
