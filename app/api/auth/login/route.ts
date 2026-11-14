import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie, synchronizeFirebaseAccount } from "@/lib/auth";
import { checkRateLimit, rateKey, requestIdentity } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { firebasePasswordSignIn, firebaseGetAccount, FIREBASE_SESSION_SECONDS, FirebaseAuthError } from '@/lib/firebase/authentication';
const loginSchema = z.object({
    email: z.string().trim().max(254).email().toLowerCase(),
    password: z.string().min(1, "Password is required").max(72),
});
export async function POST(req: NextRequest) {
    try {
        const ip = requestIdentity(req.headers);
        const userAgent = req.headers.get("user-agent") || undefined;
        const rl = await checkRateLimit(rateKey("login", ip), 10, 60 * 1000); // 10 per minute
        if (!rl.allowed) {
            return NextResponse.json({ error: "Too many login attempts. Please wait." }, { status: 429 });
        }
        const body = await req.json();
        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const { email, password } = result.data;
        let user = await db.user.findUnique({
            where: { email },
        });
        if (!user) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        const identity = user.firebaseUid ? await firebasePasswordSignIn(email, password) : null;
        const valid = identity ? identity.localId === user.firebaseUid : await verifyPassword(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }
        if (identity) {
            const account = await firebaseGetAccount(identity.localId);
            user = { ...user, ...await synchronizeFirebaseAccount(user.id, account) };
        }
        const token = await createSession(user.id, userAgent, ip, identity?.idToken);
        await setSessionCookie(token, identity ? FIREBASE_SESSION_SECONDS : undefined);
        await logAuditEvent({
            userId: user.id,
            action: "USER_LOGGED_IN",
            entityType: "User",
            entityId: user.id,
            ipAddress: ip,
        });
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
            },
        });
    }
    catch (error: any) {
        if (error instanceof FirebaseAuthError && error.status < 500) {
            return NextResponse.json({ error: 'Invalid email or password, or the account is unavailable.' }, { status: error.status === 429 ? 429 : 401 });
        }
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
