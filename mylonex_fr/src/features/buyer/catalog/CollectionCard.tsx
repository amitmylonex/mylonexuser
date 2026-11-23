import type { Collection } from './types'
import { productionTypes } from './types'

export default function CollectionCard({ item, onOpen }: { item: Collection; onOpen: () => void }) {
  const first = item.catalogEntries[0]
  const image = item.imageUrl || first?.imageUrls[0]
  return <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dfe3eb] bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
    {image ? <img src={image} alt={item.name} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-slate-100 text-sm text-muted">No image</div>}
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">{productionTypes.find(([key]) => key === first?.productionCycle)?.[1] || 'Collection'}</span>
        <span className="text-muted">{item._count.catalogEntries} fabrics</span></div>
      <h2 className="break-words text-2xl font-semibold">{item.name}</h2>
      {first && <dl className="grid grid-cols-2 gap-3 border-y border-border py-3 text-sm">{[
        ['Preview GSM', first.gsm], ['Preview width', first.widthInches ? first.widthInches + '″' : '—'], ['MOQ', first.minimumOrderQuantity + ' m'], ['Lead time', first.leadTimeDays + ' days'],
      ].map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted">{item.supplier.city || 'India'}</span>
        <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={onOpen} aria-label={'View collection ' + item.name}>View Collection →</button></div>
    </div>
  </article>
}
