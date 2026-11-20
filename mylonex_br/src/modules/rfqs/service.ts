import { Prisma, type PrismaClient } from '@prisma/client';
import { BuyerAccessError as RfqError } from '../auth/access-error.js';
import { resolveSelectedFabricShades, toSelectedShadeSnapshot } from './fabric-selections.js';
import { generateRfqNumber } from './numbers.js';
import { determineRouting } from './routing.js';
import type { ProductionRfq, Quote } from './schema.js';

export const availableFabrics = { isActive: true, supplier: { status: 'APPROVED' } } satisfies Prisma.SupplierCatalogWhereInput;
export const fabricFields = {
  id: true, supplierId: true, fabricName: true, compositionText: true, widthInches: true,
  weaveType: true, gsm: true, minimumOrderQuantity: true, productionCycle: true, shadeVariants: true,
  materialPurity: true, imageUrls: true, supplier: { select: { companyName: true } },
} satisfies Prisma.SupplierCatalogSelect;

export async function createFromFabric(db: PrismaClient, buyerId: string, input: ProductionRfq) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async tx => {
        const fabric = await tx.supplierCatalog.findFirst({ where: { id: input.fabricId, ...availableFabrics }, select: fabricFields });
        if (!fabric) throw new RfqError(404, 'Selected fabric is unavailable');
        let shades;
        try {
          shades = toSelectedShadeSnapshot(resolveSelectedFabricShades(fabric.shadeVariants, input.selectedShadeIds));
        } catch (error) {
          throw new RfqError(400, (error as Error).message);
        }
        if (input.quantity < fabric.minimumOrderQuantity) {
          throw new RfqError(400, `Minimum ${fabric.minimumOrderQuantity} meters per shade`);
        }
        const quantity = input.quantity * Math.max(shades.length, 1);
        if (quantity > 2147483647) throw new RfqError(400, 'Total quantity is too large');
        const productionCycle = input.productionCycle ?? fabric.productionCycle;
        const routing = determineRouting({ productionCycle, quantity, deliveryPincode: input.deliveryPincode });
        const rfqNumber = await generateRfqNumber(
          async date => (await tx.communicationRequest.findFirst({
            where: { rfqNumber: { startsWith: `RFQ-${date}-` } }, orderBy: { rfqNumber: 'desc' },
            select: { rfqNumber: true },
          }))?.rfqNumber ?? null,
          async number => Boolean(await tx.communicationRequest.findUnique({ where: { rfqNumber: number }, select: { id: true } })),
        );
        const composition = fabric.compositionText ?? fabric.fabricName;
        const snapshot = {
          id: fabric.id, supplierId: fabric.supplierId, supplierName: fabric.supplier.companyName,
          fabricName: fabric.fabricName, composition, width: fabric.widthInches?.toString() ?? '',
          weaveType: fabric.weaveType, gsm: fabric.gsm, selectedShades: shades,
        };
        const message = [
          'Quick Fabric RFQ', `Selected Fabric: ${fabric.fabricName}`, `Composition: ${composition}`,
          `Weave: ${fabric.weaveType}`, `GSM: ${fabric.gsm}`, `Quantity: ${quantity}m`,
          `Delivery Pincode: ${input.deliveryPincode}`,
          input.buyerMessage && `Buyer Note: ${input.buyerMessage}`,
        ].filter(Boolean).join(' | ');
        return tx.communicationRequest.create({
          data: {
            buyerId, requesterRole: 'BUYER', requestType: 'quote', rfqNumber,
            anonymizedBuyerReference: 'BUY-' + buyerId.slice(0, 8).toUpperCase(),
            buyerMessage: message, fabricName: fabric.fabricName, quantity, deliveryPincode: input.deliveryPincode,
            targetPriceMin: input.targetPriceMin, targetPriceMax: input.targetPriceMax,
            requiredDeliveryDate: input.requiredDeliveryDate ? new Date(input.requiredDeliveryDate) : null,
            productionCycle, contactPhone: input.contactPhone, buyerImageUrls: input.referenceImageUrls ?? [],
            ...routing,
            specPayload: {
              origin: 'fabric_quick_rfq', selectedFabricId: fabric.id, selectedFabricSnapshot: snapshot,
              selectedShades: shades, composition, fabricStructure: 'woven', endUse: 'Other',
              quantityPerShadeMeters: input.quantity, totalQuantityMeters: quantity,
              data: { selectedPath: 'production', quantity: input.quantity, productionCycle,
                weaveType: fabric.weaveType, gsm: fabric.gsm, width: snapshot.width,
                deliveryPincode: input.deliveryPincode, deliveryCountry: input.deliveryCountry,
                deliveryState: input.deliveryState, deliveryCity: input.deliveryCity },
            },
            matches: { create: { supplierId: fabric.supplierId, sourceType: 'supplier_catalog', sourceId: fabric.id,
              score: 100, explanation: 'Exact fabric selected by the buyer.', listingSnapshot: snapshot,
              status: 'PENDING_ADMIN_REVIEW', routeMeta: { routingMode: 'exact_fabric_selection', selectedShadeCount: shades.length },
            } },
          },
          select: { id: true, rfqNumber: true },
        });
      });
    } catch (error) {
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
      throw error;
    }
  }
}

export function isQuickRfq() {
  return { path: ['origin'], equals: 'fabric_quick_rfq' } satisfies Prisma.JsonFilter;
}

export async function submitQuote(db: PrismaClient, userId: string, matchId: string, input: Quote) {
  return db.$transaction(tx => writeQuote(tx, userId, matchId, input));
}

export async function writeQuote(tx: Prisma.TransactionClient, userId: string, matchId: string, input: Quote) {
    const match = await tx.communicationRequestMatch.findFirst({
      where: { id: matchId, supplier: { userId, status: 'APPROVED' }, status: 'FORWARDED_TO_SUPPLIER',
        communicationRequest: { requesterRole: 'BUYER', OR: [
          { specPayload: isQuickRfq() }, { specPayload: { path: ['origin'], equals: 'buyer_batch' } },
        ] } },
      select: { supplierId: true },
    });
    if (!match) throw new RfqError(404, 'Request match not found or unauthorized');
    // Lock the eligible supplier and match until the write commits, including against concurrent suspension or quote retries.
    const eligible = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "SupplierProfile"
      WHERE id = ${match.supplierId} AND "userId" = ${userId} AND status = 'APPROVED' FOR SHARE
    `;
    if (!eligible.length) throw new RfqError(404, 'Request match not found or unauthorized');
    const locked = await tx.communicationRequestMatch.updateMany({
      where: { id: matchId, supplierId: match.supplierId, status: 'FORWARDED_TO_SUPPLIER' },
      data: { updatedAt: new Date() },
    });
    if (!locked.count) throw new RfqError(404, 'Request match not found or unauthorized');
    const existing = await tx.communicationRequestResponse.findUnique({ where: { requestMatchId: matchId } });
    if (existing && existing.status !== 'REJECTED_BY_ADMIN') {
      throw new RfqError(409, 'Response already submitted and awaiting admin decision');
    }
    const data = { ...input, supplierId: match.supplierId, status: 'PENDING_ADMIN_REVIEW' as const };
    const select = { id: true, status: true, submissionRevision: true };
    return existing ? tx.communicationRequestResponse.update({
      where: { requestMatchId: matchId },
      data: { ...data, submissionRevision: { increment: 1 }, adminReviewedAt: null,
        adminReviewedByUserId: null, adminReviewNote: null, supplierOriginalPrice: null }, select,
    }) : tx.communicationRequestResponse.create({ data: { ...data, requestMatchId: matchId }, select });
}
