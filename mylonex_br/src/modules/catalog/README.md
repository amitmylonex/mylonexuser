# Buyer catalog browsing

`GET /api/v1/buyer/fabrics` retains existing bearer authentication and buyer
authorization. The `buyer-browse.ts` service accepts `mode=collection|fabric`,
`type=all|ready_stock|running_production|made_to_order`, `page=1..10000` and an
optional `collectionId` in fabric mode. API callers without `mode` retain fabric
results; the buyer UI defaults to Collections, matching the legacy storefront.

Both views return `{ mode, items, total, page, pageSize, totalPages }` with 12
items per page. Collections must be unarchived, belong to approved suppliers
and have at least one matching active fabric. Each response includes one bounded
fabric preview and a count of matching fabrics, rather than loading an entire
collection. Fabric results preserve shade choices and existing quote submission.
Opening a collection applies its ID to the fabric view; unavailable collections
return 404. The existing legacy `fabric_collections` table is projected into
Prisma; no database migration or new collection data was created.

The frontend feature lives in `src/features/buyer/catalog` with separate browser,
fabric and collection cards. View/filter/page state is retained in the URL, and
empty, loading and error states are distinct. The existing profile avatar remains
in the shared buyer header. Run backend `npm test` and frontend `npm run build`
plus lint on the changed frontend files.
