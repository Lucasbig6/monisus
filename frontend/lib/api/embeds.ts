import { apiPost } from "@/lib/api"

export interface GuestTokenResponse {
  token: string
}

export interface EmbedSetupResponse {
  dashboard_id: number
  uuid: string | null
  guest_token: string
}

export async function fetchGuestToken(dashboardId: number): Promise<string> {
  const res = await apiPost<GuestTokenResponse>("/api/embeds/guest-token", {
    dashboard_id: dashboardId,
  })
  return res.token
}

export async function setupEmbedding(dashboardId: number): Promise<EmbedSetupResponse> {
  return apiPost<EmbedSetupResponse>(`/api/embeds/${dashboardId}/setup`, {})
}
