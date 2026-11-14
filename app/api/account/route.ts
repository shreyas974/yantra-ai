import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword, clearSessionCookie } from '@/lib/auth';
import { transaction, lockTeam } from '@/lib/transactions';
import { checkRateLimit, rateKey } from '@/lib/rate-limit';
import { firebasePasswordSignIn } from '@/lib/firebase/authentication';
import { completeFirebaseDeletion } from '@/lib/firebase/deletion';
export async function DELETE(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await checkRateLimit(rateKey('delete', user.id), 5, 3600000)).allowed)
        return NextResponse.json({ error: 'Try again later.' }, { status: 429 });
    const { password, confirm } = await req.json();
    if (confirm !== 'DELETE' || typeof password !== 'string' || !password || password.length > 72)
        return NextResponse.json({ error: 'Confirm DELETE and provide your password.' }, { status: 400 });
    try {
        const valid = user.firebaseUid
            ? (await firebasePasswordSignIn(user.email, password)).localId === user.firebaseUid
            : await verifyPassword(password, user.passwordHash);
        if (!valid) throw new Error('Invalid password');
    } catch {
        return NextResponse.json({ error: 'Confirm DELETE and provide your password.' }, { status: 400 });
    }
    try {
        await transaction(async (tx) => {
            const membership = await tx.teamMember.findUnique({ where: { userId: user.id } });
            if (membership) {
                await lockTeam(tx, membership.teamId);
                throw new Error('Leave your team first. Contact organizers if the roster is locked.');
            }
            if (user.firebaseUid) await tx.firebaseDeletion.create({ data: { id: user.firebaseUid } });
            await tx.user.delete({ where: { id: user.id } });
        });
        if (user.firebaseUid) await completeFirebaseDeletion(user.firebaseUid);
        await clearSessionCookie();
        return NextResponse.json({ success: true });
    }
    catch {
        return NextResponse.json({ error: 'Leave your team first. Contact organizers if the roster is locked.' }, { status: 409 });
    }
}
