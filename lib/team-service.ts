import { transaction, lockTeam, settings } from './transactions';
import { activeToken, assertEditable, assertDeadline, assertTeamSize } from './policies';
import { generateRegistrationId } from './event-config';
import { digestToken } from './auth';
export async function joinTeam(userId: string, email: string, token: string) {
    return transaction(async (tx) => {
        const invite = await tx.teamInvitation.findUnique({ where: { token: digestToken(token) } });
        if (!invite || !activeToken(invite) || invite.email.toLowerCase() !== email.toLowerCase())
            throw new Error('Invalid, expired or mismatched invitation.');
        await lockTeam(tx, invite.teamId);
        const team = await tx.team.findUniqueOrThrow({ where: { id: invite.teamId }, include: { members: true, submission: true } });
        const config = await settings(tx);
        assertEditable(team.submission?.status, config.team_editing_deadline);
        if (team.isSolo)
            throw new Error('Solo entries cannot accept members.');
        if (team.members.length >= Number(config.max_team_size || 4))
            throw new Error('Team capacity reached.');
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (!user.emailVerified)
            throw new Error('Verify your email before joining a team.');
        await tx.teamMember.create({ data: { teamId: team.id, userId } });
        const consumed = await tx.teamInvitation.updateMany({ where: { id: invite.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        if (consumed.count !== 1)
            throw new Error('Invitation already used.');
        await tx.notification.create({ data: { userId, title: 'Team joined', message: `You joined ${team.name}.` } });
        return { id: team.id, name: team.name };
    });
}
export async function manageTeam(userId: string, action: string, name?: string, targetUserId?: string) {
    return transaction(async (tx) => {
        const membership = await tx.teamMember.findUnique({ where: { userId } });
        if (!membership)
            throw new Error('Team membership required.');
        await lockTeam(tx, membership.teamId);
        const current = await tx.teamMember.findUniqueOrThrow({ where: { userId } });
        const team = await tx.team.findUniqueOrThrow({ where: { id: current.teamId }, include: { members: true, submission: true } });
        const config = await settings(tx);
        assertEditable(team.submission?.status, config.team_editing_deadline);
        if (action === 'leave') {
            if (current.role === 'LEADER' && team.members.length > 1)
                throw new Error('Transfer leadership before leaving.');
            if (current.role === 'LEADER')
                await tx.team.delete({ where: { id: team.id } });
            else
                await tx.teamMember.delete({ where: { id: current.id } });
        }
        else {
            if (current.role !== 'LEADER' || team.leaderId !== userId)
                throw new Error('Only the current leader may manage this team.');
            if (action === 'rename') {
                if (!name || name.trim().length < 3 || name.length > 40)
                    throw new Error('Team name must contain 3–40 characters.');
                await tx.team.update({ where: { id: team.id }, data: { name: name.trim() } });
            }
            else {
                const target = team.members.find(m => m.userId === targetUserId);
                if (!target || target.userId === userId)
                    throw new Error('Select another member of your team.');
                if (action === 'kick')
                    await tx.teamMember.delete({ where: { id: target.id } });
                else if (action === 'transfer_leader') {
                    await tx.teamMember.update({ where: { id: target.id }, data: { role: 'LEADER' } });
                    await tx.teamMember.update({ where: { id: current.id }, data: { role: 'MEMBER' } });
                    await tx.team.update({ where: { id: team.id }, data: { leaderId: target.userId } });
                }
                else
                    throw new Error('Invalid action.');
            }
        }
        await tx.auditLog.create({ data: { userId, action: `TEAM_${action.toUpperCase()}`, entityType: 'Team', entityId: team.id } });
    });
}
export async function submitRegistration(userId: string) {
    return transaction(async (tx) => {
        const membership = await tx.teamMember.findUnique({ where: { userId } });
        if (!membership)
            throw new Error('Create or join a team first.');
        await lockTeam(tx, membership.teamId);
        const team = await tx.team.findUniqueOrThrow({ where: { id: membership.teamId }, include: { submission: true, members: { include: { user: { include: { profile: true } } } } } });
        if (team.leaderId !== userId)
            throw new Error('Only the team leader can submit.');
        if (team.submission && team.submission.status !== 'REJECTED')
            throw new Error('Registration is already submitted.');
        const config = await settings(tx);
        if (config.registration_open !== 'true' || config.rules_published !== 'true')
            throw new Error('Registration is closed or official rules are unpublished.');
        assertDeadline(config.registration_deadline, true);
        assertTeamSize(team.members.length, Number(config.min_team_size || 1), Number(config.max_team_size || 4), team.isSolo, config.allow_solo === 'true');
        for (const m of team.members) {
            const p = m.user.profile;
            if (!m.user.emailVerified || !p || !p.privacyConsent || !p.rulesAccepted || p.rulesVersion !== config.rules_version)
                throw new Error('Every member must verify email, complete a profile and accept the current published rules and privacy policy.');
        }
        const id = team.submission?.registrationId || generateRegistrationId(config.registration_prefix || 'YANTRA');
        const submission = await tx.registrationSubmission.upsert({ where: { teamId: team.id }, create: { teamId: team.id, registrationId: id, submittedById: userId }, update: { status: 'PENDING', rejectionReason: null, reviewedAt: null, reviewedById: null, submittedAt: new Date() } });
        for (const member of team.members)
            await tx.notification.create({ data: { userId: member.userId, title: 'Registration submitted', message: `${id} is pending organizer review.` } });
        await tx.auditLog.create({ data: { userId, action: 'REGISTRATION_SUBMITTED', entityType: 'RegistrationSubmission', entityId: submission.id } });
        return submission;
    });
}
