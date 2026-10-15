"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import ky, { HTTPError } from "ky"
import { z } from "zod"
import { AuthStateSchema, type Account, type AuthCommand, type AuthState } from "./domain"
import { authDestination } from "./navigation"

const api = ky.create({ timeout: 20_000, retry: 0, credentials: "same-origin" })
const ErrorSchema = z.object({ error: z.string() })

function messageFor(error: unknown) {
  if (error instanceof HTTPError) {
    const raw: unknown = error.data
    const parsed = ErrorSchema.safeParse(raw)
    return parsed.success ? parsed.data.error : "Permintaan akun gagal. Silakan coba kembali."
  }
  if (error instanceof Error) return "Tidak dapat terhubung ke server. Coba kembali sebentar lagi."
  return "Terjadi kesalahan saat mengakses akun."
}

function useAuthState() {
  const [state, setState] = useState<AuthState>({ user: null, legacyProfile: null })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const sequence = useRef(0)
  const lock = useRef(false)
  const retryAt = useRef<Record<AuthCommand["action"], number>>({ register: 0, login: 0, logout: 0 })
  const channel = useRef<BroadcastChannel | null>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (lock.current) return
    const requestId = ++sequence.current
    try {
      const raw: unknown = await api.get("/api/auth", signal ? { signal } : {}).json()
      const value = AuthStateSchema.parse(raw)
      if (requestId === sequence.current) { setState(value); setError(null); setLoading(false) }
    } catch (caught: unknown) {
      if (signal?.aborted) return
      if (requestId === sequence.current) { setError(messageFor(caught)); setLoading(false) }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    const onFocus = () => { if (!lock.current) void refresh(controller.signal) }
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") onFocus() }, 60_000)
    window.addEventListener("focus", onFocus)
    if ("BroadcastChannel" in window) {
      const connection = new BroadcastChannel("ruangtugas-auth")
      connection.onmessage = onFocus
      channel.current = connection
    }
    return () => {
      controller.abort(); window.clearInterval(interval); window.removeEventListener("focus", onFocus)
      channel.current?.close(); channel.current = null
    }
  }, [refresh])

  const authenticate = async (command: AuthCommand, onSignedIn?: (user: Account) => void) => {
    if (lock.current) return null
    if (Date.now() < retryAt.current[command.action]) {
      const seconds = Math.max(1, Math.ceil((retryAt.current[command.action] - Date.now()) / 1000))
      setError(`Tunggu ${seconds} detik sebelum mencoba kembali.`)
      return null
    }
    lock.current = true
    ++sequence.current
    setBusy(true); setError(null); setNotice(null)
    try {
      const raw: unknown = await api.post("/api/auth", { json: command, searchParams: { next: authDestination() } }).json()
      const value = AuthStateSchema.parse(raw)
      if (value.user && onSignedIn) onSignedIn(value.user)
      setState(value); setLoading(false)
      setNotice(value.message ?? null)
      channel.current?.postMessage("session-changed")
      return value
    } catch (caught: unknown) {
      if (caught instanceof HTTPError && caught.response.status === 429) {
        const retryAfter = Number.parseInt(caught.response.headers.get("retry-after") ?? "60", 10)
        retryAt.current[command.action] = Date.now() + (Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 60) * 1000
      }
      setError(messageFor(caught))
      return null
    } finally { lock.current = false; setBusy(false) }
  }

  return { ...state, loading, busy, error, notice, refresh, authenticate, clearError: () => { setError(null); setNotice(null) } }
}

const AuthContext = createContext<ReturnType<typeof useAuthState> | null>(null)
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const value = useAuthState()
  return <AuthContext value={value}>{children}</AuthContext>
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("Account access requires AuthProvider")
  return value
}
export function useAccount() {
  const { user } = useAuth()
  if (!user) throw new Error("Account access requires an authenticated user")
  return user
}
