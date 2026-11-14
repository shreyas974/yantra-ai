import { checkRateLimit, rateKey, requestIdentity } from "@/lib/rate-limit";
import { digestToken } from "@/lib/auth";
import { queueNotice } from "@/lib/notifications";
import { passwordSchema } from "@/lib/policies";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, revokeAllUserSessions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
const schema = z.object({
    token: z.string().min(1),
    password: passwordSchema,
});
export async function POST(req: NextRequest) {
    try {
        if (!(await checkRateLimit(rateKey("reset-password", requestIdentity(req.headers)), 10, 60000)).allowed)
            return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
        const body = await req.json();
        const result = schema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const { token, password } = result.data;
        const record = await db.passwordResetToken.findUnique({
            where: { token: digestToken(token) },
            include: { user: true },
        });
        if (!record || record.usedAt || record.expiresAt < new Date()) {
            return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
        }
        const newHash = await hashPassword(password);
        await db.transaction(async (tx) => {
            const claim = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
            if (claim.count !== 1)
                throw new Error("Token already consumed");
            await tx.user.update({ where: { id: record.userId }, data: { passwordHash: newHash } });
            await tx.session.deleteMany({ where: { userId: record.userId } });
            await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } });
        });
        await logAuditEvent({
            userId: record.userId,
            action: "PASSWORD_RESET_COMPLETED",
            entityType: "User",
            entityId: record.userId,
        });
        return NextResponse.json({
            success: true,
            message: "Password reset successful. All active sessions have been revoked. Please log in with your new password.",
        });
    }
    catch (error: any) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
