import { NextResponse } from 'next/server';
import { getCurrentUser, createVerificationToken } from '@/lib/auth';
import { checkRateLimit, rateKey } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';
import { firebasePasswordSignIn, firebaseSendVerification } from '@/lib/firebase/authentication';
export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.emailVerified)
        return NextResponse.json({ success: true });
    if (!(await checkRateLimit(rateKey('verify', user.id), 3, 3600000)).allowed)
        return NextResponse.json({ error: 'Please wait before requesting another email.' }, { status: 429 });
    if (user.firebaseUid) {
        const body = await req.json().catch(() => ({}));
        if (typeof body.password !== 'string' || !body.password || body.password.length > 72) return NextResponse.json({ error: 'Enter your current password to request a new verification email.' }, { status: 400 });
        try {
            const identity = await firebasePasswordSignIn(user.email, body.password);
            if (identity.localId !== user.firebaseUid) throw new Error('Account mismatch');
            await firebaseSendVerification(identity.idToken);
        } catch {
            return NextResponse.json({ error: 'Check your password and try again.' }, { status: 400 });
        }
    } else await sendVerificationEmail(user.email, await createVerificationToken(user.id));
    return NextResponse.json({ success: true });
}
