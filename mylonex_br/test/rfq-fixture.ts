import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

export async function seedRfqFixture(db: PrismaClient) {
  const ids = { buyer: randomUUID(), supplier: randomUUID(), other: randomUUID(), admin: randomUUID() };
  const roles = { buyer: 'BUYER', supplier: 'SUPPLIER', other: 'SUPPLIER', admin: 'ADMIN' } as const;
  for (const name of Object.keys(ids) as Array<keyof typeof ids>) {
    await db.user.create({ data: { id: ids[name], email: name + '@rfq.example', role: roles[name],
      ...(name === 'buyer' ? { buyerProfile: { create: {} } } : {}) } });
  }
  const supplier = await db.supplierProfile.create({
    data: { userId: ids.supplier, companyName: 'Fixture Mill', status: 'APPROVED' },
  });
  await db.supplierProfile.create({
    data: { userId: ids.other, companyName: 'Unrelated Mill', status: 'APPROVED' },
  });
  const fabric = await db.$queryRaw<Array<{id: string}>>`
    INSERT INTO supplier_catalog (id, supplier_id, fabric_name, price_per_meter, minimum_order_quantity, updated_at)
    VALUES (${randomUUID()}, ${supplier.id}, 'Fixture Twill', 50, 100, now())
    RETURNING id
  `;
  return { ids, roles, fabricId: fabric[0].id };
}
