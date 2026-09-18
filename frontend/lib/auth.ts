import { apiPost, ApiError } from "./api"

export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/api/auth/login", { username, password })
}

export { ApiError }
