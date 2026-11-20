# RFQ builder and WhatsApp port

| Legacy source | Contract in the new project |
| --- | --- |
| `app/buyer/inquiries/new/page.tsx` and `builder/` | Role-gated buyer workspace. Manual lines, text parsing and reconciliation, spreadsheet review, handwritten transcription review, and voice recording/transcript review. Imports remain editable local drafts until explicit submission. |
| `app/api/buyer/inquiries/{extract-text,extract-image,voice,upload}/route.ts` | Corresponding bearer-authenticated `/api/v1/buyer/inquiries/*` endpoints. Text retains the deterministic fallback. Image and audio processing retain consent checks and bounded payloads. Storage uploads use a separately configured development bucket. |
| `src/domains/rfq/batch/{schema,repo,service}.ts`, `src/domains/rfq/production.ts`, `src/domains/requests/matching.ts` | Batch creates CommunicationRequest rows, up to eight eligible catalog/woven matches per line, and an RfqBatch receipt atomically. Matching runs inside the local write transaction so a failure rolls back the batch. The receipt's dispatch counts describe local matching only. Same key and validated payload returns the receipt. A different payload with the same key returns 409. Legacy single catalog RFQs keep their exact match path. The historical Inquiry table is not involved. |
| `src/domains/notifications/whatsapp-supplier.ts`, `whatsapp-supplier-payload.ts`, and `src/domains/admin/approvals.ts` | Legacy automatic dispatch can send a matched template with allowPendingReview; it also permits unmatched recipients for templates other than the Flow-enabled template. Legacy manual forwarding sends after approval. The new app has no registered enqueue trigger or Meta send adapter. |
| `app/api/whatsapp/webhook/route.ts`, `whatsapp-inbound.ts`, `whatsapp-flow-token.ts`, and `whatsapp-quote-parser.ts` | Opt-in Flow webhook at `/api/v1/whatsapp/webhook`. Verify raw-body HMAC and configured recipient number ID. Match token binds match, supplier and request ID. Verify approved, opted-in supplier and normalized sender number. Save the quote and deduplication event in the same transaction. Text, status callbacks and reminder flows are not wired. |
| `diagnostics/whatsapp-flow/rfq-supplier-quote-v6.json` | Preserved two-screen Flow definition. Maps per-meter price, basis/validity, total and per-colour MOQ, lead time, sample details and remarks. Admin still releases each quote through the existing review endpoint. |

The conflicting states are `PENDING_ADMIN_REVIEW` at automatic send and
`FORWARDED_TO_SUPPLIER` for portal visibility and inbound quote authorization.
Sending a Flow to every approved, consented supplier would also require a
match assignment for each recipient. The queue functions currently accept
only forwarded matches. They use the existing event table for stable job IDs,
bounded backoff on explicit retryable results, and an uncertain state after a
transport exception. A crash during a send leaves a claimed job for manual
reconciliation. There is no scheduler or live provider configured.

The Prisma changes are projections of existing legacy tables and enums.
The disposable local schema already had the batch receipt, catalog, location,
and WhatsApp event tables. No DDL was applied. Production should not be
synchronized from the partial Prisma projection.

Validation used throwaway PostgreSQL and local Auth/provider fixtures. Run
`npm run test:rfq` in the frontend for the imported extraction corpus. The
MATT 2/2 fixture expects no fabric state, while both the legacy baseline and
the port infer finished. Hosted image OCR, voice processing, reference photo
storage, and Meta template/Flow binding need a dedicated staging check.
