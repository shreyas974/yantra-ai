import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateCsv } from "@/lib/csv";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "participants";

  await logAuditEvent({
    userId: user.id,
    action: "CSV_EXPORT",
    entityType: "Export",
    details: { type },
  });

  if (type === "teams") {
    const teams = await db.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { email: true, profile: true },
            },
          },
        },
        submission: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Team ID",
      "Team Name",
      "Member Count",
      "Registration ID",
      "Registration Status",
      "Leader Email",
      "Members Emails",
      "Created At",
    ];

    const rows = teams.map((t) => [
      t.id,
      t.name,
      t.members.length,
      t.submission?.registrationId || "N/A",
      t.submission?.status || "NOT_SUBMITTED",
      t.members.find((m) => m.role === "LEADER")?.user.email || "",
      t.members.map((m) => m.user.email).join("; "),
      t.createdAt.toISOString(),
    ]);

    const csvContent = generateCsv(headers, rows);
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="yantra-teams-${Date.now()}.csv"`,
      },
    });
  }

  // Participants export
  const participants = await db.user.findMany({
    where: { role: "USER" },
    include: {
      profile: true,
      teamMembership: {
        include: {
          team: {
            include: { submission: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "User ID",
    "Email",
    "Email Verified",
    "Full Name",
    "College / Org",
    "City State",
    "Skills",
    "AI Experience",
    "Phone",
    "Team Name",
    "Registration ID",
    "Registration Status",
    "Created At",
  ];

  const rows = participants.map((p) => [
    p.id,
    p.email,
    p.emailVerified ? "Yes" : "No",
    p.profile?.fullName || "",
    p.profile?.collegeOrg || "",
    p.profile?.cityState || "",
    p.profile?.skills || "",
    p.profile?.aiExperience || "",
    p.profile?.phone || "",
    p.teamMembership?.team.name || "None",
    p.teamMembership?.team.submission?.registrationId || "N/A",
    p.teamMembership?.team.submission?.status || "NOT_SUBMITTED",
    p.createdAt.toISOString(),
  ]);

  const csvContent = generateCsv(headers, rows);
  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yantra-participants-${Date.now()}.csv"`,
    },
  });
}
