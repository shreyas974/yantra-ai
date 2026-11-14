import { firebaseAuthEnabled } from '@/lib/firebase/authentication';
import { queueNotice } from "@/lib/notifications";
import { transaction, lockTeam } from "@/lib/transactions";
import { assertTransition } from "@/lib/policies";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q") || "";
    const whereClause: any = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
        whereClause.status = status;
    }
    if (query) {
        whereClause.OR = [
            { registrationId: { contains: query, mode: "insensitive" } },
            { team: { name: { contains: query, mode: "insensitive" } } },
            { submittedBy: { email: { contains: query, mode: "insensitive" } } },
        ];
    }
    const submissions = await db.registrationSubmission.findMany({
        where: whereClause,
        include: {
            team: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    emailVerified: true,
                                    profile: true,
                                },
                            },
                        },
                    },
                },
            },
            submittedBy: {
                select: { id: true, email: true },
            },
        },
        orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json({ submissions });
}
const updateStatusSchema = z.object({
    submissionId: z.string().min(1),
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectionReason: z.string().optional().nullable(),
});
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const result = updateStatusSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const { submissionId, status, rejectionReason } = result.data;
        if (status === 'REJECTED' && !rejectionReason?.trim())
            return NextResponse.json({ error: 'Provide a rejection reason.' }, { status: 400 });
        const submission = await transaction(async (tx) => {
            const before = await tx.registrationSubmission.findUniqueOrThrow({ where: { id: submissionId } });
            await lockTeam(tx, before.teamId);
            const current = await tx.registrationSubmission.findUniqueOrThrow({ where: { id: submissionId } });
            assertTransition(current.status, status);
            const updated = await tx.registrationSubmission.update({ where: { id: submissionId }, data: { status, rejectionReason: status === 'REJECTED' ? rejectionReason : null, reviewedAt: new Date(), reviewedById: user.id } });
            const members = await tx.teamMember.findMany({ where: { teamId: current.teamId } });
            await tx.notification.createMany({ data: members.map(m => ({ userId: m.userId, title: `Registration ${status.toLowerCase()}`, message: `${current.registrationId}: ${rejectionReason || 'Your registration has been approved.'}` })) });
            return updated;
        });
        const members = await db.teamMember.findMany({ where: { teamId: submission.teamId }, include: { user: true } });
        if (!firebaseAuthEnabled()) await Promise.all(members.map(m => queueNotice(m.user.email, `Registration ${status.toLowerCase()}`, `${submission.registrationId}: ${rejectionReason || 'Your registration has been approved.'}`)));
        await logAuditEvent({
            userId: user.id,
            action: `REGISTRATION_${status}`,
            entityType: "RegistrationSubmission",
            entityId: submission.id,
            details: { status, rejectionReason },
        });
        return NextResponse.json({ success: true, submission });
    }
    catch (error: any) {
        console.error("Admin registration update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
