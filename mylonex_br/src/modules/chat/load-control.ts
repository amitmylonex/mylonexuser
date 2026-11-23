import { BuyerAccessError } from '../auth/access-error.js';

// Per-process admission control; multi-replica deployments also need a shared gateway quota.
export function createChatLoadControl(maxActive = 8) {
  const windows = new Map<string, { count: number; until: number }>();
  const active = new Set<string>();
  return function enter(userId: string, now = Date.now()) {
    if (active.has(userId)) throw new BuyerAccessError(409, 'Wait for your current reply to finish.');
    if (active.size >= maxActive) throw new BuyerAccessError(503, 'The assistant is busy. Please try again shortly.');
    for (const [id, window] of windows) if (window.until <= now) windows.delete(id);
    const window = windows.get(userId) ?? { count: 0, until: now + 60000 };
    if (window.count >= 10 || (!windows.has(userId) && windows.size >= 10000)) {
      throw new BuyerAccessError(429, 'Too many messages. Please wait a minute.');
    }
    window.count++;
    windows.set(userId, window);
    active.add(userId);
    return () => { active.delete(userId); };
  };
}
