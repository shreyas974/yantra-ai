import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function GET() {
  try { await db.eventConfig.count(); return NextResponse.json({ service: 'yantra-ai', database: 'firestore', ready: true }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ service: 'yantra-ai', database: 'firestore', ready: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
