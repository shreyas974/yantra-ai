import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(5),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  scheduledFor: z.string().optional().nullable(),
});

export async function GET() {
  const announcements = await prisma.announcement.findMany({
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

    const { title, content, status, scheduledFor } = result.data;
    const publishedAt = status === "PUBLISHED" ? new Date() : null;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        publishedAt,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: "ANNOUNCEMENT_CREATED",
      entityType: "Announcement",
      entityId: announcement.id,
      details: { title, status },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error: any) {
    console.error("Announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
