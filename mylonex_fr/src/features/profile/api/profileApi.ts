import { request } from '../../../shared/api'
import { getAccessToken } from '../../../shared/session/auth'
import type { ProfileInput } from '../schemas/profileSchema'
import type { BuyerProfile } from '../types/profile.types'
import { cacheProfile } from './profileStore'

async function mutate(path: string, method: string, body?: BodyInit, json = false) {
  const token = await getAccessToken()
  const data = await request<BuyerProfile>(path, { method, body, headers: {
    Authorization: 'Bearer ' + token, ...(json ? { 'Content-Type': 'application/json' } : {}),
  }, signal: AbortSignal.timeout(30000) })
  cacheProfile(data, token)
  return data
}
export const saveProfile = (input: ProfileInput) => mutate('/me/profile', 'PATCH', JSON.stringify(input), true)
export const removeAvatar = () => mutate('/me/avatar', 'DELETE')
export function uploadAvatar(file: File) {
  const data = new FormData(); data.append('avatar', file)
  return mutate('/me/avatar', 'POST', data)
}
export async function updatePassword(input: { currentPassword: string; newPassword: string }) {
  return request<{ message: string }>('/me/password', { method: 'POST', body: JSON.stringify(input),
    headers: { Authorization: 'Bearer ' + await getAccessToken(), 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000) })
}
