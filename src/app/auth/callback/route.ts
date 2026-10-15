import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET(request: NextRequest) {
  const destination = request.nextUrl.searchParams.get("next")
  const next = destination === "/" || destination?.startsWith("/?") ? destination : "/"
  const login = new URL("/login", request.url)
  login.searchParams.set("next", next)
  return NextResponse.redirect(login)
}
