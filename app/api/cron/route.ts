import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { deliverNotice } from '@/lib/notifications';
import { firebaseAuthEnabled } from '@/lib/firebase/authentication';
import { completeFirebaseDeletion } from '@/lib/firebase/deletion';
export async function POST(req: NextRequest) {
    const expected = process.env.CRON_SECRET;
    const token = req.headers.get('authorization')?.replace(/^Bearer /, '') || '';
    if (!expected || Buffer.byteLength(token) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected)))
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const pending = await db.emailOutbox.findMany({ where: { deliveredAt: null, attempts: { lt: 5 } }, take: 25 });
    for (const row of pending)
        await deliverNotice(row.id);
    if (firebaseAuthEnabled()) {
        const deletions = await db.firebaseDeletion.findMany({ take: 25 });
        for (const row of deletions) await completeFirebaseDeletion(row.id);
    }
    // Keep cleanup below Firestore transaction and IN-query limits.
    const now = new Date();
    const buckets = await db.rateLimitBucket.findMany({ where: { resetAt: { lt: now } }, take: 25 });
    const sessions = await db.session.findMany({ where: { expiresAt: { lt: now } }, take: 25 });
    if (buckets.length) await db.rateLimitBucket.deleteMany({ where: { id: { in: buckets.map(row => row.id) }, resetAt: { lt: now } } });
    if (sessions.length) await db.session.deleteMany({ where: { id: { in: sessions.map(row => row.id) }, expiresAt: { lt: now } } });
    return NextResponse.json({ success: true, processed: pending.length });
}
export const GET = POST;
