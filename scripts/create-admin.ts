/**
 * Creates (or updates the password of) an admin account so a person can log
 * in to Manage Data. You can run this as many times as you like to add as
 * many team members as you want — each gets their own username/password and
 * everyone can be logged in at the same time.
 *
 * Usage:
 *   npm run create-admin -- "Full Name" username YourPassword123
 *
 * Example, adding three people:
 *   npm run create-admin -- "Vaish Nashan" vaish "Str0ngPass!1"
 *   npm run create-admin -- "Kamal Perera" kamal "Str0ngPass!2"
 *   npm run create-admin -- "Nimal Silva"  nimal "Str0ngPass!3"
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [name, username, password] = process.argv.slice(2);
  if (!name || !username || !password) {
    console.error('Usage: npm run create-admin -- "Full Name" username YourPassword123');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash, name },
    create: { username, passwordHash, name },
  });

  console.log(`\nSaved admin account: ${user.name} (username: ${user.username})\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
