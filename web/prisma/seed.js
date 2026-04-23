// Idempotent seed: creates a super-admin if none exists.
/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@logiclaunch.in").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert: always sync env → DB so changing SEED_ADMIN_PASSWORD + restart actually works.
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "SUPER_ADMIN" },
    create: { email, name, passwordHash, role: "SUPER_ADMIN" },
  });
  console.log(`[seed] super-admin synced: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
