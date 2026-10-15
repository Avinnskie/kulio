import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CommandSchema, MutationResultSchema, WorkspaceSchema } from "@/collaboration/domain"
import { assertNever } from "@/domain"
import { apiFailure, assertApplicationRequest, privateHeaders } from "@/server/api"
import { rateLimit, requireAuthenticatedViewer } from "@/server/auth"
import { createGroup, joinGroup, rotateInvite } from "@/server/groups"
import { deleteSharedTask, readReminder, saveSharedTask, sendReminder, updateAssignment } from "@/server/shared-tasks"
import { snapshot } from "@/server/snapshot"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const selected = request.nextUrl.searchParams.get("groupId")
    const groupId = selected === null ? null : z.uuid().parse(selected)
    const actor = await requireAuthenticatedViewer(request)
    return NextResponse.json(WorkspaceSchema.parse(await snapshot(actor, groupId)), { headers: privateHeaders })
  } catch (error: unknown) { return apiFailure(error) }
}

export async function POST(request: NextRequest) {
  try {
    assertApplicationRequest(request)
    const command = CommandSchema.parse(await request.json())
    const actor = await requireAuthenticatedViewer(request)
    await rateLimit(`${actor.id}:collaboration-write`, 90)
    let groupId: string | undefined
    switch (command.type) {
      case "create_group":
        groupId = await createGroup(command.title, actor)
        break
      case "join_group":
        groupId = await joinGroup(command.code, actor)
        break
      case "rotate_invite":
        await rotateInvite(command.groupId, actor)
        break
      case "save_task":
        await saveSharedTask(command, actor)
        break
      case "delete_task":
        await deleteSharedTask(command, actor)
        break
      case "update_assignment":
        await updateAssignment(command, actor)
        break
      case "remind":
        await sendReminder(command, actor)
        break
      case "read_reminder":
        await readReminder(command.reminderId, actor)
        break
      default:
        return assertNever(command)
    }
    return NextResponse.json(MutationResultSchema.parse({ ok: true, ...(groupId ? { groupId } : {}) }), { headers: privateHeaders })
  } catch (error: unknown) { return apiFailure(error) }
}
