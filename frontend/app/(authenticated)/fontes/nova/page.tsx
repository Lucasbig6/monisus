"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSource, testConnection } from "@/lib/api/sources"
import { ApiError } from "@/lib/api"

export default function NovaFontePage() {
  const router = useRouter()

  const [databaseName, setDatabaseName] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("5432")
  const [database, setDatabase] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canTest = host.trim() && port && database.trim() && username.trim() && password.trim()
  const canSave = canTest && databaseName.trim()

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    setError(null)

    try {
      const result = await testConnection({
        host: host.trim(),
        port: parseInt(port, 10) || 5432,
        database: database.trim(),
        username: username.trim(),
        password,
      })
      setTestResult(result)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.detail
          : "Não foi possível testar a conexão."
      setTestResult({ success: false, message: msg })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      await createSource({
        database_name: databaseName.trim(),
        engine: "postgresql",
        host: host.trim(),
        port: parseInt(port, 10) || 5432,
        database: database.trim(),
        username: username.trim(),
        password,
      })
      router.push("/fontes")
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.detail
          : "Erro ao salvar a fonte de dados."
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <section>
        <Link
          href="/fontes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          <Database size={14} />
          Fontes de Dados
        </Link>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
          Adicionar fonte
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure uma nova conexão de dados PostgreSQL.
        </p>
      </section>

      {/* Form */}
      <section className="mt-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                PostgreSQL
              </h2>
              <p className="text-xs text-slate-500">
                Conexão com banco de dados PostgreSQL.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="database-name">Nome da fonte *</Label>
              <Input
                id="database-name"
                placeholder="Ex: SESAPI Produção"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="host">Host *</Label>
              <Input
                id="host"
                placeholder="Ex: db.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Porta *</Label>
              <Input
                id="port"
                type="number"
                placeholder="5432"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="database">Banco de dados *</Label>
              <Input
                id="database"
                placeholder="Ex: sesapi_prod"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuário *</Label>
              <Input
                id="username"
                placeholder="Ex: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha do banco de dados"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                testResult.success
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {testResult.message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!canTest || testing}
            >
              {testing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Testar conexão
            </Button>

            <Button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Salvar
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
