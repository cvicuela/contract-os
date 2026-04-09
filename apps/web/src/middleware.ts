import { auth } from "@/auth"
import { NextResponse } from "next/server"

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])
const DEMO_WRITE_BLOCKED = ["/api/contracts", "/api/alerts", "/api/drive"]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isDemo = req.cookies.get('demo_mode')?.value === '1'
  const { pathname } = req.nextUrl

  // Demo mode is read-only — block all write operations on protected routes
  if (isDemo && WRITE_METHODS.has(req.method) && DEMO_WRITE_BLOCKED.some(p => pathname.startsWith(p))) {
    return NextResponse.json({ error: "Demo mode is read-only" }, { status: 403 })
  }

  const isPublic = (
    pathname.startsWith("/login") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/demo") ||
    pathname.startsWith("/api/paypal") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  )

  if (!isLoggedIn && !isDemo && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
