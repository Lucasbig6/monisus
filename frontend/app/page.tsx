import Link from "next/link"
import {
  Activity,
  BarChart3,
  FileChartColumn,
  Search,
} from "lucide-react"

const quickActions = [
  {
    title: "Dashboards",
    description: "Visualize painéis e acompanhamentos disponíveis.",
    href: "/dashboards",
    icon: BarChart3,
  },
  {
    title: "Explorar dados",
    description: "Explore dados, dimensões, medidas e cruzamentos.",
    href: "/explorar",
    icon: Search,
  },
  {
    title: "Indicadores",
    description: "Consulte indicadores e métricas do SUS.",
    href: "/indicadores",
    icon: Activity,
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
    <div className="mx-auto max-w-7xl px-2 py-8">
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-slate-400" />

            <div>
              <h2 className="text-sm font-medium text-slate-900">
                O que você deseja analisar?
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Pesquise dashboards, dados e indicadores.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
              Pesquisar dashboards, dados, indicadores...
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      {/* Comece por aqui */}
      <section className="mt-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Activity size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Comece por aqui
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Escolha um dashboard ou explore um conjunto de dados,
                encontre informações relevantes e construa sua análise.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  01 · Escolha os dados
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  02 · Explore
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  03 · Analise
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}