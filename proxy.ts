import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-compatible base64 decoding helper for JWT payloads
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get("token")?.value;

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  const isAdminPage = pathname.startsWith("/admin");
  const isDriverPage = pathname.startsWith("/driver");
  const isProfilePage = pathname === "/profile";
  
  const isProtectedPage = isAdminPage || isDriverPage || isProfilePage;

  if (isProtectedPage) {
    if (!tokenCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = parseJwt(tokenCookie);
    if (!payload || !payload.exp || Date.now() >= payload.exp * 1000) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    if (isAdminPage && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }

    if (isDriverPage && payload.role !== "DRIVER") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  if (isAuthPage && tokenCookie) {
    const payload = parseJwt(tokenCookie);
    if (payload && payload.exp && Date.now() < payload.exp * 1000) {
      if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/drivers", request.url));
      } else if (payload.role === "DRIVER") {
        return NextResponse.redirect(new URL("/driver/verification", request.url));
      } else {
        return NextResponse.redirect(new URL("/profile", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/profile",
    "/driver/:path*",
    "/admin/:path*",
  ],
};
