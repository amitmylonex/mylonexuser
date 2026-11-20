import FabricLoader from '../../shared/components/FabricLoader'
import type { Buyer } from '../auth/buyer-api'
import BuyerDashboard from './BuyerDashboard'
import { BuyerInquiries, Fabrics } from './InquiryPages'

const Builder = lazy(() => import('../../legacy-rfq/app/buyer/inquiries/new/builder/BuyerWorkspace'))

export default function BuyerPortal({ account, path }: { account: Buyer; path: string }) {
  if (path === '/buyer/fabrics') return <Fabrics />
  if (path === '/buyer/inquiries/new') return <Suspense fallback={<FabricLoader label="Loading RFQ builder…" />}><Builder buyerId={account.id} /></Suspense>
  if (path.startsWith('/buyer/inquiries')) return <BuyerInquiries id={path.split('/')[3]} />
  return <BuyerDashboard account={account} />
}
import { lazy, Suspense } from 'react'
