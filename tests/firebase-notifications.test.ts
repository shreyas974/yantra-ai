import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
    user: vi.fn(), notify: vi.fn(), outbox: vi.fn(), send: vi.fn(), remove: vi.fn(), providerDelete: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: {
    user: { findUnique: state.user }, notification: { create: state.notify },
    emailOutbox: { create: state.outbox }, firebaseDeletion: { deleteMany: state.remove },
} }));
vi.mock('@/lib/email', () => ({ sendEmail: state.send, escapeHtml: (value: string) => value }));
vi.mock('@/lib/firebase/authentication', () => ({
    firebaseAuthEnabled: () => true, firebaseDeleteAccount: state.providerDelete,
}));
import { queueNotice } from '@/lib/notifications';
import { completeFirebaseDeletion } from '@/lib/firebase/deletion';
beforeEach(() => { vi.resetAllMocks(); });

it('persists event notices in the account without an external email provider', async () => {
    state.user.mockResolvedValue({ id: 'student' });
    await queueNotice('Student@Example.invalid', 'Registration submitted', 'Your entry is pending review.');
    expect(state.user).toHaveBeenCalledWith({ where: { email: 'student@example.invalid' } });
    expect(state.notify).toHaveBeenCalledWith({ data: { userId: 'student', title: 'Registration submitted', message: 'Your entry is pending review.' } });
    expect(state.outbox).not.toHaveBeenCalled();
    expect(state.send).not.toHaveBeenCalled();
});

it('retains the durable deletion job when the provider is unavailable', async () => {
    state.providerDelete.mockRejectedValue(new Error('Unavailable'));
    expect(await completeFirebaseDeletion('uid')).toBe(false);
    expect(state.remove).not.toHaveBeenCalled();
});

it('removes the retry job only after provider deletion succeeds', async () => {
    state.providerDelete.mockResolvedValue(undefined);
    expect(await completeFirebaseDeletion('uid')).toBe(true);
    expect(state.remove).toHaveBeenCalledWith({ where: { id: 'uid' } });
});
