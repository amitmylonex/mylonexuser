import type { Supplier } from '../../shared/session/portal-api'
import { usePortalData } from '../../shared/session/rfq-api'
import DataState from '../../shared/components/DataState'
import { PortalBadge, PortalStat } from '../../shared/components/PortalPanels'

const statusMessage = {
  APPROVED: 'Your supplier account is approved.',
  PENDING: 'Your supplier account is pending approval.',
  SUSPENDED: 'Your supplier account is suspended. Please contact support.',
}

export type SupplierTotals = { total: number; pending: number; responded: number }

export default function SupplierDashboard({ account }: { account: Supplier }) {
  const profile = account.supplierProfile
  return <div className="space-y-6">
    <div>
      <p className="text-sm font-medium text-primary">Supplier Dashboard</p>
      <h1 className="text-2xl font-semibold">Welcome, {profile?.companyName || account.fullName || account.email}</h1>
      <p className="mt-1 text-sm text-ink/70">View assigned fabric RFQs and track your submitted quotes.</p>
    </div>
    <p role="status"><PortalBadge tone={profile?.status === 'APPROVED' ? 'green' : 'amber'}>
      {profile ? statusMessage[profile.status] : 'Your supplier profile is missing or incomplete. Please contact support.'}
    </PortalBadge></p>
    {profile?.status === 'APPROVED' && <SupplierActivity />}
  </div>
}

function SupplierActivity() {
  const { data, error, loading, refresh } = usePortalData<{ totals: SupplierTotals }>('/supplier/inquiries')
  return <section className="space-y-4">
    <h2 className="text-lg font-semibold">RFQ Activity</h2>
    <DataState data={data} error={error} loading={loading} retry={refresh} />
    {data && <div className="grid gap-4 sm:grid-cols-3">
      <PortalStat label="RFQs Received" value={data.totals.total} tone="primary" />
      <PortalStat label="Awaiting Response" value={data.totals.pending} tone="warning" />
      <PortalStat label="RFQs Responded" value={data.totals.responded} tone="success" />
    </div>}
    <a href="/supplier/inquiries" className="btn-outline">View Inquiries</a>
  </section>
}
