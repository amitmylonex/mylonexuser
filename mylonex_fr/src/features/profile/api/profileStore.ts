import { request } from '../../../shared/api'
import type { BuyerProfile } from '../types/profile.types'

type Snapshot = { data?: BuyerProfile; error?: string; loading: boolean }
let snapshot: Snapshot = { loading: false }
let scope = ''
let loadedAt = 0
let generation = 0
let pending: Promise<BuyerProfile> | undefined
const listeners = new Set<() => void>()
function publish(next: Snapshot) { snapshot = next; for (const listener of listeners) listener() }
export const profileSnapshot = () => snapshot
export const subscribeProfile = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function clearProfile() {
  generation++; scope = ''; loadedAt = 0; pending = undefined; publish({ loading: false })
}
export function cacheProfile(data: BuyerProfile, token: string) {
  // Ignore a response belonging to an account that signed out while saving.
  if (!scope || (scope !== token && snapshot.data?.id !== data.id)) return
  generation++; pending = undefined; scope = token; loadedAt = Date.now(); publish({ data, loading: false })
}
export function loadProfile(token: string, force = false): Promise<BuyerProfile> {
  if (!force && scope === token) {
    if (pending) return pending
    if (snapshot.data && Date.now() - loadedAt < 1800000) return Promise.resolve(snapshot.data)
  }
  const ticket = ++generation
  const existing = scope === token ? snapshot.data : undefined
  scope = token; publish({ data: existing, loading: true })
  const work = request<BuyerProfile>('/me', { headers: { Authorization: 'Bearer ' + token } }).then(data => {
    if (ticket === generation) { loadedAt = Date.now(); publish({ data, loading: false }) }
    return data
  }).catch(error => {
    if (ticket === generation) publish({ data: existing, loading: false, error: error instanceof Error ? error.message : 'Could not load your profile.' })
    throw error
  }).finally(() => { if (ticket === generation) pending = undefined })
  pending = work
  return work
}
