import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim();
  const hasConfirm = args.includes("--confirm");

  if (!email || email === "YOUR_EMAIL_ADDRESS" || email.startsWith("--")) {
    console.error("Error: Please provide a valid email address.");
    console.error("Usage: npm run admin:promote -- user@example.com --confirm");
    process.exit(1);
  }

  if (!hasConfirm) {
    console.error("Error: Destructive/privilege action requires --confirm flag.");
    console.error(`Run: npm run admin:promote -- ${email} --confirm`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.error(`Error: User with email "${email}" not found.`);
    process.exit(1);
  }

  if (!user.emailVerified) {
    console.error(`Error: User "${email}" has not verified their email yet.`);
    console.error("Please verify the account first before promoting to admin.");
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`User "${email}" is already an Administrator.`);
    process.exit(0);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    }),
    prisma.session.deleteMany({
      where: { userId: user.id },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_PROMOTED_VIA_CLI",
        entityType: "User",
        entityId: user.id,
        details: JSON.stringify({ email: user.email }),
      },
    }),
  ]);

  console.log(`\n Successfully promoted ${email} to Administrator!`);
  console.log("Existing sessions were revoked for security.");
  console.log("Please sign in again to activate administrative permissions:");
  console.log("  http://localhost:3000/login -> http://localhost:3000/admin\n");
}

main()
  .catch((e) => {
    console.error("Promotion failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
