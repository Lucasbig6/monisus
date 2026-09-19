"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Menu, User, Settings, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearTokens } from "@/lib/auth"

const user = {
  name: "Lucas Admin",
  initials: "LA",
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    clearTokens()
    router.push("/login")
  }

  return (
    <header className="flex h-14 items-center justify-end border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-sm font-semibold text-white shadow-sm">
            {user.initials}
          </div>

          <span className="hidden text-sm font-medium text-slate-900 md:block">
            {user.name}
          </span>

          <ChevronDown
            size={14}
            className={`hidden text-slate-400 transition-transform duration-200 md:block ${open ? "rotate-180" : ""}`}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-48">
          <DropdownMenuItem className="cursor-pointer gap-2.5">
            <User size={16} className="text-muted-foreground" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer gap-2.5">
            <Settings size={16} className="text-muted-foreground" />
            <span>Configurações</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer gap-2.5 text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
