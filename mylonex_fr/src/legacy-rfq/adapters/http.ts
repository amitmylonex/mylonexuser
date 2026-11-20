import { getAccessToken } from '../../shared/session/auth'

export async function builderFetch(path: string, init?: RequestInit) {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')
  const headers = new Headers(init?.headers)
  headers.set('Authorization', 'Bearer ' + await getAccessToken())
  const response = await fetch(base + path.replace(/^\/api\//, '/api/v1/'), { ...init, headers, credentials: 'omit' })
  if (response.ok) return response
  const json = await response.json().catch(() => ({}))
  return new Response(JSON.stringify({ ...json, error: json.error ?? { message: json.message ?? 'Request failed. Please try again.' } }),
    { status: response.status, headers: { 'Content-Type': 'application/json' } })
}
