import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const record = await prisma.verificationToken.findUnique({
      where: { token },
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

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
    ]);

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
  } catch (error: any) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
