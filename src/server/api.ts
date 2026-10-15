import "server-only"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { ApiError, sameOrigin } from "./auth"

export const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Pragma": "no-cache",
  "Expires": "0",
} as const

export function assertApplicationRequest(request: NextRequest): void {
  sameOrigin(request)
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new ApiError(415, "Gunakan format JSON.")
  }
  if (Number(request.headers.get("content-length") ?? 0) > 512_000) {
    throw new ApiError(413, "Permintaan terlalu besar.")
  }
}

export function apiFailure(error: unknown) {
  if (error instanceof ApiError) {
    const headers = error.retryAfterSeconds === undefined
      ? privateHeaders
      : { ...privateHeaders, "Retry-After": String(error.retryAfterSeconds) }
    return NextResponse.json({ error: error.message }, { status: error.status, headers })
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Data permintaan tidak valid. Periksa kembali isian Anda." },
      { status: 400, headers: privateHeaders },
    )
  }
  return NextResponse.json(
    { error: "Server belum dapat memproses permintaan. Coba kembali." },
    { status: 503, headers: privateHeaders },
  )
}
