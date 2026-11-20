import { request } from '../api'
import { readBuyer, type Buyer } from '../../features/auth/buyer-api'

export type Role = 'BUYER' | 'SUPPLIER' | 'ADMIN'
export type Account = { id: string; email: string; fullName: string | null; role: Role }
export type Supplier = Account & {
  role: 'SUPPLIER'
  supplierProfile: { companyName: string; status: 'PENDING' | 'APPROVED' | 'SUSPENDED' } | null
}
export type Admin = Account & { role: 'ADMIN' }
export type PortalAccount = Buyer | Supplier | Admin

export function readAccount(token: string, signal: AbortSignal) {
  return request<Account>('/auth/session', { headers: { Authorization: 'Bearer ' + token }, signal })
}

export async function loadPortal(token: string): Promise<PortalAccount> {
  const headers = { Authorization: 'Bearer ' + token }
  const account = await request<Account>('/auth/session', { method: 'POST', headers })
  switch (account.role) {
    case 'BUYER': return readBuyer(token)
    case 'SUPPLIER': return request<Supplier>('/supplier/me', { headers })
    case 'ADMIN': return { ...account, role: 'ADMIN' }
  }
}
