import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.team.count(),
    prisma.registrationSubmission.count({ where: { status: "PENDING" } }),
    prisma.registrationSubmission.count({ where: { status: "APPROVED" } }),
    prisma.registrationSubmission.count({ where: { status: "REJECTED" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
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
