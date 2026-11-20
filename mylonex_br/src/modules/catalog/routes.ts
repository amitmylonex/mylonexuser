import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { databaseErrorDetails } from '../../infrastructure/database-error.js';

export function registerHomeCatalog(app: FastifyInstance, db: PrismaClient | null) {
  app.get('/api/v1/public/featured-fabrics', async (request, reply) => {
    if (!db) return { items: [] };
    try {
      // Match the legacy homepage: newest active listings from approved suppliers, six at most.
      const items = await db.$queryRaw`
        SELECT c.id, c.mylonex_code AS "mylonexCode", c.fabric_name AS "fabricName",
               c.fabric_type::text AS "fabricType", c.composition_text AS "compositionText",
               c.gsm, c.width_inches::text AS "widthInches", c.weave_type AS "weaveType",
               c.production_cycle::text AS "productionCycle", c.price_per_meter::text AS "pricePerMeter",
               c.minimum_order_quantity AS "minimumOrderQuantity", c.lead_time_days AS "leadTimeDays",
               c.city, c.image_urls AS "imageUrls", c.material_purity AS "materialPurity",
               json_build_object('companyName', s."companyName", 'city', s.city) AS supplier
        FROM supplier_catalog AS c
        JOIN "SupplierProfile" AS s ON c.supplier_id = s.id
        WHERE c.is_active AND s.status = 'APPROVED'
        ORDER BY c.created_at DESC
        LIMIT 6
      `;
      return { items };
    } catch (error) {
      request.log.warn(databaseErrorDetails(error), 'Public fabric preview unavailable');
      return reply.code(503).send({ message: 'Public fabric preview unavailable.' });
    }
  });
}
