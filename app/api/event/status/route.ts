import { NextResponse } from 'next/server';
import { getPublicStats } from '@/lib/event-config';
export async function GET() {
  try { return NextResponse.json({ stats: await getPublicStats() }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }); }
  catch { return NextResponse.json({ stats: null }, { status: 503 }); }
}
