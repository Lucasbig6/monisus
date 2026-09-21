import { getAccessToken, clearTokens } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

function handleUnauthorized(status: number): void {
  if (status === 401 && typeof window !== "undefined") {
    clearTokens()
    window.location.href = "/login"
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  })

  const data = await response.json()

  if (!response.ok) {
    handleUnauthorized(response.status)
    const detail = typeof data?.detail === "string" ? data.detail : "Erro desconhecido"
    throw new ApiError(response.status, detail)
  }

  return data as T
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    handleUnauthorized(response.status)
    const detail = typeof data?.detail === "string" ? data.detail : "Erro desconhecido"
    throw new ApiError(response.status, detail)
  }

  return data as T
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    handleUnauthorized(response.status)
    const detail = typeof data?.detail === "string" ? data.detail : "Erro desconhecido"
    throw new ApiError(response.status, detail)
  }

  return data as T
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    handleUnauthorized(response.status)
    const detail = typeof data?.detail === "string" ? data.detail : "Erro desconhecido"
    throw new ApiError(response.status, detail)
  }
}
