"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import HomePage from "@/app/(authenticated)/dashboards/page";

export default function Page() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      // Usuário autenticado: HomePage será renderizada dentro do AuthGuard/AppShell
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <HomePage />;
}