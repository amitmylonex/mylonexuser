import type { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { availableFabrics, fabricFields } from '../rfqs/service.js';
import { parseStoredFabricShades } from '../rfqs/fabric-selections.js';
import { BuyerAccessError } from '../auth/access-error.js';

export const browseQuery = z.object({
  mode: z.enum(['collection', 'fabric']).default('fabric'),
  type: z.enum(['all', 'ready_stock', 'running_production', 'made_to_order']).default('all'),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  collectionId: z.string().uuid().optional(),
}).strict();

export async function browseBuyerCatalog(db: PrismaClient, input: unknown) {
  const parsed = browseQuery.safeParse(input);
  if (!parsed.success) throw new BuyerAccessError(400, 'Choose a valid catalog view, production status and page.');
  const { mode, type, page, collectionId } = parsed.data;
  const pageSize = 12;
  const eligible: Prisma.SupplierCatalogWhereInput = { ...availableFabrics, ...(type !== 'all' ? { productionCycle: type } : {}) };
  if (mode === 'collection') {
    const where: Prisma.FabricCollectionWhereInput = { isArchived: false, supplier: { status: 'APPROVED' }, catalogEntries: { some: eligible } };
    const [items, total] = await db.$transaction([
      db.fabricCollection.findMany({ where, take: pageSize, skip: (page - 1) * pageSize,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], select: {
          id: true, name: true, imageUrl: true, supplier: { select: { companyName: true, city: true } },
          _count: { select: { catalogEntries: { where: eligible } } },
          catalogEntries: { where: eligible, take: 1, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: { imageUrls: true, gsm: true, widthInches: true, minimumOrderQuantity: true, productionCycle: true, leadTimeDays: true } },
        },
      }), db.fabricCollection.count({ where }),
    ]);
    return { mode, items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
  const collection = collectionId ? await db.fabricCollection.findFirst({
    where: { id: collectionId, isArchived: false, supplier: { status: 'APPROVED' } }, select: { id: true, name: true },
  }) : null;
  if (collectionId && !collection) throw new BuyerAccessError(404, 'This collection is unavailable.');
  const where: Prisma.SupplierCatalogWhereInput = { ...eligible, ...(collection ? { fabricCollectionId: collection.id } : {}) };
  const [rows, total] = await db.$transaction([
    db.supplierCatalog.findMany({ where, select: fabricFields, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: pageSize, skip: (page - 1) * pageSize }),
    db.supplierCatalog.count({ where }),
  ]);
  return { mode, items: rows.map(({ shadeVariants, supplierId: _supplierId, ...item }) => ({ ...item, shades: parseStoredFabricShades(shadeVariants) })),
    total, page, pageSize, totalPages: Math.ceil(total / pageSize), collection };
}
