import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
export async function GET() { const user = await getCurrentUser(); if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); return NextResponse.json({ notifications: await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 }) }); }
export async function PATCH(req: NextRequest) { const user = await getCurrentUser(); if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const { id } = await req.json(); await db.notification.updateMany({ where: { userId: user.id, ...(typeof id === 'string' ? { id } : {}) }, data: { readAt: new Date() } }); return NextResponse.json({ success: true }); }
