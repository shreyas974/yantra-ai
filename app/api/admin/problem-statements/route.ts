import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const problemSchema = z.object({
  title: z.string().min(3),
  track: z.string().min(2),
  description: z.string().min(10),
  datasetsUrl: z.string().url().optional().or(z.literal("")).nullable(),
  evaluationCriteria: z.string().optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statements = await prisma.problemStatement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ statements });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = problemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const statement = await prisma.problemStatement.create({
      data: result.data,
    });

    await logAuditEvent({
      userId: user.id,
      action: "PROBLEM_STATEMENT_CREATED",
      entityType: "ProblemStatement",
      entityId: statement.id,
    });

    return NextResponse.json({ success: true, statement });
  } catch (error: any) {
    console.error("Problem statement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
