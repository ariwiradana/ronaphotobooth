import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "rona_session";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isPublicApi = pathname === "/api/auth/login" || pathname === "/api/auth/logout";
  if (isPublicApi) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;
  let authenticated = false;
  if (token && secret && secret.length >= 32) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      authenticated = typeof payload.sub === "string" && Number.isSafeInteger(Number(payload.sub)) && Number(payload.sub) > 0;
    } catch { authenticated = false; }
  }

  if (isLoginPage) {
    if (authenticated) return NextResponse.redirect(new URL("/", request.url));
    const response = NextResponse.next();
    if (token && !authenticated) response.cookies.delete(COOKIE_NAME);
    return response;
  }
  if (authenticated) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.json({ error: "Session expired. Silakan login kembali." }, { status: 401 });
    if (token) response.cookies.delete(COOKIE_NAME);
    return response;
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname + search);
  const response = NextResponse.redirect(url);
  if (token) response.cookies.delete(COOKIE_NAME);
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
