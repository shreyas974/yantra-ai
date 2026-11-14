import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 100), college = (req.nextUrl.searchParams.get('college') || '').slice(0, 100), status = req.nextUrl.searchParams.get('status');
    const where: Record<string, any> = { role: 'USER', ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { profile: { fullName: { contains: q, mode: 'insensitive' } } }] } : {}), ...(college ? { profile: { collegeOrg: { contains: college, mode: 'insensitive' } } } : {}), ...(['PENDING', 'APPROVED', 'REJECTED'].includes(status || '') ? { teamMembership: { team: { submission: { status: status as any } } } } : {}) };
    const participants = await db.user.findMany({ where, select: { id: true, email: true, emailVerified: true, createdAt: true, profile: true, teamMembership: { include: { team: { include: { submission: true } } } } }, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ participants });
}
