import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitRegistration } from '@/lib/team-service';
import { queueNotice } from '@/lib/notifications';
import { db } from '@/lib/db';
export async function POST() {
    const user = await getCurrentUser();
    if (!user)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'ADMIN')
        return NextResponse.json({ error: 'Organizer accounts cannot take part as participants.' }, { status: 403 });
    try {
        const submission = await submitRegistration(user.id);
        const members = await db.teamMember.findMany({ where: { teamId: submission.teamId }, include: { user: true } });
        await Promise.all(members.map(m => queueNotice(m.user.email, 'Registration confirmation', `${submission.registrationId} is pending organizer review.`)));
        return NextResponse.json({ success: true, submission, message: 'Registration submitted for review.' });
    }
    catch (e) {
        return NextResponse.json({ error: e instanceof Error && !('code' in e) ? e.message : 'Registration could not be submitted. Please retry.' }, { status: 400 });
    }
}
