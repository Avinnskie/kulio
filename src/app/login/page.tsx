import type { Metadata } from "next"
import { AuthPage } from "@/components/auth/AuthPage"

export const metadata: Metadata = { title: "Masuk — Kulio" }
export default function LoginPage() { return <AuthPage mode="login" /> }
