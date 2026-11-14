import { describe, it, expect, vi } from 'vitest';
const state = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { transaction: (work: any) => work({ rateLimitBucket: state }) } }));
import { checkRateLimit, rateKey, requestIdentity } from '@/lib/rate-limit';
describe('Shared database rate limiter', () => {
    it('uses the database count across requests and rejects excess attempts', async () => {
        state.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ count: 2, resetAt: new Date(Date.now() + 60000) });
        expect(await checkRateLimit('test', 2, 60000)).toEqual({ allowed: true, remaining: 1 });
        expect(await checkRateLimit('test', 2, 60000)).toEqual({ allowed: false, remaining: 0 });
    });
    it('resets expired buckets', async () => {
        state.findUnique.mockResolvedValueOnce({ count: 99, resetAt: new Date(0) });
        expect(await checkRateLimit('expired', 2, 60000)).toEqual({ allowed: true, remaining: 1 });
        expect(state.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ update: expect.objectContaining({ count: 1, resetAt: expect.any(Date) }) }));
    });
    it('does not retain raw identities in bucket keys', () => { expect(rateKey('login', 'person@example.com')).not.toContain('person@'); });
    it('ignores forged proxy headers unless explicitly trusted', () => { process.env.TRUST_PROXY = 'false'; expect(requestIdentity(new Headers({ 'x-forwarded-for': 'forged' }))).toBe('shared-untrusted-proxy'); });
});
