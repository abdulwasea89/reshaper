import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter
// Note: In a distributed environment (Vercel, etc.), this Map is not shared across instances.
// For production, use Redis (e.g., Upstash) to store rate limit data.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

    // Rate Limiting Logic
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - rateLimitData.lastReset > RATE_LIMIT_WINDOW) {
        rateLimitData.count = 0;
        rateLimitData.lastReset = now;
    }

    rateLimitData.count++;
    rateLimitMap.set(ip, rateLimitData);

    if (rateLimitData.count > MAX_REQUESTS) {
        return new NextResponse("Too Many Requests", { status: 429 });
    }

    // Check for session cookie
    // better-auth usually uses "better-auth.session_token" or similar. 
    // We check for the presence of the token to determine auth state optimistically.
    const sessionCookie = request.cookies.get("better-auth.session_token") || request.cookies.get("session_token");
    const isAuthenticated = !!sessionCookie;

    // Define paths
    const isAuthPage = pathname.startsWith("/auth");
    const isDashboardPage = pathname.startsWith("/dashboard");

    let response = NextResponse.next();

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuthenticated) {
        response = NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Redirect unauthenticated users away from dashboard pages
    else if (isDashboardPage && !isAuthenticated) {
        response = NextResponse.redirect(new URL("/auth/v2/login", request.url));
    }

    // Add Security Headers
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "origin-when-cross-origin");

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
