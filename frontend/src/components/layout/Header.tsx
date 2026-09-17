"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 shrink-0">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-monisus-100 text-monisus-700 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {user?.first_name || user?.username || "Usuário"}
          </span>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">{user?.username}</p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
