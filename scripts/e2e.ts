import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { db } from '../lib/db';
import { hashPassword } from '../lib/auth';
if (process.env.YANTRA_INTEGRATION !== 'true' || process.env.FIRESTORE_NAMESPACE !== 'yantra_test' || !process.env.FIREBASE_PROJECT_ID?.startsWith('demo-') || !/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || ''))
    throw Error('Dedicated Firebase test emulator namespace required.');
const port = Number(process.env.E2E_PORT || 3107), base = `http://localhost:${port}`, suffix = crypto.randomBytes(6).toString('hex'), password = crypto.randomBytes(20).toString('hex');
const users: string[] = [], teamIds: string[] = [];
const server = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '--port', String(port)], { env: { ...process.env, APP_URL: base, EMAIL_MODE: 'file' }, stdio: 'inherit' });
async function request(path: string, body?: object, cookie?: string, method = body ? 'POST' : 'GET') { const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', Origin: base, ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); const d = await r.json(); return { r, d }; }
async function ok(path: string, body?: object, cookie?: string, method?: string) { const result = await request(path, body, cookie, method); assert.ok(result.r.ok, `${path}: ${JSON.stringify(result.d)}`); return result; }
async function account(label: string) { const email = `e2e-${label}-${suffix}@example.invalid`; await ok('/api/auth/register', { email, password }); const user = await db.user.findUniqueOrThrow({ where: { email } }); users.push(user.id); const files = await readdir('work/mail'); let token = ''; for (const f of files) {
    const mail = JSON.parse(await readFile(`work/mail/${f}`, 'utf8'));
    if (mail.to === email && mail.metadata?.type === 'verification')
        token = mail.metadata.token;
} assert.ok(token); await ok('/api/auth/verify-email', { token }); assert.equal((await request('/api/auth/verify-email', { token })).r.status, 400); const { r } = await ok('/api/auth/login', { email, password }); const cookie = r.headers.get('set-cookie')!.split(';')[0]; await ok('/api/profile', { fullName: `E2E ${label}`, collegeOrg: 'Test organization', cityState: 'Test city / state', skills: 'TypeScript', aiExperience: 'Beginner', privacyConsent: true, rulesAccepted: true }, cookie); return { email, id: user.id, cookie }; }
try {
    for (let i = 0; i < 90; i++) {
        try {
            if ((await fetch(base + '/login')).ok)
                break;
        }
        catch { }
        if (i === 89)
            throw Error('Server startup timed out');
        await new Promise(r => setTimeout(r, 500));
    }
    for (const [key, value] of Object.entries({ max_team_size: '4', min_team_size: '2', allow_solo: 'false', registration_open: 'true', registration_deadline: new Date(Date.now() + 3600000).toISOString(), team_editing_deadline: '', rules_published: 'true', rules_version: 'e2e-1', registration_prefix: 'CHAD-E2E' }))
        await db.eventConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
    const a = await account('leader'), b = await account('member');
    assert.equal((await request('/api/admin/announcements', undefined, a.cookie)).r.status, 403);
    const created = await ok('/api/team', { name: `E2E ${suffix}`, isSolo: false }, a.cookie);
    teamIds.push(created.d.team.id);
    const invited = await ok('/api/team/invite', { email: b.email }, a.cookie);
    await ok('/api/team/join', { token: invited.d.token }, b.cookie);
    await ok('/api/team/manage', { action: 'transfer_leader', targetUserId: b.id }, a.cookie);
    await ok('/api/team/manage', { action: 'transfer_leader', targetUserId: a.id }, b.cookie);
    const submitted = await ok('/api/registration/submit', {}, a.cookie);
    assert.equal(submitted.d.submission.status, 'PENDING');
    assert.equal((await request('/api/team/leave', {}, b.cookie)).r.status, 400);
    const admin = await db.user.create({ data: { email: `e2e-admin-${suffix}@example.invalid`, passwordHash: await hashPassword(password), emailVerified: true, role: 'ADMIN' } });
    users.push(admin.id);
    const login = await ok('/api/auth/login', { email: admin.email, password });
    const adminCookie = login.r.headers.get('set-cookie')!.split(';')[0];
    await ok('/api/admin/registrations', { submissionId: submitted.d.submission.id, status: 'APPROVED' }, adminCookie);
    await ok('/api/admin/announcements', { title: 'Test run notice', content: 'Temporary automated verification notice', status: 'DRAFT' }, adminCookie);
    const notices = await ok('/api/notifications', undefined, a.cookie);
    assert.ok(notices.d.notifications.some((n: any) => n.title === 'Registration approved'));
    const dashboard = await fetch(base + '/dashboard', { headers: { Cookie: a.cookie } });
    assert.equal(dashboard.status, 200);
    assert.ok((await dashboard.text()).includes(submitted.d.submission.registrationId));
    await ok('/api/auth/logout', {}, a.cookie);
    assert.equal((await request('/api/profile', undefined, a.cookie)).r.status, 401);
    await ok('/api/auth/login', { email: a.email, password });
    assert.equal(await db.problemStatement.count(), 0);
    console.log('PASS: register → verify → profile → team → invite → join → transfer → submit → admin approval → dashboard → logout/login.');
}
finally {
    server.kill('SIGTERM');
    await db.announcement.deleteMany({ where: { title: 'Test run notice', status: 'DRAFT' } });
    await db.team.deleteMany({ where: { id: { in: teamIds } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.disconnect();
}
