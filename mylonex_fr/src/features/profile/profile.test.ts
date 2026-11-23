import { afterEach, describe, expect, it, vi } from 'vitest'
import { profileSchema } from './schemas/profileSchema'
import { clearProfile, cacheProfile, loadProfile, profileSnapshot } from './api/profileStore'
import type { BuyerProfile } from './types/profile.types'

const fixture = (id: string, name = 'Buyer'): BuyerProfile => ({ id, role: 'BUYER', email: id + '@example.com', fullName: name,
  createdAt: '2026-11-23T00:00:00Z', updatedAt: '2026-11-23T00:00:00Z', avatarUrl: null, buyerProfile: null })
const valid = { fullName: 'Buyer', company: null, phone: '+919876543210', designation: null, gstNumber: null, address: null, state: null, city: null, pincode: '395001' }
afterEach(() => { clearProfile(); vi.unstubAllGlobals() })

describe('buyer profile validation', () => {
  it('accepts optional fields and validates phone, GSTIN, pincode and protected fields', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true)
    expect(profileSchema.parse({ ...valid, phone: '+91 98765-43210' }).phone).toBe('+919876543210')
    for (const value of [{ ...valid, phone: '123' }, { ...valid, pincode: '012345' }, { ...valid, email: 'other@example.com' },
      { ...valid, role: 'ADMIN' }, { ...valid, gstNumber: 'invalid' }, { ...valid, city: 'Surat' }]) expect(profileSchema.safeParse(value).success).toBe(false)
  })
})

describe('single current-profile cache', () => {
  it('deduplicates pending and repeated profile reads and publishes saved changes immediately', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(fixture('one')), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const first = loadProfile('token-one'), second = loadProfile('token-one')
    expect(first).toBe(second)
    await first
    await loadProfile('token-one')
    expect(fetch).toHaveBeenCalledTimes(1)
    cacheProfile(fixture('one', 'Updated Name'), 'token-one')
    expect(profileSnapshot().data?.fullName).toBe('Updated Name')
  })
  it('does not restore stale profile data after sign-out', async () => {
    let finish!: (response: Response) => void
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve })))
    const work = loadProfile('token-one')
    clearProfile()
    finish(new Response(JSON.stringify(fixture('one')), { status: 200 }))
    await work
    expect(profileSnapshot().data).toBeUndefined()
    cacheProfile(fixture('one'), 'token-one')
    expect(profileSnapshot().data).toBeUndefined()
  })
  it('never reuses a cached profile for another bearer session', async () => {
    let count = 0
    const fetch = vi.fn(async () => new Response(JSON.stringify(fixture(++count === 1 ? 'one' : 'two')), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    await loadProfile('token-one')
    const next = loadProfile('token-two')
    expect(profileSnapshot().data).toBeUndefined()
    await next
    expect(profileSnapshot().data?.id).toBe('two')
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
