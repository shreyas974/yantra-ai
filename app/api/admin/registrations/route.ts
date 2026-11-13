import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
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

  const submissions = await prisma.registrationSubmission.findMany({
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
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
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

    const submission = await prisma.registrationSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason || "Does not meet requirements" : null,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: `REGISTRATION_${status}`,
      entityType: "RegistrationSubmission",
      entityId: submission.id,
      details: { status, rejectionReason },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("Admin registration update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
