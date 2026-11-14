import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createPasswordResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, rateKey, requestIdentity } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { firebaseSendPasswordReset } from '@/lib/firebase/authentication';
const schema = z.object({
    email: z.string().trim().max(254).email().toLowerCase(),
});
export async function POST(req: NextRequest) {
    try {
        const ip = requestIdentity(req.headers);
        const rl = await checkRateLimit(rateKey("forgot", ip), 3, 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json({ error: "Too many reset attempts. Please wait." }, { status: 429 });
        }
        const body = await req.json();
        const result = schema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
        }
        const { email } = result.data;
        const user = await db.user.findUnique({ where: { email } });
        if (user) {
            if (user.firebaseUid) await firebaseSendPasswordReset(email);
            else await sendPasswordResetEmail(email, await createPasswordResetToken(user.id));
            await logAuditEvent({
                userId: user.id,
                action: "PASSWORD_RESET_REQUESTED",
                entityType: "User",
                entityId: user.id,
                ipAddress: ip,
            });
        }
        return NextResponse.json({
            success: true,
            message: "If that email exists in our records, password reset instructions have been sent.",
        });
    }
    catch (error: any) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
