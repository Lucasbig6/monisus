"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Activity,
  BarChart3,
  Database,
  FileChartColumn,
  FlaskConical,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react"

const navigation = [
  {
    name: "Início",
    href: "/inicio",
    icon: Home,
  },
  {
    name: "Painéis",
    href: "/paineis",
    icon: BarChart3,
  },
  {
    name: "Explorar",
    href: "/explorar",
    icon: Search,
  },
  {
    name: "Fontes",
    href: "/fontes",
    icon: Database,
  },
  {
    name: "Análises",
    href: "/analises",
    icon: FileChartColumn,
  },
  {
    name: "Superset POC",
    href: "/superset-poc",
    icon: FlaskConical,
  },
]

function getSnapshot() {
  return localStorage.getItem("sidebar-collapsed") === "true"
}

function getServerSnapshot() {
  return false
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleCollapsed = () => {
    const newValue = !collapsed
    localStorage.setItem("sidebar-collapsed", String(newValue))
    window.dispatchEvent(new Event("storage"))
  }

  const sidebarClasses = cn(
    "flex flex-col bg-white/70 backdrop-blur-xl text-slate-700 border-r border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300",
    collapsed ? "w-16" : "w-80",
    isOpen
      ? "fixed inset-y-0 left-0 z-50 transform transition-transform lg:static lg:z-auto"
      : "lg:static"
  )

  return (
    <aside className={sidebarClasses}>
      {/* Logo */}
      <div className="flex h-15 items-center border-b border-slate-200/50 px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
            <Activity size={18} strokeWidth={2.5} />
          </div>

          {!collapsed && (
            <span className="text-base font-semibold text-slate-900 whitespace-nowrap">
              MoniSUS
            </span>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navigation.map((item) => {
          const Icon = item.icon

          const isActive =
            item.href === "/inicio"
              ? pathname === "/inicio" || pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-all duration-200",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1"
              )}
              onClick={onClose}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-teal-500" />
              )}
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Toggle */}
      <div className="border-t border-slate-200/50 p-3 lg:hidden">
        <button
          onClick={onClose}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-900 cursor-pointer"
        >
          <X size={18} className="shrink-0" />
          <span className="whitespace-nowrap">Fechar</span>
        </button>
      </div>

      <div className="border-t border-slate-200/50 p-3 hidden lg:block">
        <button
          onClick={toggleCollapsed}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1 cursor-pointer",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} className="shrink-0" />
          ) : (
            <>
              <PanelLeftClose size={18} className="shrink-0" />
              <span className="whitespace-nowrap">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
