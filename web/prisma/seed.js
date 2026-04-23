// Idempotent seed: creates a super-admin if none exists.
/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@logiclaunch.in";
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] super-admin already exists: ${email}`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, name, passwordHash, role: "SUPER_ADMIN" },
  });
  console.log(`[seed] created super-admin ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
