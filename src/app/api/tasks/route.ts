import { type NextRequest, NextResponse } from "next/server"
import { PersonalCommandSchema } from "@/tasks/domain"
import { apiFailure, assertApplicationRequest, privateHeaders } from "@/server/api"
import { rateLimit, requireAuthenticatedViewer } from "@/server/auth"
import { applyPersonalCommand, personalSnapshot } from "@/server/personal-tasks"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAuthenticatedViewer(request)
    return NextResponse.json(await personalSnapshot(actor.id), { headers: privateHeaders })
  } catch (error: unknown) { return apiFailure(error) }
}

export async function POST(request: NextRequest) {
  try {
    assertApplicationRequest(request)
    const command = PersonalCommandSchema.parse(await request.json())
    const actor = await requireAuthenticatedViewer(request)
    await rateLimit(`${actor.id}:personal-write`, 180)
    return NextResponse.json(await applyPersonalCommand(command, actor), { headers: privateHeaders })
  } catch (error: unknown) { return apiFailure(error) }
}
