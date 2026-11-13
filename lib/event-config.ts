import { prisma } from "./db";

export async function getEventConfigMap(): Promise<Record<string, string>> {
  const configs = await prisma.eventConfig.findMany();
  const map: Record<string, string> = {};
  for (const c of configs) {
    map[c.key] = c.value;
  }
  return map;
}

export async function getPublicStats() {
  const [participantCount, teamCount] = await Promise.all([
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.team.count(),
  ]);

  return {
    participants: participantCount,
    teams: teamCount,
  };
}

export function generateRegistrationId(prefix: string = "CHAD"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}
