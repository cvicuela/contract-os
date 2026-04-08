import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isDemo = req.cookies.get('demo_mode')?.value === '1'
  const { pathname } = req.nextUrl

  const isPublic = (
    pathname.startsWith("/login") ||
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
