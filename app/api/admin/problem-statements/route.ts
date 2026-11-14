import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { safeUrl } from '@/lib/policies';
const schema = z.object({ id: z.string().optional(), identifier: z.string().trim().min(1).max(50).optional().nullable(), title: z.string().trim().min(3).max(200), track: z.string().trim().max(200).default(''), trackId: z.string().optional().nullable(), description: z.string().min(10).max(30000), datasetsUrl: safeUrl.optional().or(z.literal('')).nullable(), evaluationCriteria: z.string().max(10000).optional().nullable(), status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT') });
export async function GET() {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ statements: await db.problemStatement.findMany({ orderBy: { createdAt: 'desc' } }) });
}
async function save(req: NextRequest, edit: boolean) {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    try {
        const { id, ...data } = schema.parse(await req.json());
        if (edit && !id)
            return NextResponse.json({ error: 'Statement ID required' }, { status: 400 });
        if (data.status === 'PUBLISHED' && !data.identifier)
            return NextResponse.json({ error: 'Assign an official identifier before publishing.' }, { status: 400 });
        const statement = edit ? await db.problemStatement.update({ where: { id }, data }) : await db.problemStatement.create({ data });
        await db.auditLog.create({ data: { userId: user.id, action: 'PROBLEM_STATEMENT_SAVED', entityType: 'ProblemStatement', entityId: statement.id } });
        return NextResponse.json({ success: true, statement });
    }
    catch {
        return NextResponse.json({ error: 'Check required fields, identifier uniqueness and resource URL.' }, { status: 400 });
    }
}
export const POST = (req: NextRequest) => save(req, false);
export const PATCH = (req: NextRequest) => save(req, true);
export async function DELETE(req: NextRequest) {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id, confirm } = await req.json();
    if (!id || confirm !== true)
        return NextResponse.json({ error: 'Confirm deletion.' }, { status: 400 });
    await db.problemStatement.delete({ where: { id } });
    await db.auditLog.create({ data: { userId: user.id, action: 'PROBLEM_STATEMENT_DELETED', entityType: 'ProblemStatement', entityId: id } });
    return NextResponse.json({ success: true });
}
