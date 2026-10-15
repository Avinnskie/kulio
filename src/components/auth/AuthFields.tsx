"use client"

import { useState } from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type AuthFieldErrors = Readonly<Record<string, string>>

const fieldClassName = "grid gap-2"
const inputClassName = "min-h-12 bg-card px-4 dark:bg-background"
const errorClassName = "min-h-4 text-xs text-destructive empty:invisible"

type AccountNameFieldProps = {
  readonly busy: boolean
  readonly defaultValue: string
  readonly error: string | undefined
}

export function AccountNameField({ busy, defaultValue, error }: AccountNameFieldProps) {
  return (
    <div className={fieldClassName}>
      <Label htmlFor="account-name">Nama lengkap</Label>
      <Input
        className={inputClassName}
        id="account-name"
        name="displayName"
        autoComplete="name"
        defaultValue={defaultValue}
        placeholder="Nama yang terlihat oleh teman"
        minLength={2}
        maxLength={60}
        required
        disabled={busy}
        aria-invalid={Boolean(error)}
        aria-describedby="name-error"
      />
      <span id="name-error" className={errorClassName}>{error}</span>
    </div>
  )
}

type EmailFieldProps = {
  readonly busy: boolean
  readonly error: string | undefined
}

export function EmailField({ busy, error }: EmailFieldProps) {
  return (
    <div className={fieldClassName}>
      <Label htmlFor="account-email">Email</Label>
      <Input
        className={inputClassName}
        id="account-email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="nama@email.com"
        maxLength={254}
        required
        disabled={busy}
        aria-invalid={Boolean(error)}
        aria-describedby="email-error"
      />
      <span id="email-error" className={errorClassName}>{error}</span>
    </div>
  )
}

type PasswordFieldsProps = {
  readonly registration: boolean
  readonly busy: boolean
  readonly errors: AuthFieldErrors
}

export function PasswordFields({ registration, busy, errors }: PasswordFieldsProps) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <div className={fieldClassName}>
        <Label htmlFor="account-password">Kata sandi</Label>
        <div className="relative">
          <Input
            className={`${inputClassName} pr-14`}
            id="account-password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={registration ? "new-password" : "current-password"}
            maxLength={128}
            required
            disabled={busy}
            aria-invalid={Boolean(errors["password"])}
            aria-describedby="password-help password-error"
          />
          <Button
            className="absolute inset-y-0 right-1 my-auto size-11"
            type="button"
            variant="ghost"
            size="icon"
            aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeSlash /> : <Eye />}
          </Button>
        </div>
        <small id="password-help" className="text-xs text-muted-foreground">
          {registration
            ? "Minimal 12 karakter. Gunakan frasa yang mudah Anda ingat."
            : "Gunakan kata sandi akun Kulio Anda."}
        </small>
        <span id="password-error" className={errorClassName}>{errors["password"]}</span>
      </div>
      {registration ? (
        <div className={fieldClassName}>
          <Label htmlFor="account-confirm">Ulangi kata sandi</Label>
          <Input
            className={inputClassName}
            id="account-confirm"
            name="confirmPassword"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            maxLength={128}
            required
            disabled={busy}
            aria-invalid={Boolean(errors["confirmPassword"])}
            aria-describedby="confirm-error"
          />
          <span id="confirm-error" className={errorClassName}>{errors["confirmPassword"]}</span>
        </div>
      ) : null}
    </>
  )
}
