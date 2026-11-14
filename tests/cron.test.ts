import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ notices: vi.fn(), buckets: vi.fn(), sessions: vi.fn(), deleteBuckets: vi.fn(), deleteSessions: vi.fn(), deliver: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  emailOutbox: { findMany: state.notices },
  rateLimitBucket: { findMany: state.buckets, deleteMany: state.deleteBuckets },
  session: { findMany: state.sessions, deleteMany: state.deleteSessions },
} }));
vi.mock('@/lib/notifications', () => ({ deliverNotice: state.deliver }));
import { POST } from '@/app/api/cron/route';
const req = (token: string) => new NextRequest('http://localhost/api/cron', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('CRON_SECRET', 'secret'); state.notices.mockResolvedValue([]); state.buckets.mockResolvedValue([]); state.sessions.mockResolvedValue([]); });
describe('Outbox maintenance', () => {
  it('rejects malformed multibyte bearer tokens without throwing', async () => {
    expect((await POST(req('éééééé'))).status).toBe(401);
    expect(state.notices).not.toHaveBeenCalled();
  });
  it('keeps cleanup bounded and rechecks expiration when deleting', async () => {
    state.notices.mockResolvedValue([{ id: 'notice' }]);
    state.buckets.mockResolvedValue([{ id: 'bucket' }]); state.sessions.mockResolvedValue([{ id: 'session' }]);
    expect((await POST(req('secret'))).status).toBe(200);
    expect(state.deliver).toHaveBeenCalledWith('notice');
    expect(state.sessions).toHaveBeenCalledWith(expect.objectContaining({ take: 25 }));
    expect(state.deleteSessions).toHaveBeenCalledWith({ where: { id: { in: ['session'] }, expiresAt: { lt: expect.any(Date) } } });
    expect(state.deleteBuckets).toHaveBeenCalledWith({ where: { id: { in: ['bucket'] }, resetAt: { lt: expect.any(Date) } } });
  });
});
