import Link from "next/link"
import {
  Activity,
  BarChart3,
  Database,
  FileChartColumn,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"

const quickActions = [
  {
    title: "Painéis",
    description: "Visualize painéis e acompanhamentos disponíveis.",
    href: "/paineis",
    icon: BarChart3,
  },
  {
    title: "Explorar dados",
    description: "Explore dados, dimensões, medidas e cruzamentos.",
    href: "/explorar",
    icon: Search,
  },
  {
    title: "Fontes de Dados",
    description: "Gerencie conexões de dados e fontes disponíveis.",
    href: "/fontes",
    icon: Database,
  },
  {
    title: "Análises",
    description: "Crie e consulte análises personalizadas.",
    href: "/analises",
    icon: FileChartColumn,
  },
]

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Introdução */}
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Início
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Acompanhe, explore e analise os dados do SUS.
        </p>
      </section>

      {/* Busca */}
      <section className="mt-8">
        <div className="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Search className="h-5 w-5 text-white" />
            </div>

            <div className="w-full sm:flex-1">
              <h2 className="text-[18px] font-medium text-white font-semibold">
                O que você deseja analisar?
              </h2>

              <p className="mt-0.5 text-xs text-teal-100">
                Pesquise dashboards, dados e indicadores.
              </p>
            </div>
          </div>

          <div className="mt-4 w-full">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar dashboards, dados, indicadores..."
                className="h-11 rounded-lg border-slate-200 bg-white pl-10 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Acesso rápido */}
      <section className="mt-8">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Acesso rápido
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Acesse rapidamente as principais áreas do MoniSUS.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link key={action.href} href={action.href}>
                <div className="group h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
