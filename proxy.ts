import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const publicAuthPaths = new Set(["/sign-in", "/sign-up"]);
const protectedPathPrefixes = ["/dashboard", "/onboarding", "/portfolio"];

function readSafeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth);
  const callbackUrl = readSafeCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl"),
  );

  if (publicAuthPaths.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL(callbackUrl ?? "/dashboard", request.nextUrl));
  }

  if (
    protectedPathPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    !isAuthenticated
  ) {
    const signInUrl = new URL("/sign-in", request.nextUrl);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/portfolio/:path*", "/sign-in", "/sign-up"],
};
