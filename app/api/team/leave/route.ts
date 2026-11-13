import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: { team: { include: { members: true, submission: true } } },
  });

  if (!membership) {
    return NextResponse.json({ error: "You are not in a team." }, { status: 400 });
  }

  if (membership.team.submission && membership.team.submission.status === "APPROVED") {
    return NextResponse.json({ error: "Cannot leave a team after registration has been approved." }, { status: 400 });
  }

  try {
    if (membership.role === "LEADER") {
      const otherMembers = membership.team.members.filter((m) => m.userId !== user.id);
      if (otherMembers.length > 0) {
        return NextResponse.json({
          error: "As team leader, you must transfer leadership to another member before leaving, or dissolve the team.",
        }, { status: 400 });
      }

      // Solo member or no others: delete team entirely
      await prisma.$transaction([
        prisma.teamMember.delete({ where: { id: membership.id } }),
        prisma.team.delete({ where: { id: membership.teamId } }),
      ]);
    } else {
      await prisma.teamMember.delete({ where: { id: membership.id } });
    }

    await logAuditEvent({
      userId: user.id,
      action: "TEAM_LEFT",
      entityType: "Team",
      entityId: membership.teamId,
    });

    return NextResponse.json({ success: true, message: "You have left the team." });
  } catch (error: any) {
    console.error("Leave team error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
