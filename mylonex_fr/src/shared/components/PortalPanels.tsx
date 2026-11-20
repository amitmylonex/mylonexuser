import type { ReactNode } from 'react'

export function PortalBanner({ label, title, description, action }: {
  label: string; title: string; description: string; action?: ReactNode
}) {
  return <section className="rounded-3xl border border-[#dfe3eb] bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.2),transparent_35%),linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] px-6 py-8 sm:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{label}</p>
        <h1 className="mt-3 break-words text-[2rem] font-semibold tracking-tight text-[#111827] sm:text-[2.35rem]">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#667085]">{description}</p>
      </div>
      {action}
    </div>
  </section>
}

const colors = { ink: 'text-[#1f2937]', success: 'text-[#059669]', warning: 'text-[#b54708]', primary: 'text-primary' }

export function PortalStat({ label, value, tone = 'ink' }: { label: string; value: number; tone?: keyof typeof colors }) {
  return <div className="rounded-2xl border border-[#dfe3eb] bg-white p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">{label}</p>
    <p className={`mt-2 text-3xl font-semibold tracking-tight ${colors[tone]}`}>{value}</p>
  </div>
}

export function PortalEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-16 text-center shadow-sm">
    <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 8h16l2 6v6H2v-6l2-6Zm2 0 2-4h8l2 4M2 14h6l2 2h4l2-2h6" /></svg>
    </span>
    <p className="text-xl font-bold text-[#1f2937]">{title}</p>
    <p className="mt-2 max-w-sm text-sm text-[#667085]">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
}

const badgeColors = {
  blue: 'bg-[#eef2ff] text-primary', green: 'bg-[#ecfdf3] text-[#047857]',
  amber: 'bg-[#fff7e8] text-[#b54708]', slate: 'bg-[#f2f4f7] text-[#475467]', red: 'bg-[#fef2f2] text-[#b42318]',
}

export function PortalBadge({ tone, children }: { tone: keyof typeof badgeColors; children: ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColors[tone]}`}>{children}</span>
}

export function PortalFact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-[#667085]">{label}</dt>
    <dd className="mt-1 break-words text-sm font-semibold text-[#101828]">{children}</dd></div>
}
