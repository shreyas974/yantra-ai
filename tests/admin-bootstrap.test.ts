import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: vi.fn(), config: vi.fn(), marker: vi.fn(), audit: vi.fn(), update: vi.fn(), notice: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { transaction: async (callback: (tx: unknown) => unknown) => callback({
    user: { findUniqueOrThrow: state.user, update: state.update },
    eventConfig: { findUnique: state.config, create: state.marker },
    auditLog: { create: state.audit }, notification: { create: state.notice },
}) } }));
import { synchronizeFirebaseAccount } from '@/lib/auth';
const email = 'organizer@example.invalid';
beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('INITIAL_ADMIN_EMAIL', 'first@example.invalid');
    vi.stubEnv('ADMIN_EMAILS', email);
    state.user.mockResolvedValue({ id: 'user', firebaseUid: 'uid', email, emailVerified: false, role: 'USER' });
    state.config.mockResolvedValue(null);
});
it('grants an explicitly approved organizer after authoritative email verification', async () => {
    expect((await synchronizeFirebaseAccount('user', { localId: 'uid', email, emailVerified: true })).role).toBe('ADMIN');
    expect(state.marker).toHaveBeenCalledOnce();
    expect(state.audit).toHaveBeenCalledOnce();
});
it('keeps an unverified approved email as a participant', async () => {
    expect((await synchronizeFirebaseAccount('user', { localId: 'uid', email, emailVerified: false })).role).toBe('USER');
    expect(state.marker).not.toHaveBeenCalled();
});
it('does not re-promote an account after its one-time grant has been consumed', async () => {
    state.config.mockResolvedValue({ value: 'user' });
    expect((await synchronizeFirebaseAccount('user', { localId: 'uid', email, emailVerified: true })).role).toBe('USER');
    expect(state.audit).not.toHaveBeenCalled();
});
it('rejects a provider identity mismatch before granting access', async () => {
    await expect(synchronizeFirebaseAccount('user', { localId: 'different-uid', email, emailVerified: true })).rejects.toThrow('mismatch');
    expect(state.marker).not.toHaveBeenCalled();
});
it('keeps unapproved verified users as participants', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    expect((await synchronizeFirebaseAccount('user', { localId: 'uid', email, emailVerified: true })).role).toBe('USER');
    expect(state.marker).not.toHaveBeenCalled();
});
