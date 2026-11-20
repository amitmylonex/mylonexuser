import FabricLoader from './FabricLoader'

export default function DataState({ data, error, loading = !data && !error, retry, skeleton }: {
  data: unknown; error?: string; loading?: boolean; retry?: () => void; skeleton?: 'cards' | 'table'
}) {
  return <>
    <div className="min-h-12">
      {error ? <p role="alert" className="text-sm text-destructive">{error}{retry && <> <button type="button" className="underline" onClick={retry}>Retry</button></>}</p> :
        loading ? <FabricLoader label={data ? 'Updating results…' : 'Loading…'} /> : null}
    </div>
    {loading && !data && skeleton && <div aria-hidden="true" className={skeleton === 'table' ? 'card divide-y divide-border' : 'space-y-3'}>
      {[0, 1, 2].map(row => <div key={row} className={skeleton === 'table' ? 'flex items-center gap-6 p-4' : 'card space-y-4 p-5'}>
        <div className="h-4 w-2/5 rounded bg-slate-200" />
        <div className="h-3 w-1/4 rounded bg-slate-100" />
        {skeleton === 'cards' && <div className="h-8 rounded bg-slate-100" />}
      </div>)}
    </div>}
  </>
}

