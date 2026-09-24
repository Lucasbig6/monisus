"use client"

import { ReactNode } from "react"
import { Header } from "./header"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
