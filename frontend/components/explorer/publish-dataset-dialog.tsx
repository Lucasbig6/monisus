"use client"

import { PublishDatasetDialog as BasePublishDialog } from "@/components/datasets/publish-dataset-dialog"
import { publishDataset } from "@/lib/api/datasets"

interface PublishDatasetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sql: string
  databaseId: number
  dbSchema: string | null
  onSuccess: (datasetId: number) => void
}

export function PublishDatasetDialog({
  open,
  onOpenChange,
  sql,
  databaseId,
  dbSchema,
  onSuccess,
}: PublishDatasetDialogProps) {
  return (
    <BasePublishDialog
      open={open}
      onOpenChange={onOpenChange}
      onPublish={async (name: string, description: string) => {
        const result = await publishDataset({
          database_id: databaseId,
          sql,
          db_schema: dbSchema,
          name,
          description: description || null,
        })
        onSuccess(result.id)
      }}
    />
  )
}
