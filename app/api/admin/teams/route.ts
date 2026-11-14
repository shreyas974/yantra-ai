import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export async function GET(req: NextRequest) { const user = await getCurrentUser(); if (user?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); const q = (req.nextUrl.searchParams.get('q') || '').slice(0, 100); return NextResponse.json({ teams: await db.team.findMany({ where: q ? { name: { contains: q, mode: 'insensitive' } } : {}, include: { submission: true, members: { include: { user: { select: { email: true, profile: { select: { fullName: true, collegeOrg: true } } } } } } }, orderBy: { createdAt: 'desc' }, take: 200 }) }); }
