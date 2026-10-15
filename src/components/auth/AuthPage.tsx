"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/auth/Provider"
import { authDestination } from "@/auth/navigation"
import { AuthForm } from "./AuthForm"
import { AuthLoading } from "./AuthLoading"

function AccountEntry({ mode }: { readonly mode: "login" | "register" }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => { if (user) router.replace(authDestination()) }, [user, router])
  if (loading || user) return <AuthLoading />
  return <AuthForm initialMode={mode} />
}
export function AuthPage({ mode }: { readonly mode: "login" | "register" }) {
  return <AuthProvider><AccountEntry mode={mode} /></AuthProvider>
}
