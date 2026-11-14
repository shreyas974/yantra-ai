import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getStorageReport } from '@/lib/storage-report';
export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try { return NextResponse.json({ storage: await getStorageReport() }); }
  catch { return NextResponse.json({ error: 'Database usage is unavailable. Check Firebase configuration and server permissions.' }, { status: 503 }); }
}
