import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const manageSchema = z.object({
  action: z.enum(["rename", "kick", "transfer_leader"]),
  name: z.string().min(3).max(40).optional(),
  targetUserId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: { team: { include: { members: true, submission: true } } },
  });

  if (!membership || membership.role !== "LEADER") {
    return NextResponse.json({ error: "Only team leader can manage team settings." }, { status: 403 });
  }

  if (membership.team.submission && membership.team.submission.status === "APPROVED") {
    return NextResponse.json({ error: "Cannot modify team after registration is approved." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const result = manageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { action, name, targetUserId } = result.data;

    if (action === "rename") {
      if (!name) return NextResponse.json({ error: "Team name is required." }, { status: 400 });
      const existing = await prisma.team.findUnique({ where: { name } });
      if (existing && existing.id !== membership.teamId) {
        return NextResponse.json({ error: "Team name already taken." }, { status: 409 });
      }

      await prisma.team.update({
        where: { id: membership.teamId },
        data: { name },
      });

      return NextResponse.json({ success: true, message: `Team renamed to ${name}` });
    }

    if (action === "kick") {
      if (!targetUserId || targetUserId === user.id) {
        return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
      }

      await prisma.teamMember.deleteMany({
        where: { teamId: membership.teamId, userId: targetUserId },
      });

      return NextResponse.json({ success: true, message: "Member removed from team." });
    }

    if (action === "transfer_leader") {
      if (!targetUserId || targetUserId === user.id) {
        return NextResponse.json({ error: "Invalid target member." }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.team.update({
          where: { id: membership.teamId },
          data: { leaderId: targetUserId },
        }),
        prisma.teamMember.update({
          where: { userId: targetUserId },
          data: { role: "LEADER" },
        }),
        prisma.teamMember.update({
          where: { userId: user.id },
          data: { role: "MEMBER" },
        }),
      ]);

      return NextResponse.json({ success: true, message: "Leadership transferred successfully." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Manage team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
