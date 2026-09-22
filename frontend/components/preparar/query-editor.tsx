"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef } from "react"
import { Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OnMount } from "@monaco-editor/react"

interface MonacoModel {
  getValueInRange(range: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }): string
  getWordUntilPosition(position: {
    lineNumber: number
    column: number
  }): { startColumn: number; endColumn: number }
}

interface MonacoPosition {
  lineNumber: number
  column: number
}

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[250px] w-full items-center justify-center rounded-lg border border-slate-200 bg-white">
      <Loader2 size={20} className="animate-spin text-slate-400" />
    </div>
  ),
})

interface TableRef {
  schema: string
  name: string
}

interface QueryEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  loading: boolean
  tables?: TableRef[]
  columns?: string[]
}

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT",
  "JOIN", "LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "ON",
  "AS", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN",
  "SUM", "AVG", "COUNT", "MIN", "MAX", "DISTINCT",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "NULL", "IS", "ASC", "DESC", "TRUE", "FALSE",
  "WITH",
]

const FROM_KEYWORDS = ["FROM", "JOIN", "LEFT JOIN", "INNER JOIN", "RIGHT JOIN"]

interface CompletionRange {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

type Monaco = Parameters<OnMount>[1]

export function QueryEditor({
  value,
  onChange,
  onExecute,
  loading,
  tables = [],
  columns = [],
}: QueryEditorProps) {
  const tablesRef = useRef(tables)
  const columnsRef = useRef(columns)
  const onExecuteRef = useRef(onExecute)
  const loadingRef = useRef(loading)

  useEffect(() => {
    tablesRef.current = tables
    columnsRef.current = columns
    onExecuteRef.current = onExecute
    loadingRef.current = loading
  })

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editor.addAction({
      id: "execute-query",
      label: "Executar consulta",
      keybindings: [2048 | 49],
      run: () => {
        if (!loadingRef.current) {
          onExecuteRef.current()
        }
      },
    })

    monaco.languages.registerCompletionItemProvider("sql", {
      triggerCharacters: [" ", ".", "("],
      provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        })

        const words = textUntilPosition.trim().split(/\s+/)
        const lastWord = words[words.length - 1]?.toUpperCase() ?? ""
        const secondLastWord = words[words.length - 2]?.toUpperCase() ?? ""

        const isAfterFromKeyword =
          FROM_KEYWORDS.includes(lastWord) ||
          (lastWord === "" && FROM_KEYWORDS.includes(secondLastWord))

        const word = model.getWordUntilPosition(position)
        const range: CompletionRange = {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: word.endColumn,
        }

        if (isAfterFromKeyword) {
          const suggestions = tablesRef.current.map((t) => ({
            label: `${t.schema}.${t.name}`,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: `${t.schema}.${t.name}`,
            detail: `Tabela (${t.schema})`,
            range,
          }))
          return { suggestions }
        }

        const keywords = SQL_KEYWORDS.map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          detail: "Palavra-chave SQL",
          range,
        }))

        const cols = columnsRef.current.map((col) => ({
          label: col,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: col,
          detail: "Coluna",
          range,
        }))

        return { suggestions: [...keywords, ...cols] }
      },
    })
  }, [])

  function handleChange(val: string | undefined) {
    if (val !== undefined) onChange(val)
  }

  return (
    <div className="flex flex-col">
      <div className="relative overflow-hidden rounded-lg border border-slate-200">
        <MonacoEditor
          height="250px"
          language="sql"
          theme="vs"
          value={value}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            automaticLayout: true,
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
        />
      </div>

      <div className="flex items-center justify-between px-1 py-2">
        <span className="text-xs text-slate-400">Ctrl+Enter para executar</span>
        <Button
          onClick={onExecute}
          disabled={loading}
          size="sm"
          className="bg-teal-600 text-white hover:bg-teal-700"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          Executar
        </Button>
      </div>
    </div>
  )
}
