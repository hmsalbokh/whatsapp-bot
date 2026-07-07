import { type NextRequest, NextResponse } from "next/server";

function getAuthCookie(request: NextRequest): string | null {
  const cookies = request.cookies.getAll();
  const authCookie = cookies.find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
  return authCookie?.value ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!getAuthCookie(request);

  // Auth pages → redirect to / if already logged in
  if (hasSession && pathname.startsWith("/auth") && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Protected non-API pages → redirect to login if no session
  const isPublic =
    pathname === "/pricing" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next");

  if (!isPublic && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
