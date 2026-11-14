import { passwordSchema } from "@/lib/policies";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createVerificationToken } from "@/lib/auth";
import { sendVerificationEmail, emailDeliveryConfigured } from "@/lib/email";
import { checkRateLimit, rateKey, requestIdentity } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { firebaseAuthEnabled, firebaseCreateAccount, firebaseSendVerification, FirebaseAuthError } from '@/lib/firebase/authentication';
import { completeFirebaseDeletion } from '@/lib/firebase/deletion';
const registerSchema = z.object({
    email: z.string().trim().max(254).email().toLowerCase(),
    password: passwordSchema,
});
export async function POST(req: NextRequest) {
    try {
        const ip = requestIdentity(req.headers);
        const rl = await checkRateLimit(rateKey("register", ip), 5, 60 * 1000); // 5 per minute
        if (!rl.allowed) {
            return NextResponse.json({ error: "Too many registration attempts. Please wait." }, { status: 429 });
        }
        const body = await req.json();
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const { email, password } = result.data;
        if (!firebaseAuthEnabled() && !emailDeliveryConfigured()) {
            return NextResponse.json({ error: 'Account registration is awaiting organizer email-service setup. Please try again after the service is configured.' }, { status: 503 });
        }
        const existing = await db.user.findUnique({
            where: { email },
        });
        if (existing) {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
        }
        const identity = firebaseAuthEnabled() ? await firebaseCreateAccount(email, password) : null;
        if (identity && await db.firebaseDeletion.findUnique({ where: { id: identity.localId } })) {
            await completeFirebaseDeletion(identity.localId);
            return NextResponse.json({ error: 'Your previous account deletion is still processing. Please try again shortly.' }, { status: 409 });
        }
        const passwordHash = identity ? 'firebase-managed' : await hashPassword(password);
        const user = await db.user.create({
            data: {
                email,
                passwordHash,
                emailVerified: false,
                ...(identity ? { firebaseUid: identity.localId } : {}),
            },
        });
        if (identity) await firebaseSendVerification(identity.idToken);
        else await sendVerificationEmail(email, await createVerificationToken(user.id));
        await logAuditEvent({
            userId: user.id,
            action: "USER_REGISTERED",
            entityType: "User",
            entityId: user.id,
            ipAddress: ip,
        });
        return NextResponse.json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
            userId: user.id,
        });
    }
    catch (error: any) {
        if (error instanceof FirebaseAuthError) {
            const status = error.code === 'EMAIL_EXISTS' ? 409 : error.status === 429 ? 429 : 503;
            return NextResponse.json({ error: 'Account creation could not finish. Try signing in to recover an existing account, or retry shortly.' }, { status });
        }
        console.error("Register error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
