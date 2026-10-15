import { describe, expect, test } from "bun:test"
import { nextStatus, progressForStatus } from "./domain"

describe("task status", () => {
  test("moves through the complete workflow when advanced", () => {
    // Given
    const status = "belum_selesai" as const

    // When
    const inProgress = nextStatus(status)
    const completed = nextStatus(inProgress)

    // Then
    expect(inProgress).toBe("dikerjakan")
    expect(completed).toBe("selesai")
  })

  test("normalizes progress when status changes", () => {
    // Given
    const currentProgress = 0

    // When
    const inProgress = progressForStatus("dikerjakan", currentProgress)
    const completed = progressForStatus("selesai", currentProgress)

    // Then
    expect(inProgress).toBe(50)
    expect(completed).toBe(100)
  })
})
