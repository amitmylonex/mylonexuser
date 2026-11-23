import type { PrismaClient, Prisma } from '@prisma/client';
import { BuyerAccessError } from '../auth/access-error.js';

const summary = { id: true, title: true, createdAt: true, updatedAt: true } as const;
const messageFields = { id: true, role: true, content: true, metadata: true, createdAt: true } as const;

export function chatRepository(db: PrismaClient, userId: string) {
  async function owned(id: string) {
    const row = await db.conversation.findFirst({ where: { id, userId }, select: summary });
    if (!row) throw new BuyerAccessError(404, 'Conversation not found.');
    return row;
  }
  return {
    owned,
    async list(before?: string) {
      const cursor = before ? await owned(before) : null;
      const rows = await db.conversation.findMany({
        where: { userId, ...(cursor ? { OR: [{ updatedAt: { lt: cursor.updatedAt } }, { updatedAt: cursor.updatedAt, id: { lt: cursor.id } }] } : {}) },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], take: 31, select: summary,
      });
      return { conversations: rows.slice(0, 30), next: rows.length > 30 ? rows[29].id : null };
    },
    async messages(id: string, before?: string) {
      const conversation = await owned(id);
      const cursor = before ? await db.message.findFirst({ where: { id: before, conversationId: id }, select: { id: true, createdAt: true } }) : null;
      if (before && !cursor) throw new BuyerAccessError(404, 'Message not found.');
      const rows = await db.message.findMany({
        where: { conversationId: id, ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}) },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 31, select: messageFields,
      });
      return { conversation, messages: rows.slice(0, 30).reverse(), next: rows.length > 30 ? rows[29].id : null };
    },
    async save(id: string | undefined, text: string, content: string, metadata: Prisma.InputJsonObject, expectedUpdatedAt?: Date) {
      return db.$transaction(async tx => {
        // Recheck ownership inside the short write transaction; AI runs outside it.
        if (id && !await tx.conversation.findFirst({ where: { id, userId }, select: { id: true } })) {
          throw new BuyerAccessError(404, 'Conversation not found.');
        }
        if (id && expectedUpdatedAt) {
          const claim = await tx.conversation.updateMany({ where: { id, userId, updatedAt: expectedUpdatedAt }, data: { updatedAt: new Date() } });
          if (!claim.count) throw new BuyerAccessError(409, 'This conversation changed. Reopen it before sending again.');
        }
        const conversation = id
          ? await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() }, select: summary })
          : await tx.conversation.create({ data: { userId, title: text.slice(0, 70) }, select: summary });
        // PostgreSQL now() is constant within a transaction. Explicit times preserve turn order.
        const sentAt = new Date();
        const userMessage = await tx.message.create({ data: { conversationId: conversation.id, role: 'user', content: text, createdAt: sentAt }, select: messageFields });
        const message = await tx.message.create({ data: { conversationId: conversation.id, role: 'assistant', content, metadata, createdAt: new Date(sentAt.getTime() + 1) }, select: messageFields });
        return { conversation, userMessage, message };
      });
    },
    async remove(id: string) {
      const removed = await db.conversation.deleteMany({ where: { id, userId } });
      if (!removed.count) throw new BuyerAccessError(404, 'Conversation not found.');
      return { ok: true };
    },
  };
}
