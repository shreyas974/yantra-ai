import { checkRateLimit, rateKey, requestIdentity } from "@/lib/rate-limit";
import { digestToken } from "@/lib/auth";
import { queueNotice } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
export async function POST(req: NextRequest) {
    try {
        if (!(await checkRateLimit(rateKey("verify-email", requestIdentity(req.headers)), 10, 60000)).allowed)
            return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
        const body = await req.json();
        const { token } = body;
        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Token is required." }, { status: 400 });
        }
        const record = await db.verificationToken.findUnique({
            where: { token: digestToken(token) },
            include: { user: true },
        });
        if (!record) {
            return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
        }
        if (record.usedAt) {
            return NextResponse.json({ error: "This verification token has already been used." }, { status: 400 });
        }
        if (record.expiresAt < new Date()) {
            return NextResponse.json({ error: "This verification token has expired." }, { status: 400 });
        }
        await db.transaction(async (tx) => {
            const claim = await tx.verificationToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
            if (claim.count !== 1)
                throw new Error("Token already consumed");
            await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
        });
        await queueNotice(record.user.email, "Welcome to YANTRA AI", "Your email is verified. Complete your profile and create or join a team.");
        await logAuditEvent({
            userId: record.userId,
            action: "EMAIL_VERIFIED",
            entityType: "User",
            entityId: record.userId,
        });
        return NextResponse.json({
            success: true,
            message: "Email verified successfully! You can now access full registration features.",
        });
    }
    catch (error: any) {
        console.error("Verify email error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
