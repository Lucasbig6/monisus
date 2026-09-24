export interface MonacoModel {
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

export interface MonacoPosition {
  lineNumber: number
  column: number
}

export interface CompletionRange {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export type Monaco = Parameters<
  import("@monaco-editor/react").OnMount
>[1]
