import { apiPost, ApiError } from "./api"

const ACCESS_TOKEN_KEY = "monisus_access_token"
const REFRESH_TOKEN_KEY = "monisus_refresh_token"

export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/api/auth/login", { username, password })
}

export function saveTokens(data: LoginResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const now = Math.floor(Date.now() / 1000)
    return payload.exp ? payload.exp > now : true
  } catch {
    return false
  }
}

export { ApiError }
