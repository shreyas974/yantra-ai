import { firebaseAuthEnabled } from '@/lib/firebase/authentication';
import { queueNotice } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
const announcementSchema = z.object({
    id: z.string().optional(),
    sendEmail: z.boolean().default(false),
    title: z.string().min(3).max(200),
    content: z.string().min(5).max(20000),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
    scheduledFor: z.string().optional().nullable(),
});
export async function GET() {
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const announcements = await db.announcement.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcements });
}
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const result = announcementSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }
        const { title, content, status, scheduledFor, id, sendEmail } = result.data;
        if (status === 'SCHEDULED' && (!scheduledFor || !Number.isFinite(Date.parse(scheduledFor))))
            return NextResponse.json({ error: 'Set a valid scheduled publication date.' }, { status: 400 });
        const publishedAt = status === "PUBLISHED" ? new Date() : null;
        const data = { title, content, status, scheduledFor: scheduledFor ? new Date(scheduledFor) : null, publishedAt };
        const announcement = id ? await db.announcement.update({ where: { id }, data }) : await db.announcement.create({ data });
        if (status === 'PUBLISHED') {
            const users = await db.user.findMany({ where: { emailVerified: true }, select: { id: true, email: true } });
            await db.notification.createMany({ data: users.map(u => ({ userId: u.id, title, message: content })) });
            if (sendEmail && !firebaseAuthEnabled())
                await Promise.all(users.map(u => queueNotice(u.email, title, content)));
        }
        await logAuditEvent({
            userId: user.id,
            action: "ANNOUNCEMENT_CREATED",
            entityType: "Announcement",
            entityId: announcement.id,
            details: { title, status },
        });
        return NextResponse.json({ success: true, announcement });
    }
    catch (error: any) {
        console.error("Announcement error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id, confirm } = await req.json();
    if (confirm !== true)
        return NextResponse.json({ error: "Confirm deletion" }, { status: 400 });
    if (!id)
        return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.announcement.delete({ where: { id } });
    await logAuditEvent({ userId: user.id, action: "ANNOUNCEMENT_DELETED", entityType: "Announcement", entityId: id });
    return NextResponse.json({ success: true });
}
export const PATCH = POST;
