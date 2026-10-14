import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Nama harus 2–120 karakter." }, { status: 400 });
    const [existing] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });
    const update: { name: string; passwordHash?: string } = { name };
    if (body.newPassword) {
      const currentPassword = String(body.currentPassword ?? "");
      const newPassword = String(body.newPassword);
      if (!(await compare(currentPassword, existing.passwordHash))) return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });
      if (newPassword.length < 12) return NextResponse.json({ error: "Password baru minimal 12 karakter." }, { status: 400 });
      update.passwordHash = await hash(newPassword, 12);
    }
    await db.update(users).set(update).where(eq(users.id, session.id));
    await createSession({ id: existing.id, name, email: existing.email, role: existing.role });
    return NextResponse.json({ user: { id: existing.id, name, email: existing.email, role: existing.role } });
  } catch (error) {
    console.error("Profile PATCH:", error);
    return NextResponse.json({ error: "Gagal menyimpan profil." }, { status: 500 });
  }
}
