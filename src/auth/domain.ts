import { z } from "zod"
import { ViewerSchema } from "@/collaboration/domain"

export const AccountSchema = ViewerSchema.extend({ email: z.email() })
export const AuthStateSchema = z.object({ user: AccountSchema.nullable(), legacyProfile: ViewerSchema.nullable(), message: z.string().nullable().optional() })
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email("Masukkan alamat email yang valid.").max(254))
const PasswordSchema = z.string().min(12, "Kata sandi minimal 12 karakter.").max(128, "Kata sandi maksimal 128 karakter.")
export const RegisterSchema = z.object({
  action: z.literal("register"),
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(60),
  email: EmailSchema, password: PasswordSchema,
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, { message: "Konfirmasi kata sandi belum sama.", path: ["confirmPassword"] })
export const LoginSchema = z.object({
  action: z.literal("login"), email: EmailSchema,
  password: z.string().min(1, "Masukkan kata sandi.").max(128), remember: z.boolean().default(false),
})
export const AuthCommandSchema = z.discriminatedUnion("action", [RegisterSchema, LoginSchema, z.object({ action: z.literal("logout") })])
export type Account = z.infer<typeof AccountSchema>
export type AuthState = z.infer<typeof AuthStateSchema>
export type AuthCommand = z.infer<typeof AuthCommandSchema>
export type Registration = z.infer<typeof RegisterSchema>
export type Login = z.infer<typeof LoginSchema>
