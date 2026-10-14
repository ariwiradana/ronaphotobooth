import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function upsertUser(name: string, email: string, password: string) {
  if (!email || !password || password.length < 12) {
    throw new Error(`Set ${name.toUpperCase().replace(/\s+/g, "_")}_EMAIL and password (minimum 12 characters) in .env first.`);
  }
  const emailNormalized = email.trim().toLowerCase();
  const passwordHash = await hash(password, 12);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, emailNormalized)).limit(1);
  if (existing) {
    await db.update(users).set({ name, passwordHash, active: true }).where(eq(users.id, existing.id));
    console.log(`Updated user: ${emailNormalized}`);
  } else {
    await db.insert(users).values({ name, email: emailNormalized, passwordHash, role: "partner", active: true });
    console.log(`Created user: ${emailNormalized}`);
  }
}

async function main() {
  await upsertUser("Partner 1", process.env.PARTNER1_EMAIL ?? "", process.env.PARTNER1_PASSWORD ?? "");
  await upsertUser("Partner 2", process.env.PARTNER2_EMAIL ?? "", process.env.PARTNER2_PASSWORD ?? "");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
