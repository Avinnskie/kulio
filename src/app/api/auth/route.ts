import { type NextRequest, NextResponse } from "next/server"
import { AuthCommandSchema, type Account } from "@/auth/domain"
import { assertNever } from "@/domain"
import { apiFailure, assertApplicationRequest, privateHeaders } from "@/server/api"
import { authState, login, logout, register } from "@/server/accounts"
import { digest, rateLimit, SESSION_COOKIE } from "@/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SessionResult = {
  readonly token: string
  readonly maxAge: number
  readonly user: Account
}

function sessionResponse(session: SessionResult, request: NextRequest) {
  const response = NextResponse.json(
    { user: session.user, legacyProfile: null },
    { headers: privateHeaders },
  )
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: session.maxAge,
  })
  return response
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await authState(request), { headers: privateHeaders })
  } catch (error: unknown) { return apiFailure(error) }
}

export async function POST(request: NextRequest) {
  try {
    assertApplicationRequest(request)
    const command = AuthCommandSchema.parse(await request.json())
    switch (command.action) {
      case "register": {
        await rateLimit(`auth:register:${digest(command.email)}`, 5)
        return sessionResponse(await register(command, request), request)
      }
      case "login": {
        await rateLimit(`auth:login:${digest(command.email)}`, 10)
        return sessionResponse(await login(command, request), request)
      }
      case "logout": {
        await logout(request)
        const response = NextResponse.json({ user: null, legacyProfile: null }, { headers: privateHeaders })
        response.cookies.set(SESSION_COOKIE, "", {
          httpOnly: true,
          sameSite: "lax",
          secure: request.nextUrl.protocol === "https:",
          path: "/",
          maxAge: 0,
        })
        return response
      }
      default: return assertNever(command)
    }
  } catch (error: unknown) { return apiFailure(error) }
}
