import { GET as storage } from '@/app/api/admin/storage/route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const currentUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth', () => ({ getCurrentUser: currentUser }));
import { GET as announcements } from '@/app/api/admin/announcements/route';
import { GET as problems } from '@/app/api/admin/problem-statements/route';
import { GET as metrics } from '@/app/api/admin/metrics/route';
import { GET as exports } from '@/app/api/admin/export/route';
import { GET as participants } from '@/app/api/admin/participants/route';
import { GET as teams } from '@/app/api/admin/teams/route';
import { middleware } from '@/middleware';
beforeEach(() => { currentUser.mockReset(); });
describe('Administrator authorization', () => {
    for (const [label, handler] of Object.entries({ announcements, problems, metrics, exports, participants, teams, storage })) {
        it(`blocks anonymous and participant reads of ${label}`, async () => {
            const req = new NextRequest(`http://localhost/api/admin/${label}`);
            currentUser.mockResolvedValue(null);
            expect((await handler(req)).status).toBe(403);
            currentUser.mockResolvedValue({ id: 'participant', role: 'USER' });
            expect((await handler(req)).status).toBe(403);
        });
    }
});
describe('API request protection', () => {
    it('rejects cross-origin mutations', () => { process.env.APP_URL = 'https://chad.example'; const req = new NextRequest('https://chad.example/api/team', { method: 'POST', headers: { origin: 'https://attacker.example', 'content-type': 'application/json' }, body: '{}' }); expect(middleware(req).status).toBe(403); });
    it('rejects form-encoded mutations', () => { process.env.APP_URL = 'https://chad.example'; const req = new NextRequest('https://chad.example/api/team', { method: 'POST', headers: { origin: 'https://chad.example', 'content-type': 'application/x-www-form-urlencoded' }, body: 'name=bad' }); expect(middleware(req).status).toBe(415); });
    it('permits same-origin JSON', () => { process.env.APP_URL = 'https://chad.example'; const req = new NextRequest('https://chad.example/api/team', { method: 'POST', headers: { origin: 'https://chad.example', 'content-type': 'application/json' }, body: '{}' }); expect(middleware(req).status).toBe(200); });
});
