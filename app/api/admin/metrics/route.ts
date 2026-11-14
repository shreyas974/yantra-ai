import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
  }

  const [
    totalUsers,
    verifiedUsers,
    totalTeams,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    unreadMessages,
  ] = await Promise.all([
    db.user.count({ where: { role: "USER" } }),
    db.user.count({ where: { role: "USER", emailVerified: true } }),
    db.team.count(),
    db.registrationSubmission.count({ where: { status: "PENDING" } }),
    db.registrationSubmission.count({ where: { status: "APPROVED" } }),
    db.registrationSubmission.count({ where: { status: "REJECTED" } }),
    db.contactMessage.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({
    metrics: {
      totalUsers,
      verifiedUsers,
      totalTeams,
      submissions: {
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions,
        total: pendingSubmissions + approvedSubmissions + rejectedSubmissions,
      },
      unreadMessages,
    },
  });
}
