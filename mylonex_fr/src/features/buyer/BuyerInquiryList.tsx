import { useCallback, useEffect, useRef, useState } from 'react'
import DataState from '../../shared/components/DataState'
import { PortalBadge, PortalBanner, PortalEmpty, PortalFact, PortalStat } from '../../shared/components/PortalPanels'
import { portalRequest, usePortalData, type Inquiry } from '../../shared/session/rfq-api'
import { InquiryPlaceholder, InquirySkeleton } from './InquirySkeleton'

type Row = Inquiry & {
  isFabricQuickRfq: boolean
  status: string; weaveType?: string; deliveryCity?: string; deliveryState?: string
  matchCount: number; quoteCount: number; forwardedCount: number
}
const tabs = [['all', 'All'], ['awaiting', 'Awaiting quotes'], ['quoted', 'Quoted'], ['closed', 'Closed']] as const
type Filter = typeof tabs[number][0]
export type BuyerInquiryResults = {
  items: Row[]; filteredTotal: number; page: number; pageSize: number
  totals: { total: number; withQuotes: number; withoutQuotes: number; awaiting: number; quoted: number; closed: number; quick: number }
}
const browse = <a className="btn-primary" href="/buyer/inquiries/new">Create New Inquiry</a>
const emptyItems: Row[] = []

export default function BuyerInquiryList() {
  const [status, setStatus] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const path = '/buyer/inquiries?' + new URLSearchParams({ q: query, status })
  const { data, error, loading, refresh } = usePortalData<BuyerInquiryResults>(path + '&page=1')
  const [additional, setAdditional] = useState<{ first: BuyerInquiryResults; latest: BuyerInquiryResults; items: Row[] }>()
  const [moreState, setMoreState] = useState<{ first: BuyerInquiryResults; pending: boolean; error?: string }>()
  const moreRequest = useRef<AbortController | null>(null)
  const endOfList = useRef<HTMLDivElement>(null)
  const extra = additional?.first === data ? additional : undefined
  const latest = extra?.latest ?? data
  const items = extra?.items ?? data?.items ?? emptyItems
  const morePending = moreState && moreState.first === data && moreState.pending
  const moreError = moreState?.first === data ? moreState?.error : undefined
  const totals = data?.totals
  const hasNextPage = Boolean(latest && latest.page * latest.pageSize < latest.filteredTotal)
  const canLoadMore = hasNextPage && !loading && !error && search.trim() === query

  function cancelNextPage() {
    moreRequest.current?.abort()
    moreRequest.current = null
    setMoreState(undefined)
  }

  useEffect(() => () => {
    moreRequest.current?.abort()
    moreRequest.current = null
  }, [path])

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadMore = useCallback(async () => {
    if (!data || !latest || !canLoadMore || morePending || moreRequest.current) return
    const controller = new AbortController()
    moreRequest.current = controller
    setMoreState({ first: data, pending: true })
    try {
      const next = await portalRequest<BuyerInquiryResults>(path + '&page=' + (latest.page + 1), undefined, controller.signal)
      if (controller.signal.aborted) return
      const merged = new Map(items.map(item => [item.id, item]))
      next.items.forEach(item => merged.set(item.id, item))
      setAdditional({ first: data, latest: next, items: [...merged.values()] })
      setMoreState(undefined)
    } catch (cause) {
      if (!controller.signal.aborted) setMoreState({
        first: data, pending: false, error: cause instanceof Error ? cause.message : 'Could not load more inquiries.',
      })
    } finally {
      if (moreRequest.current === controller) moreRequest.current = null
    }
  }, [canLoadMore, data, items, latest, morePending, path])

  useEffect(() => {
    const target = endOfList.current
    if (!target || !canLoadMore || morePending || moreError) return

    let observing = true
    const observer = new IntersectionObserver(entries => {
      if (observing && entries.some(entry => entry.isIntersecting)) void loadMore()
    }, { rootMargin: '0px 0px 300px 0px' })
    observer.observe(target)
    return () => {
      observing = false
      observer.disconnect()
    }
  }, [canLoadMore, loadMore, moreError, morePending])

  return <div className="space-y-7">
    <PortalBanner label="Buyer Portal" title="My Inquiries" description="Track your fabric RFQs and supplier quotes." action={browse} />
    {totals ? <section aria-label="Inquiry summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PortalStat label="Total Inquiries" value={totals.total} />
      <PortalStat label="Production With Quotes" value={totals.withQuotes} tone="success" />
      <PortalStat label="Production Awaiting Quotes" value={totals.withoutQuotes} tone="warning" />
      <PortalStat label="Fabric Quick RFQs" value={totals.quick} tone="primary" />
    </section> : loading && <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map(index => <div key={index} className="card space-y-3 p-5">
        <InquiryPlaceholder className="h-4 w-3/4" />
        <InquiryPlaceholder className="h-8 w-12" />
      </div>)}
    </div>}
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Inquiry status">
        {tabs.map(([key, label]) => <button key={key} type="button" aria-pressed={status === key}
          className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold ${status === key ? 'border-primary bg-primary text-white' : 'border-[#dfe3eb] bg-white text-[#344054] hover:border-primary'}`}
          onClick={() => {
            if (key !== status || search.trim() !== query) cancelNextPage()
            setStatus(key)
            setQuery(search.trim())
          }}>
          {label}{totals && <span className={`rounded-full px-2 py-0.5 text-xs ${status === key ? 'bg-white/20' : 'bg-[#f2f4f7]'}`}>{key === 'all' ? totals.total : totals[key]}</span>}
        </button>)}
      </div>
      <form className="max-w-md" onSubmit={event => { event.preventDefault(); setQuery(search.trim()) }} role="search">
        <div className="relative min-w-[13rem] flex-1">
          <svg aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
          <input type="search" className="input rounded-lg border-[#dfe3eb] pl-10" aria-label="Search by RFQ ID or fabric name"
            placeholder="Search by RFQ ID or fabric name" maxLength={200} value={search}
            onChange={event => {
              const value = event.target.value
              if (value.trim() !== search.trim()) cancelNextPage()
              setSearch(value)
              if (!value.trim()) setQuery('')
            }} />
        </div>
      </form>
      <DataState data={data} error={error} loading={loading} retry={refresh} />
      {loading && !data && [0, 1, 2].map(index => <InquirySkeleton key={index} />)}
      {latest && <><p className="text-sm text-[#667085]" aria-live="polite">{latest.filteredTotal} {latest.filteredTotal === 1 ? 'record' : 'records'}</p>
        {items.length ? <ul aria-label="Inquiry results" className="space-y-3">{items.map(item => <li key={item.id}><InquiryRow item={item} /></li>)}</ul> :
          !loading && !error &&
          <PortalEmpty title={query || status !== 'all' ? 'No matching inquiries' : 'No inquiries yet'}
            description={query || status !== 'all' ? 'Try a different search or status.' : 'Create your first RFQ to start receiving supplier quotes.'}
            action={!query && status === 'all' ? browse : undefined} />}
        <div className="space-y-3 [overflow-anchor:none]">
          <span role="status" className="sr-only">{morePending ? 'Loading more inquiries…' : items.length + ' inquiries shown'}</span>
          {morePending && <InquirySkeleton />}
          {canLoadMore && moreError && <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <p role="alert" className="text-destructive">{moreError}</p>
            <button type="button" className="btn-outline" onClick={loadMore}>Retry</button>
          </div>}
          {canLoadMore && !morePending && !moreError && <div ref={endOfList} aria-hidden="true" className="h-px" />}
        </div>
      </>}
    </section>
  </div>
}

function InquiryRow({ item }: { item: Row }) {
  const closed = ['closed', 'cancelled'].includes(item.status)
  const status = closed ? 'Closed' : item.quoteCount ? 'Quoted' : item.forwardedCount ? 'Awaiting Quotes' : 'Under Review'
  const delivery = [item.deliveryCity, item.deliveryState].filter(Boolean).join(', ') || item.deliveryPincode
  const target = item.targetPriceMin != null && item.targetPriceMax != null ? `₹${item.targetPriceMin} – ₹${item.targetPriceMax} / m` : 'Not provided'
  return <a href={'/buyer/inquiries/' + item.id} className="group block rounded-2xl border border-[#dfe3eb] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[#c7d2fe] hover:shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-[#101828] group-hover:text-primary">{item.fabricName}{item.weaveType ? ' / ' + item.weaveType : ''}</h2>
        <p className="mt-1 text-xs font-medium tracking-[0.08em] text-[#667085]">{item.rfqNumber}</p></div>
      <div className="flex flex-wrap gap-2">{item.isFabricQuickRfq && <PortalBadge tone="blue">Fabric RFQ</PortalBadge>}
        <PortalBadge tone={closed ? 'slate' : item.quoteCount ? 'green' : 'amber'}>{status}</PortalBadge>
        <PortalBadge tone="green">{item.quoteCount} {item.quoteCount === 1 ? 'quote' : 'quotes'}</PortalBadge>
      </div>
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[#edf1f6] py-3 lg:grid-cols-5">
      <PortalFact label="Quantity">{item.quantity} m</PortalFact><PortalFact label="Delivery">{delivery}</PortalFact>
      <PortalFact label="Matches">{item.matchCount}</PortalFact><PortalFact label="Production Type">{item.productionCycle?.replaceAll('_', ' ') || 'Not specified'}</PortalFact>
      <PortalFact label="Target Price">{target}</PortalFact>
    </dl>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <time className="text-xs text-[#667085]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</time>
      <span className="text-sm font-semibold text-primary">View details</span>
    </div>
  </a>
}
