import type { Buyer } from '../auth/buyer-api'
import type { BuyerInquiryResults } from './BuyerInquiryList'
import { usePortalData } from '../../shared/session/rfq-api'
import DataState from '../../shared/components/DataState'
import { PortalStat } from '../../shared/components/PortalPanels'

export default function BuyerDashboard({ account }: { account: Buyer }) {
  const { data, error, loading, refresh } = usePortalData<BuyerInquiryResults>('/buyer/inquiries')
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="label">Buyer Portal</p><h1 className="text-2xl font-semibold">Overview</h1></div>
      <div className="flex flex-wrap gap-3"><a className="btn-primary" href="/buyer/fabrics">Browse Fabrics</a>
        <a className="btn-ghost" href="/buyer/inquiries">View History</a></div>
    </div>
    <section className="card p-6">
      <h2 className="text-lg font-semibold">Welcome back, {account.buyerProfile?.company || account.fullName || account.email}!</h2>
      <p className="mt-2 text-sm text-ink/70">Manage inquiries, track matches, and review supplier quotes.</p>
    </section>
    <DataState data={data} error={error} loading={loading} retry={refresh} />
    {data && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <PortalStat label="Open Fabric RFQs" value={data.totals.awaiting + data.totals.quoted} tone="primary" />
    </div>}
  </div>
}
