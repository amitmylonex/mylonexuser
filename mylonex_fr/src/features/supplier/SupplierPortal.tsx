import type { Supplier } from '../../shared/session/portal-api'
import SupplierDashboard from './SupplierDashboard'
import { SupplierInquiries } from './InquiryPages'

export default function SupplierPortal({ account, path }: { account: Supplier; path: string }) {
  if (path.startsWith('/supplier/inquiries') && account.supplierProfile?.status === 'APPROVED') {
    return <SupplierInquiries id={path.split('/')[3]} />
  }
  return <SupplierDashboard account={account} />
}
