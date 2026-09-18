"use client"

import dynamic from "next/dynamic"
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
    <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-slate-200 bg-white">
      <Loader2 size={20} className="animate-spin text-slate-400" />
    </div>
  ),
})

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute: () => void
  loading: boolean
  disabled?: boolean
  datasets?: Array<{ table_name: string }>
  columns?: Array<{ column_name: string }>
}

const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT",
  "JOIN", "LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "ON",
  "AS", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN",
  "SUM", "AVG", "COUNT", "MIN", "MAX", "DISTINCT",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "NULL", "IS", "ASC", "DESC", "TRUE", "FALSE",
  "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "TABLE",
  "INTO", "VALUES", "SET", "EXISTS", "TOP",
]

const FROM_KEYWORDS = ["FROM", "JOIN", "LEFT JOIN", "INNER JOIN", "RIGHT JOIN", "INTO"]

interface CompletionRange {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

type Monaco = Parameters<OnMount>[1]

function buildKeywordSuggestions(monaco: Monaco, range: CompletionRange) {
  return SQL_KEYWORDS.map((kw) => ({
    label: kw,
    kind: monaco.languages.CompletionItemKind.Keyword,
    insertText: kw,
    detail: "Palavra-chave SQL",
    range,
  }))
}

function buildDatasetSuggestions(
  datasets: Array<{ table_name: string }>,
  monaco: Monaco,
  range: CompletionRange,
) {
  return datasets.map((ds) => ({
    label: ds.table_name,
    kind: monaco.languages.CompletionItemKind.Module,
    insertText: ds.table_name,
    detail: "Dataset",
    range,
  }))
}

function buildColumnSuggestions(
  columns: Array<{ column_name: string }>,
  monaco: Monaco,
  range: CompletionRange,
) {
  return columns.map((col) => ({
    label: col.column_name,
    kind: monaco.languages.CompletionItemKind.Field,
    insertText: col.column_name,
    detail: "Coluna",
    range,
  }))
}

export function SqlEditor({
  value,
  onChange,
  onExecute,
  loading,
  disabled,
  datasets = [],
  columns = [],
}: SqlEditorProps) {
  const datasetsRef = datasets
  const columnsRef = columns

  const handleMount: OnMount = (editor, monaco) => {
    editor.addAction({
      id: "execute-query",
      label: "Executar consulta",
      keybindings: [2048 | 49],
      run: () => {
        if (!loading && !disabled) {
          onExecute()
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

        let suggestions

        if (isAfterFromKeyword) {
          suggestions = buildDatasetSuggestions(datasetsRef, monaco, range)
        } else {
          const keywords = buildKeywordSuggestions(monaco, range)
          const cols = buildColumnSuggestions(columnsRef, monaco, range)
          suggestions = [...keywords, ...cols]
        }

        return { suggestions }
      },
    })
  }

  function handleChange(val: string | undefined) {
    if (val !== undefined) {
      onChange(val)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 shadow-sm">
        {!value && (
          <div className="pointer-events-none absolute top-3 left-3 z-10 font-mono text-sm text-slate-400">
            -- Exemplo: SELECT * FROM demo_atendimentos LIMIT 100;
          </div>
        )}
        <MonacoEditor
          height="400px"
          language="sql"
          theme="vs"
          value={value}
          onChange={handleChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            automaticLayout: true,
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            readOnly: disabled,
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Ctrl+Enter para executar
        </span>

        <Button
          onClick={onExecute}
          disabled={loading || disabled}
          className="bg-teal-600 text-white hover:bg-teal-700"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play size={16} />
              Executar consulta
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
