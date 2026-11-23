import FabricLoader from '../../shared/components/FabricLoader'
import type { Buyer } from '../auth/buyer-api'
import BuyerDashboard from './BuyerDashboard'
import { BuyerInquiries, Fabrics } from './InquiryPages'

const Builder = lazy(() => import('../../legacy-rfq/app/buyer/inquiries/new/builder/BuyerWorkspace'))
const BuyerChat = lazy(() => import('./chat/BuyerChat'))
const BuyerProfilePage = lazy(() => import('../profile/pages/BuyerProfilePage'))

export default function BuyerPortal({ account, path }: { account: Buyer; path: string }) {
  if (path === '/buyer/profile' || path.startsWith('/buyer/profile/')) return <Suspense fallback={<FabricLoader label="Loading profile…" />}><BuyerProfilePage userId={account.id} path={path} /></Suspense>
  if (path === '/buyer/chat') return <Suspense fallback={<FabricLoader label="Loading AI chat…" />}><BuyerChat key={account.id} buyerId={account.id} /></Suspense>
  if (path === '/buyer/fabrics') return <Fabrics />
  if (path === '/buyer/inquiries/new') return <Suspense fallback={<FabricLoader label="Loading RFQ builder…" />}><Builder buyerId={account.id} /></Suspense>
  if (path.startsWith('/buyer/inquiries')) return <BuyerInquiries id={path.split('/')[3]} />
  return <BuyerDashboard account={account} />
}
import { lazy, Suspense } from 'react'
