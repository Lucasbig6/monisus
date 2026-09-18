import { Activity } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm">
        {/* Card de login */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Logo e título */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
              <Activity size={28} strokeWidth={2.5} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">MoniSUS</h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitoramento e análise de dados do SUS
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
