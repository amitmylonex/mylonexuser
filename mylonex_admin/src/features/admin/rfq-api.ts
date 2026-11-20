import { useEffect, useState } from 'react'
import { request } from '../../shared/api'
import { getAccessToken } from './session'

export type Inquiry = { id: string; rfqNumber: string; fabricName: string; quantity: number; deliveryPincode: string; buyerMessage?: string }
export type Quote = {
  id: string; price: string; leadTimeDays: number; moq: number; dispatchLocation: string;
  status: string; quoteType: string; adminReviewNote?: string; notes?: string; sampleAvailability?: string;
  additionalNotes?: string; submissionRevision: number
}
export async function portalRequest<T>(path: string, body?: object, signal?: AbortSignal) {
  const token = await getAccessToken()
  return request<T>(path, {
    signal, method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
}
export function usePortalData<T>(path: string) {
  const [revision, setRevision] = useState(0)
  const key = path + ':' + revision
  const [result, setResult] = useState<{ key: string; scope: string; data?: T; error?: string }>()
  const scope = path.split('?')[0]
  useEffect(() => {
    const controller = new AbortController()
    portalRequest<T>(path, undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ key, scope, data })
    }).catch(error => {
      if (!controller.signal.aborted) setResult(previous => ({
        key, scope, data: previous?.scope === scope ? previous.data : undefined,
        error: error instanceof Error ? error.message : 'Could not load results.',
      }))
    })
    return () => controller.abort()
  }, [path, key, scope])
  return {
    data: result?.scope === scope ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: result?.key !== key,
    refresh: () => setRevision(value => value + 1),
  }
}
