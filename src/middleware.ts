import { NextResponse, type NextRequest } from "next/server";

const DEMO_SESSION_COOKIE = "finko_demo_session";
const protectedPagePrefixes = ["/advisor", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsSession = protectedPagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!needsSession) return NextResponse.next();

  const hasSessionCookie = Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  if (hasSessionCookie) return NextResponse.next();

  const url = request.nextUrl.clone();
  if (pathname.startsWith("/admin")) {
    url.pathname = "/demo-login";
    url.searchParams.set("next", pathname);
    url.searchParams.set("admin", "1");
    return NextResponse.redirect(url);
  }

  url.pathname = "/api/auth/demo-login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/advisor/:path*", "/admin/:path*"]
};
