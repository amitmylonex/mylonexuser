import { useEffect, useState } from 'react'
import { usePortalData } from '../../../shared/session/rfq-api'
import FabricLoader from '../../../shared/components/FabricLoader'
import FabricCard from './FabricCard'
import CollectionCard from './CollectionCard'
import { browseParams, productionTypes, readBrowseState, type BrowseResult, type BrowseState, type Collection, type Fabric } from './types'

export default function FabricBrowser() {
  const [state, setState] = useState(readBrowseState)
  const { data, error, loading, refresh } = usePortalData<BrowseResult>('/buyer/fabrics?' + browseParams(state))
  const current = !loading && !error ? data : undefined
  const collectionMode = state.mode === 'collection'
  const title = collectionMode ? 'Collections' : current?.collection?.name || 'Fabrics'
  function change(next: BrowseState) {
    setState(next)
    const params = new URLSearchParams(browseParams(next))
    if (next.mode === 'collection') params.delete('mode')
    if (next.type === 'all') params.delete('type')
    if (next.page === 1) params.delete('page')
    window.history.replaceState(null, '', '/buyer/fabrics' + (params.size ? '?' + params.toString() : ''))
  }
  useEffect(() => {
    const pop = () => setState(readBrowseState())
    window.addEventListener('popstate', pop)
    return () => window.removeEventListener('popstate', pop)
  }, [])
  const clear = () => change({ mode: state.mode, type: 'all', page: 1 })
  return <div className="space-y-7">
    <section className="rounded-3xl border border-[#dfe3eb] bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_35%),linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] px-6 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Curated selections</p>
      <h1 className="mt-3 break-words text-[2.25rem] font-semibold tracking-tight text-[#111827]">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-[#4b5565]">{collectionMode ? 'Curated sets of fabrics grouped by seasonal demand and application.' : 'Explore individual fabrics and request a production quote.'}</p>
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Catalog view">
        {([['collection', 'Collections'], ['fabric', 'Fabrics']] as const).map(([mode, label]) => <button key={mode} type="button" aria-pressed={state.mode === mode}
          onClick={() => change({ mode, type: state.type, page: 1 })} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${state.mode === mode ? 'bg-primary text-white' : 'border border-[#dfe3eb] bg-white text-[#475467] hover:border-primary/40 hover:text-primary'}`}>{label}</button>)}
      </div>
    </section>
    <section className="space-y-4" aria-label="Catalog filters">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Production status">{productionTypes.map(([type, label]) =>
        <button key={type} type="button" aria-pressed={state.type === type} onClick={() => change({ ...state, type, page: 1 })}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${state.type === type ? 'border border-transparent bg-[#e2e8f0] text-[#1e293b]' : 'border border-[#dfe3eb] bg-white text-[#667085] hover:border-primary/40 hover:text-primary'}`}>{label}</button>)}</div>
      <p className="text-sm text-[#667085]" aria-live="polite">{loading ? 'Loading results…' : error ? 'Results unavailable' : current?.total ? `Showing ${(current.page - 1) * current.pageSize + 1}–${Math.min(current.page * current.pageSize, current.total)} of ${current.total}` : 'No results'}</p>
      {state.collectionId && <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={clear}>← View all fabrics</button>}
    </section>
    {loading && <div className="rounded-2xl border border-border bg-white p-10"><FabricLoader label="Loading catalog…" /></div>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}<button type="button" className="ml-3 underline" onClick={refresh}>Retry</button><button type="button" className="ml-3 underline" onClick={clear}>Clear filters</button></div>}
    {current && current.items.length === 0 && <section className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-16 text-center shadow-sm">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400" aria-hidden="true"><svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg></span>
      <h2 className="text-xl font-bold text-[#1f2937]">No {collectionMode ? 'collections' : 'fabrics'} found</h2>
      <p className="mt-2 max-w-sm text-base text-[#667085]">We couldn’t find anything matching your current filters. Try adjusting them or clearing them completely.</p>
      <button type="button" onClick={clear} className="mt-6 rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Clear All Filters</button>
    </section>}
    {current && current.items.length > 0 && <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{collectionMode ? (current.items as Collection[]).map(item =>
      <CollectionCard key={item.id} item={item} onOpen={() => change({ mode: 'fabric', collectionId: item.id, type: state.type, page: 1 })} />) : (current.items as Fabric[]).map(fabric => <FabricCard key={fabric.id} fabric={fabric} />)}</div>}
    {current && current.totalPages > 1 && <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Catalog pages">
      <button type="button" className="btn-outline" disabled={state.page <= 1} onClick={() => change({ ...state, page: state.page - 1 })}>Previous</button>
      <span className="text-sm text-muted">Page {current.page} of {current.totalPages}</span>
      <button type="button" className="btn-outline" disabled={state.page >= current.totalPages} onClick={() => change({ ...state, page: state.page + 1 })}>Next</button>
    </nav>}
  </div>
}
