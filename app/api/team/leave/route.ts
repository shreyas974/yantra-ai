import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { manageTeam } from '@/lib/team-service';
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'ADMIN')
        return NextResponse.json({ error: 'Organizer accounts cannot take part as participants.' }, { status: 403 });
    try {
        const result = await manageTeam(user.id, 'leave');
        return NextResponse.json({ success: true, team: result, message: 'Team updated successfully.' });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof z.ZodError ? e.errors[0].message : e instanceof Error && !('code' in e) ? e.message : 'Team update could not be completed. Check membership and try again.' }, { status: 400 });
    }
}
