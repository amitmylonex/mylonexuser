export type Fabric = { compositionText?: string; productionCycle?: string; gsm?: number; weaveType?: string; imageUrls?: string[]; id: string; fabricName: string; minimumOrderQuantity: number; supplier: { companyName: string }; shades: { id: string; name: string }[] }
export type Collection = { id: string; name: string; imageUrl: string | null; supplier: { companyName: string; city: string | null }
  _count: { catalogEntries: number }; catalogEntries: { imageUrls: string[]; productionCycle: string; gsm: number; widthInches: string | null; minimumOrderQuantity: number; leadTimeDays: number }[] }
export type BrowseResult = { mode: 'collection' | 'fabric'; items: (Fabric | Collection)[]; total: number; page: number; pageSize: number; totalPages: number; collection?: { id: string; name: string } | null }
export const productionTypes = [['all', 'All'], ['ready_stock', 'Ready Stock'], ['running_production', 'Running Production'], ['made_to_order', 'Made to Order']] as const
export type ProductionType = typeof productionTypes[number][0]
export type BrowseState = { mode: 'collection' | 'fabric'; type: ProductionType; page: number; collectionId?: string }
export function readBrowseState(): BrowseState {
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode') === 'fabric' || window.location.hash.startsWith('#fabric-') ? 'fabric' : 'collection'
  const type = productionTypes.find(([key]) => key === params.get('type'))?.[0] || 'all'
  const rawPage = Number(params.get('page'))
  const page = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 10000 ? rawPage : 1
  const collectionId = params.get('collectionId') || undefined
  return { mode, type, page, ...(mode === 'fabric' && collectionId ? { collectionId } : {}) }
}
export function browseParams(state: BrowseState) {
  return new URLSearchParams({ mode: state.mode, type: state.type, page: String(state.page), ...(state.collectionId ? { collectionId: state.collectionId } : {}) }).toString()
}
