"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { embedDashboard } from "@superset-ui/embedded-sdk"
import { apiGet, apiPost, apiPut, ApiError } from "@/lib/api"
import { setupEmbedding } from "@/lib/api/embeds"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Play,
  RefreshCw,
  Settings,
  TestTube,
} from "lucide-react"

const SUPERSET_URL = process.env.NEXT_PUBLIC_SUPERSET_URL ?? "http://localhost:8088"
const DEMO_DASHBOARD_ID = 3
const DEMO_DATASET_ID = 3

interface LogEntry {
  time: string
  type: "ok" | "error" | "info"
  message: string
}

interface DashboardInfo {
  id: number
  title: string
  slug: string
  published: boolean
}

function timestamp(): string {
  return new Date().toLocaleTimeString("pt-BR")
}

function addLog(
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  type: LogEntry["type"],
  message: string,
) {
  setLogs((prev) => [...prev, { time: timestamp(), type, message }])
}

export default function SupersetPocPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [dashboards, setDashboards] = useState<DashboardInfo[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<number>(DEMO_DASHBOARD_ID)
  const [embedReady, setEmbedReady] = useState(false)
  const [embedInstanceId, setEmbedInstanceId] = useState(0)
  const [embedConfig, setEmbedConfig] = useState<{
    uuid: string | null
    guestTokenGenerated: boolean
    dashboardId: number
  } | null>(null)

  const [hideTitle, setHideTitle] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(true)
  const [hideChartControls, setHideChartControls] = useState(false)
  const [themeMode, setThemeMode] = useState<"default" | "dark" | "system">("default")

  const [chartName, setChartName] = useState("POC - Atendimentos")
  const [chartVizType, setChartVizType] = useState("echarts_bar")
  const [chartDimension, setChartDimension] = useState("municipio")
  const [chartMetric, setChartMetric] = useState("SUM(quantidade_atendimentos)")
  const [chartResult, setChartResult] = useState<string | null>(null)

  const [archTestResult, setArchTestResult] = useState<string | null>(null)

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    dashboard_appears: false,
    charts_render: false,
    tooltips_work: false,
    filters_work: false,
    crossfilter_works: false,
    resize_works: false,
    responsive_works: false,
    hide_title_works: false,
    hide_controls_works: false,
    chrome_hidden: false,
    visual_adequate: false,
  })

  const mountRef = useRef<HTMLDivElement>(null)
  const embedRef = useRef<Awaited<ReturnType<typeof embedDashboard>> | null>(null)
  const loadedRef = useRef(false)

  const log = useCallback(
    (type: LogEntry["type"], message: string) => addLog(setLogs, type, message),
    [],
  )

  const fetchDashboards = useCallback(async () => {
    try {
      const data = await apiGet<{
        count: number
        result: Array<{ id: number; dashboard_title: string; slug: string; published: boolean }>
      }>("/api/dashboards?page_size=50")
      const list = (data.result ?? []).map((d) => ({
        id: d.id,
        title: d.dashboard_title,
        slug: d.slug ?? "",
        published: d.published,
      }))
      setDashboards(list)
      log("ok", `${list.length} dashboard(s) encontrado(s)`)
    } catch {
      log("error", "Erro ao listar dashboards")
    }
  }, [log])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    log("info", "POC Superset Embedding iniciada")
    log("info", `Superset: ${SUPERSET_URL}`)
    fetchDashboards()
  }, [fetchDashboards, log])

  const handleSetupEmbedding = useCallback(async () => {
    log("info", `Configurando embedding para dashboard ${selectedDashboard}...`)
    try {
      const result = await setupEmbedding(selectedDashboard)
      setEmbedConfig({
        uuid: result.uuid,
        guestTokenGenerated: true,
        dashboardId: result.dashboard_id,
      })
      log("ok", `Embedding configurado. UUID: ${result.uuid ?? "N/A"}`)
      log("ok", "Guest token gerado com sucesso")
      log("info", "Expiração: 5 minutos")
      log("info", `Dashboard autorizado: ID ${result.dashboard_id}`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao configurar embedding: ${msg}`)
    }
  }, [selectedDashboard, log])

  const handleLoadEmbed = useCallback(async () => {
    if (!mountRef.current) return

    if (embedRef.current) {
      embedRef.current.unmount()
      embedRef.current = null
    }

    mountRef.current.innerHTML = ""

    log("info", "Carregando dashboard embutido...")

    const embedUuid = embedConfig?.uuid
    if (!embedUuid) {
      log("error", "Configure o embedding primeiro (botão 'Configurar Embedding')")
      return
    }

    try {
      const dashboard = await embedDashboard({
        id: embedUuid,
        supersetDomain: SUPERSET_URL,
        mountPoint: mountRef.current,
        fetchGuestToken: async () => {
          const res = await apiPost<{ token: string }>("/api/embeds/guest-token", {
            dashboard_id: selectedDashboard,
          })
          return res.token
        },
        dashboardUiConfig: {
          hideTitle,
          hideChartControls,
          filters: { expanded: filtersExpanded },
          urlParams: {},
        },
        debug: false,
      })

      embedRef.current = dashboard
      setEmbedReady(true)
      setEmbedInstanceId((i) => i + 1)
      log("ok", "Dashboard carregado no iframe")
    } catch (err) {
      log("error", `Falha ao carregar embed: ${String(err)}`)
    }
  }, [selectedDashboard, hideTitle, filtersExpanded, hideChartControls, embedConfig?.uuid, log])

  const handleReloadEmbed = useCallback(() => {
    setEmbedReady(false)
    handleLoadEmbed()
  }, [handleLoadEmbed])

  const handleCreateChart = useCallback(async () => {
    log("info", `Criando chart "${chartName}" via API...`)
    try {
      const params = {
        groupby: [chartDimension],
        metrics: [{ label: "total", expressionType: "SQL", sqlExpression: chartMetric }],
        row_limit: 25,
        order_desc: true,
      }
      const result = await apiPost<{ id: number }>("/api/charts", {
        slice_name: chartName,
        viz_type: chartVizType,
        datasource_id: DEMO_DATASET_ID,
        datasource_type: "table",
        params: JSON.stringify(params),
        dashboards: [selectedDashboard],
      })
      setChartResult(`Chart criado com ID: ${result.id}`)
      log("ok", `Chart criado com ID: ${result.id}`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao criar chart: ${msg}`)
      setChartResult(`Erro: ${msg}`)
    }
  }, [chartName, chartVizType, chartDimension, chartMetric, selectedDashboard, log])

  const handleUpdateLayout = useCallback(async () => {
    log("info", "Buscando charts do dashboard...")
    try {
      const chartsData = await apiGet<{
        count: number
        result: Array<{ id: number }>
      }>(`/api/charts?page_size=50`)

      const chartIds = (chartsData.result ?? []).map((c) => c.id)
      if (chartIds.length === 0) {
        log("error", "Nenhum chart encontrado. Crie charts primeiro.")
        return
      }

      log("info", `${chartIds.length} chart(s) encontrado(s): [${chartIds.join(", ")}]`)

      const position: Record<string, unknown> = {
        DASHBOARD_VERSION_KEY: "v2",
        ROOT_ID: { type: "ROOT", id: "ROOT_ID", children: ["GRID_ID"] },
        HEADER_ID: {
          type: "HEADER",
          id: "HEADER_ID",
          meta: { text: "MoniSUS — Demonstracao de Saude" },
        },
        GRID_ID: {
          type: "GRID",
          id: "GRID_ID",
          children: ["ROW-1"],
          parents: ["ROOT_ID"],
        },
        "ROW-1": {
          type: "ROW",
          id: "ROW-1",
          children: chartIds.map((_, i) => `CHART-${i}`),
          parents: ["ROOT_ID", "GRID_ID"],
          meta: { background: "BACKGROUND_TRANSPARENT" },
        },
      }

      chartIds.forEach((cid, i) => {
        position[`CHART-${i}`] = {
          type: "CHART",
          id: `CHART-${i}`,
          children: [],
          parents: ["ROOT_ID", "GRID_ID", "ROW-1"],
          meta: {
            width: Math.max(6, Math.floor(12 / chartIds.length)),
            height: 50,
            chartId: cid,
          },
        }
      })

      await apiPut(`/api/dashboards/${selectedDashboard}`, {
        position_json: JSON.stringify(position),
      })

      log("ok", `Layout atualizado com ${chartIds.length} chart(s)`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao atualizar layout: ${msg}`)
    }
  }, [selectedDashboard, log])

  const handleTestNativeFilter = useCallback(async () => {
    log("info", "Testando filtro nativo via json_metadata...")
    try {
      const metadata = {
        native_filter_configuration: [
          {
            id: "poc_filter_municipio",
            type: "filter_select",
            title: "Municipio",
            datasource: `${DEMO_DATASET_ID}__table`,
            targets: [{ column: { column_name: "municipio" } }],
            controlValues: { multiSelect: false, searchAllOptions: false },
          },
        ],
      }
      await apiPut(`/api/dashboards/${selectedDashboard}`, {
        json_metadata: JSON.stringify(metadata),
      })
      log("ok", "Filtro nativo configurado via json_metadata")
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao configurar filtro: ${msg}`)
    }
  }, [selectedDashboard, log])

  const handleTestCreateDashboard = useCallback(async () => {
    log("info", "Teste: criando dashboard via API...")
    try {
      const result = await apiPost<{ id: number }>("/api/dashboards", {
        dashboard_title: "POC Test - Dashboard via API",
        slug: "poc-test-api",
        published: false,
        position_json: "",
        json_metadata: "{}",
      })
      log("ok", `Dashboard de teste criado com ID: ${result.id}`)
      setArchTestResult(`Dashboard criado: ID ${result.id}`)
      fetchDashboards()
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao criar dashboard: ${msg}`)
      setArchTestResult(`Erro: ${msg}`)
    }
  }, [log, fetchDashboards])

  const handleTestCreateChart = useCallback(async () => {
    log("info", "Teste: criando chart via API...")
    try {
      const params = {
        groupby: ["procedimento"],
        metrics: [{ label: "total", expressionType: "SQL", sqlExpression: "SUM(quantidade_atendimentos)" }],
        row_limit: 10,
        order_desc: true,
      }
      const result = await apiPost<{ id: number }>("/api/charts", {
        slice_name: "POC Test - Chart via API",
        viz_type: "pie",
        datasource_id: DEMO_DATASET_ID,
        datasource_type: "table",
        params: JSON.stringify(params),
        dashboards: [selectedDashboard],
      })
      log("ok", `Chart de teste criado com ID: ${result.id}`)
      setArchTestResult(`Chart criado: ID ${result.id}`)
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao criar chart: ${msg}`)
      setArchTestResult(`Erro: ${msg}`)
    }
  }, [selectedDashboard, log])

  const handleTestUpdateLayout = useCallback(async () => {
    log("info", "Teste: atualizando layout via API...")
    try {
      await apiPut(`/api/dashboards/${selectedDashboard}`, {
        position_json: JSON.stringify({
          DASHBOARD_VERSION_KEY: "v2",
          ROOT_ID: { type: "ROOT", id: "ROOT_ID", children: ["GRID_ID"] },
          GRID_ID: { type: "GRID", id: "GRID_ID", children: [], parents: ["ROOT_ID"] },
          HEADER_ID: { type: "HEADER", id: "HEADER_ID", meta: { text: "Teste" } },
        }),
      })
      log("ok", "Layout de teste atualizado")
      setArchTestResult("Layout atualizado com sucesso")
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao atualizar layout: ${msg}`)
      setArchTestResult(`Erro: ${msg}`)
    }
  }, [selectedDashboard, log])

  const handleTestUpdateFilters = useCallback(async () => {
    log("info", "Teste: atualizando filtros via API...")
    try {
      const metadata = {
        native_filter_configuration: [
          {
            id: "poc_test_filter",
            type: "filter_select",
            title: "Filtro Teste",
            datasource: `${DEMO_DATASET_ID}__table`,
            targets: [{ column: { column_name: "procedimento" } }],
            controlValues: { multiSelect: true },
          },
        ],
      }
      await apiPut(`/api/dashboards/${selectedDashboard}`, {
        json_metadata: JSON.stringify(metadata),
      })
      log("ok", "Filtros de teste atualizados")
      setArchTestResult("Filtros atualizados com sucesso")
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "Erro desconhecido"
      log("error", `Falha ao atualizar filtros: ${msg}`)
      setArchTestResult(`Erro: ${msg}`)
    }
  }, [selectedDashboard, log])

  const toggleCheck = useCallback((key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <FlaskConical size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Superset Embedding POC
            </h1>
            <p className="text-sm text-slate-500">
              Validação técnica: Superset como motor de visualização do MoniSUS
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Section icon={<Settings size={16} />} title="1. Status">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={fetchDashboards}>
                  <RefreshCw size={14} />
                  Verificar Dashboards
                </Button>
              </div>
              {dashboards.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
                    Dashboard para teste:
                  </label>
                  <select
                    value={selectedDashboard}
                    onChange={(e) => setSelectedDashboard(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  >
                    {dashboards.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} (ID: {d.id}) {d.published ? "✓" : "(rascunho)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Section>

          <Section icon={<BarChart3 size={16} />} title="2. Criar Chart via API">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">Nome</label>
                  <input
                    type="text"
                    value={chartName}
                    onChange={(e) => setChartName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Tipo</label>
                  <select
                    value={chartVizType}
                    onChange={(e) => setChartVizType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  >
                    <option value="echarts_bar">Bar (echarts_bar)</option>
                    <option value="echarts_line">Line (echarts_line)</option>
                    <option value="pie">Pie</option>
                    <option value="table">Table</option>
                    <option value="echarts_area">Area (echarts_area)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Dimensão</label>
                  <select
                    value={chartDimension}
                    onChange={(e) => setChartDimension(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  >
                    <option value="municipio">municipio</option>
                    <option value="procedimento">procedimento</option>
                    <option value="unidade_saude">unidade_saude</option>
                    <option value="tipo_unidade">tipo_unidade</option>
                    <option value="data_atendimento">data_atendimento</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Métrica (SQL)</label>
                  <input
                    type="text"
                    value={chartMetric}
                    onChange={(e) => setChartMetric(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="default" size="sm" onClick={handleCreateChart}>
                  <Play size={14} />
                  Criar Chart
                </Button>
                <Button variant="outline" size="sm" onClick={handleUpdateLayout}>
                  <Settings size={14} />
                  Atualizar Layout
                </Button>
                <Button variant="outline" size="sm" onClick={handleTestNativeFilter}>
                  <TestTube size={14} />
                  Filtro Nativo
                </Button>
              </div>
              {chartResult && (
                <p className="text-sm text-slate-600">{chartResult}</p>
              )}
            </div>
          </Section>

          <Section icon={<Settings size={16} />} title="3. Configurar Embedding">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSetupEmbedding}
                  disabled={embedConfig?.guestTokenGenerated}
                >
                  {embedConfig?.guestTokenGenerated ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Settings size={14} />
                  )}
                  Configurar Embedding
                </Button>
              </div>
              {embedConfig && (
                <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500" />
                    Guest token: gerado
                  </div>
                  <div className="text-slate-500">Expiração: 5 minutos</div>
                  <div className="text-slate-500">
                    Dashboard autorizado: ID {embedConfig.dashboardId}
                  </div>
                  {embedConfig.uuid && (
                    <div className="text-slate-400 font-mono text-xs">
                      UUID: {embedConfig.uuid}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          <Section icon={<Play size={16} />} title="4. Dashboard Embutido">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLoadEmbed}
                  disabled={!embedConfig?.guestTokenGenerated}
                >
                  <Play size={14} />
                  Carregar Dashboard
                </Button>
                {embedReady && (
                  <Button variant="outline" size="sm" onClick={handleReloadEmbed}>
                    <RefreshCw size={14} />
                    Recarregar
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <CheckboxItem
                  label="hideTitle"
                  checked={hideTitle}
                  onChange={setHideTitle}
                />
                <CheckboxItem
                  label="filters.expanded"
                  checked={filtersExpanded}
                  onChange={setFiltersExpanded}
                />
                <CheckboxItem
                  label="hideChartControls"
                  checked={hideChartControls}
                  onChange={setHideChartControls}
                />
                <div>
                  <label className="text-xs font-medium text-slate-600">themeMode</label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value as "default" | "dark" | "system")}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  >
                    <option value="default">default</option>
                    <option value="dark">dark</option>
                    <option value="system">system</option>
                  </select>
                </div>
              </div>

              <div
                ref={mountRef}
                key={embedInstanceId}
                className="min-h-[500px] rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </Section>

          <Section icon={<TestTube size={16} />} title="5. Teste Arquitetural (API)">
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Testa se o MoniSUS consegue criar/configurar objetos do Superset via API.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleTestCreateDashboard}>
                  Criar Dashboard via API
                </Button>
                <Button variant="outline" size="sm" onClick={handleTestCreateChart}>
                  Criar Chart via API
                </Button>
                <Button variant="outline" size="sm" onClick={handleTestUpdateLayout}>
                  Atualizar Layout via API
                </Button>
                <Button variant="outline" size="sm" onClick={handleTestUpdateFilters}>
                  Configurar Filtros via API
                </Button>
              </div>
              {archTestResult && (
                <div className="rounded-lg bg-slate-50 p-3 text-sm">{archTestResult}</div>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section icon={<TestTube size={16} />} title="6. Checklist de Testes">
            <div className="space-y-2">
              {Object.entries(checklist).map(([key, checked]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCheck(key)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={checked ? "line-through text-slate-400" : ""}>
                    {checklistLabels[key]}
                  </span>
                </label>
              ))}
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-600">
                  Progresso: {Object.values(checklist).filter(Boolean).length}/
                  {Object.keys(checklist).length}
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-300"
                    style={{
                      width: `${(Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section icon={<FlaskConical size={16} />} title="Log de Execução">
            <div className="max-h-96 overflow-y-auto space-y-1">
              {logs.length === 0 && (
                <p className="text-xs text-slate-400">Nenhuma ação realizada ainda.</p>
              )}
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-2 text-xs font-mono">
                  <span className="text-slate-400 shrink-0">{entry.time}</span>
                  <span className="shrink-0">
                    {entry.type === "ok" && <CheckCircle2 size={12} className="text-green-500" />}
                    {entry.type === "error" && <AlertCircle size={12} className="text-red-500" />}
                    {entry.type === "info" && <Loader2 size={12} className="text-slate-400" />}
                  </span>
                  <span
                    className={
                      entry.type === "ok"
                        ? "text-green-700"
                        : entry.type === "error"
                          ? "text-red-600"
                          : "text-slate-600"
                    }
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-teal-600">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="font-mono text-xs">{label}</span>
    </label>
  )
}

const checklistLabels: Record<string, string> = {
  dashboard_appears: "Dashboard aparece no iframe",
  charts_render: "Gráficos renderizam com dados reais",
  tooltips_work: "Tooltips funcionam ao passar mouse",
  filters_work: "Filtros nativos do Superset funcionam",
  crossfilter_works: "Cross-filter funciona",
  resize_works: "Resize do iframe funciona",
  responsive_works: "Layout responsivo funciona",
  hide_title_works: "Título pode ser ocultado (hideTitle)",
  hide_controls_works: "Controles de chart podem ser ocultos",
  chrome_hidden: "Navegação do Superset está oculta",
  visual_adequate: "Comportamento visual é adequado",
}
