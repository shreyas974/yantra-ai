import { z } from 'zod';
export const safeUrl = z.string().max(2048).url().refine(v => ['https:', 'http:'].includes(new URL(v).protocol), 'Use an HTTP or HTTPS URL');
export const passwordSchema = z.string().min(12, 'Use at least 12 characters').max(72, 'Use at most 72 characters').refine(v => new TextEncoder().encode(v).length <= 72, 'Password must be at most 72 bytes');
export function activeToken(token: {
    usedAt: Date | null;
    expiresAt: Date;
}, now = new Date()) {
    return !token.usedAt && token.expiresAt.getTime() > now.getTime();
}
export function assertDeadline(value: string | undefined, required = false, now = new Date()) {
    if (!value || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) {
        if (required)
            throw new Error('Organizers must configure an official deadline with a timezone.');
        return;
    }
    if (Date.parse(value) <= now.getTime())
        throw new Error('The deadline has passed.');
}
export function assertTeamSize(size: number, min: number, max: number, solo: boolean, allowSolo: boolean) {
    if (solo && !allowSolo)
        throw new Error('Solo participation is disabled.');
    if (solo && size !== 1)
        throw new Error('Solo entries must contain one participant.');
    if (size < (solo && allowSolo ? 1 : min) || size > max)
        throw new Error(`Team size must be between ${min} and ${max}.`);
}
export function assertEditable(status: string | undefined, deadline?: string) {
    if (status === 'PENDING' || status === 'APPROVED')
        throw new Error('Team roster is locked while registration is pending or approved.');
    assertDeadline(deadline);
}
export function assertTransition(from: string, to: string) {
    if (from !== 'PENDING' || !['APPROVED', 'REJECTED'].includes(to))
        throw new Error('Only pending registrations can be reviewed.');
}
