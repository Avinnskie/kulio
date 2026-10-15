import { z } from "zod"

const ConfigSchema = z.object({
  url: z.url(),
  key: z.string().startsWith("sb_publishable_").min(20),
  appUrl: z.url(),
})

export class SupabaseConfigurationError extends Error {
  readonly name = "SupabaseConfigurationError"
  constructor() { super("Konfigurasi Supabase belum lengkap. Isi variabel pada .env.local sesuai .env.example.") }
}

export function supabaseConfig() {
  const parsed = ConfigSchema.safeParse({
    url: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    key: process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
    appUrl: process.env["NEXT_PUBLIC_APP_URL"],
  })
  if (!parsed.success || parsed.data.url.includes("YOUR_PROJECT") || parsed.data.key.includes("YOUR_")) throw new SupabaseConfigurationError()
  return parsed.data
}
