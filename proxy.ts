import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

const ROLE_PREFIXES: Record<string, string[]> = {
  admin: ["/admin", "/api/admin"],
  professor: ["/professor", "/api/professor"],
  student: ["/student", "/api/student"],
}

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get("app-session")?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const role = payload.role as string
    const allowedPrefixes = ROLE_PREFIXES[role] ?? []
    const isAllowed = allowedPrefixes.some((p) => pathname.startsWith(p))

    if (!isAllowed) {
      const home = `/${role}`
      return NextResponse.redirect(new URL(home, request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.userId as string)
    requestHeaders.set("x-user-role", role)
    requestHeaders.set("x-user-name", payload.name as string)

    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("app-session")
    return response
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
