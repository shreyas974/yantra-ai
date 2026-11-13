import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEventConfigMap } from "@/lib/event-config";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await getEventConfigMap();
  return NextResponse.json({ configs });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof key !== "string" || value === undefined) {
      return NextResponse.json({ error: "Key and value are required." }, { status: 400 });
    }

    const updated = await prisma.eventConfig.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });

    await logAuditEvent({
      userId: user.id,
      action: "EVENT_CONFIG_UPDATED",
      entityType: "EventConfig",
      entityId: updated.id,
      details: { key, value },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("Config update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
