import { argon2id, hash } from "argon2";

import { prisma } from "../src/lib/prisma";

// TRADE-OFF: a known password is what makes these accounts usable for manual testing,
// so this seed must never run against a production database.
const SEED_PASSWORD = "Password123!";

// A fixed date keeps re-seeding repeatable: the same input always gives the same rows.
const VERIFIED_AT = new Date("2026-01-01T00:00:00.000Z");

const seedUsers = [
  { username: "ali_test", email: "ali@test.com", fullName: "Ali Test", emailVerifiedAt: VERIFIED_AT },
  { username: "carl_test", email: "carl@test.com", fullName: "Carl Test", emailVerifiedAt: VERIFIED_AT },
  { username: "unverified_test", email: "unverified@test.com", fullName: "Unverified Test", emailVerifiedAt: null },
];

async function main() {
  for (const user of seedUsers) {
    const passwordHash = await hash(SEED_PASSWORD, { type: argon2id });
    //object spread syntax
    const data = { ...user, passwordHash };
    // update repeats create so a re-seed also restores accounts changed during testing.
    //upsert means create or update
    //select returns the user id.
    await prisma.user.upsert({
      where: { email: user.email },
      create: data,
      update: data,
      select: { id: true },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    //mark nodejs process as failed since 0=success.
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());//close the connection whenever failed or success
