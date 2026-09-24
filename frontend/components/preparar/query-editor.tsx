"use client"

import { SqlEditor as SharedSqlEditor } from "@/components/sql/sql-editor"

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

export function QueryEditor({
  tables = [],
  ...rest
}: QueryEditorProps) {
  return (
    <SharedSqlEditor
      {...rest}
      tables={tables.map((t) => ({
        name: `${t.schema}.${t.name}`,
        detail: `Tabela (${t.schema})`,
      }))}
      height="250px"
    />
  )
}
