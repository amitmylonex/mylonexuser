import { useEffect, useSyncExternalStore } from 'react'
import { getAccessToken } from '../../../shared/session/auth'
import { loadProfile, profileSnapshot, subscribeProfile } from '../api/profileStore'

export function useProfile(userId: string) {
  const snapshot = useSyncExternalStore(subscribeProfile, profileSnapshot)
  useEffect(() => {
    if (profileSnapshot().data?.id === userId) return
    void getAccessToken().then(token => loadProfile(token)).catch(() => { /* The shared snapshot exposes load errors. */ })
  }, [userId])
  return { ...snapshot, data: snapshot.data?.id === userId ? snapshot.data : undefined,
    refresh: () => { void getAccessToken().then(token => loadProfile(token, true)).catch(() => {}) } }
}
