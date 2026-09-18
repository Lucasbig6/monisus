import { ReactNode } from "react"
import { AppShell } from "@/components/layout/app-shell"

export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <AppShell>{children}</AppShell>
}
