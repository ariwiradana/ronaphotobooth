import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "rona_session";
const secretValue = process.env.SESSION_SECRET;

function secret() {
  if (!secretValue || secretValue.length < 32) {
    throw new Error("SESSION_SECRET harus diisi dengan minimal 32 karakter.");
  }
  return new TextEncoder().encode(secretValue);
}

export type SessionUser = { id: number; name: string; email: string; role: string };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.name !== "string" || typeof payload.email !== "string") return null;
    return {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
      role: typeof payload.role === "string" ? payload.role : "partner",
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
