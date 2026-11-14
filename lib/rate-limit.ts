import crypto from 'node:crypto';
import { db } from './db';
export function rateKey(scope: string, identity: string) { return `${scope}:${crypto.createHash('sha256').update(identity).digest('hex')}`; }
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  const count = await db.transaction(async tx => {
    const now = new Date();
    const row = await tx.rateLimitBucket.findUnique({ where: { key } });
    const expired = !row || row.resetAt <= now;
    const count = expired ? 1 : row.count + 1;
    await tx.rateLimitBucket.upsert({ where: { key }, create: { key, count, resetAt: new Date(now.getTime() + windowMs) }, update: { count, ...(expired ? { resetAt: new Date(now.getTime() + windowMs) } : {}) } });
    return count;
  });
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
export function requestIdentity(headers: Headers) { return process.env.TRUST_PROXY === 'true' ? headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown' : 'shared-untrusted-proxy'; }
