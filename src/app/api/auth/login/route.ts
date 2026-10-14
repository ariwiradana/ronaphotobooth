import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.active || !(await compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }

    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login belum bisa diproses. Periksa koneksi database dan konfigurasi environment." },
      { status: 500 },
    );
  }
}
