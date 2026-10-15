"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Eye,
    EyeSlash,
    ArrowRight,
    CheckCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/auth/Provider";
import { LoginSchema, RegisterSchema } from "@/auth/domain";
import { authDestination } from "@/auth/navigation";
import { importBrowserTasks } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeChoice } from "@/hooks/useThemeChoice";

const fieldClass = "grid gap-2";
const errorClass = "text-xs text-destructive empty:hidden";
const passwordInputClass = "min-h-11 pr-12";

export function AuthForm({
    initialMode = "login",
}: {
    readonly initialMode?: "login" | "register";
}) {
    const { legacyProfile, busy, error, notice, authenticate, clearError } =
        useAuth();
    const [mode, setMode] = useState<"login" | "register">(initialMode);
    const [visiblePassword, setVisiblePassword] = useState(false);
    const [importTasks, setImportTasks] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<
        Readonly<Record<string, string>>
    >({});
    const router = useRouter();
    useThemeChoice();
    const registration = mode === "register";
    const changeMode = (value: "login" | "register") => {
        setMode(value);
        setFieldErrors({});
        clearError();
        setVisiblePassword(false);
    };

    return (
        <main className="min-h-svh bg-background px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto grid w-full max-w-6xl gap-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
                <section className="flex flex-col gap-6 lg:gap-8">
                    <a
                        href="/"
                        className="mb-2 inline-flex items-center"
                    >
                        <Image src="/logo.png" alt="Kulio" width={256} height={96} priority className="h-12 w-auto object-contain object-left sm:h-14" />
                    </a>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        Satu ruang untuk fokus
                    </span>
                    <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
                        Tugas tertata.
                        <br />
                        Belajar lebih tenang.
                    </h1>
                    <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Catat tugas kuliah, temukan deadline berikutnya, dan
                        selesaikan bersama teman.
                    </p>
                    <ul className="hidden list-none space-y-4 p-0 text-sm text-muted-foreground sm:block">
                        <li className="flex items-center gap-3">
                            <CheckCircle className="size-5 text-primary" />
                            Pantau progres dan tugas yang belum selesai
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="size-5 text-primary" />
                            Bergabung ke ruang dengan kode undangan
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="size-5 text-primary" />
                            Saling mengingatkan sebelum deadline
                        </li>
                    </ul>
                    <small className="hidden max-w-md text-xs leading-relaxed text-muted-foreground lg:block">
                        Ruang kolaborasi tetap terhubung saat Anda masuk dari
                        perangkat lain.
                    </small>
                </section>
                <Card className="w-full gap-0 rounded-2xl border-border bg-card p-5 shadow-sm sm:p-8">
                    <Tabs
                        value={mode}
                        className="gap-6"
                        onValueChange={(value) => {
                            if (value === "login" || value === "register")
                                changeMode(value);
                        }}
                    >
                        <TabsList
                            className="grid h-14 w-full grid-cols-2"
                            aria-label="Masuk atau daftar akun"
                        >
                            <TabsTrigger
                                className="h-8"
                                value="login"
                                disabled={busy}
                            >
                                Masuk
                            </TabsTrigger>
                            <TabsTrigger
                                className="h-8"
                                value="register"
                                disabled={busy}
                            >
                                Daftar akun
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value={mode} className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">
                                    {registration
                                        ? "Mulai ruang belajar Anda"
                                        : "Selamat datang kembali"}
                                </h2>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {registration
                                        ? "Buat akun untuk menyimpan identitas dan bergabung bersama teman."
                                        : "Masuk untuk melanjutkan tugas dan kolaborasi Anda."}
                                </p>
                            </div>
                            {legacyProfile && registration ? (
                                <div
                                    className="grid gap-1 rounded-xl bg-accent p-4 text-sm text-accent-foreground"
                                    role="status"
                                >
                                    <strong>
                                        Profil {legacyProfile.displayName}{" "}
                                        ditemukan.
                                    </strong>
                                    <span>
                                        Registrasi akan mempertahankan
                                        keanggotaan ruang dan progres profil
                                        ini.
                                    </span>
                                </div>
                            ) : null}
                            <form
                                key={mode}
                                className="grid gap-4"
                                noValidate
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const form = Object.fromEntries(
                                        new FormData(event.currentTarget),
                                    );
                                    const parsed = registration
                                        ? RegisterSchema.safeParse({
                                              ...form,
                                              action: "register",
                                          })
                                        : LoginSchema.safeParse({
                                              ...form,
                                              action: "login",
                                          });
                                    if (!parsed.success) {
                                        const errors: Record<string, string> =
                                            {};
                                        for (const issue of parsed.error
                                            .issues) {
                                            const key = String(
                                                issue.path[0] ?? "form",
                                            );
                                            errors[key] ??= issue.message;
                                        }
                                        setFieldErrors(errors);
                                        return;
                                    }
                                    setFieldErrors({});
                                    void authenticate(
                                        parsed.data,
                                        importTasks
                                            ? (user) =>
                                                  importBrowserTasks(user.id)
                                            : undefined,
                                    ).then((result) => {
                                        if (result?.user)
                                            router.replace(authDestination());
                                    });
                                }}
                            >
                                {registration ? (
                                    <div className={fieldClass}>
                                        <Label htmlFor="account-name">
                                            Nama lengkap
                                        </Label>
                                        <Input
                                            className="min-h-11"
                                            id="account-name"
                                            name="displayName"
                                            autoComplete="name"
                                            defaultValue={
                                                legacyProfile?.displayName ?? ""
                                            }
                                            placeholder="Nama yang terlihat oleh teman"
                                            minLength={2}
                                            maxLength={60}
                                            required
                                            disabled={busy}
                                            aria-invalid={Boolean(
                                                fieldErrors["displayName"],
                                            )}
                                            aria-describedby="name-error"
                                        />
                                        <span
                                            id="name-error"
                                            className={errorClass}
                                        >
                                            {fieldErrors["displayName"]}
                                        </span>
                                    </div>
                                ) : null}
                                <div className={fieldClass}>
                                    <Label htmlFor="account-email">Email</Label>
                                    <Input
                                        className="min-h-11"
                                        id="account-email"
                                        name="email"
                                        type="email"
                                        autoComplete="username"
                                        placeholder="nama@email.com"
                                        maxLength={254}
                                        required
                                        disabled={busy}
                                        aria-invalid={Boolean(
                                            fieldErrors["email"],
                                        )}
                                        aria-describedby="email-error"
                                    />
                                    <span
                                        id="email-error"
                                        className={errorClass}
                                    >
                                        {fieldErrors["email"]}
                                    </span>
                                </div>
                                <div className={fieldClass}>
                                    <Label htmlFor="account-password">
                                        Kata sandi
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            className={passwordInputClass}
                                            id="account-password"
                                            name="password"
                                            type={
                                                visiblePassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete={
                                                registration
                                                    ? "new-password"
                                                    : "current-password"
                                            }
                                            maxLength={128}
                                            required
                                            disabled={busy}
                                            aria-invalid={Boolean(
                                                fieldErrors["password"],
                                            )}
                                            aria-describedby="password-help password-error"
                                        />
                                        <Button
                                            className="absolute inset-y-0 right-1 my-auto size-10"
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={
                                                visiblePassword
                                                    ? "Sembunyikan kata sandi"
                                                    : "Tampilkan kata sandi"
                                            }
                                            onClick={() =>
                                                setVisiblePassword(
                                                    (value) => !value,
                                                )
                                            }
                                        >
                                            {visiblePassword ? (
                                                <EyeSlash />
                                            ) : (
                                                <Eye />
                                            )}
                                        </Button>
                                    </div>
                                    <small
                                        id="password-help"
                                        className="text-xs text-muted-foreground"
                                    >
                                        {registration
                                            ? "Minimal 12 karakter. Gunakan frasa yang mudah Anda ingat."
                                            : "Gunakan kata sandi akun Kulio Anda."}
                                    </small>
                                    <span
                                        id="password-error"
                                        className={errorClass}
                                    >
                                        {fieldErrors["password"]}
                                    </span>
                                </div>
                                {registration ? (
                                    <div className={fieldClass}>
                                        <Label htmlFor="account-confirm">
                                            Ulangi kata sandi
                                        </Label>
                                        <Input
                                            className="min-h-11"
                                            id="account-confirm"
                                            name="confirmPassword"
                                            type={
                                                visiblePassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            maxLength={128}
                                            required
                                            disabled={busy}
                                            aria-invalid={Boolean(
                                                fieldErrors["confirmPassword"],
                                            )}
                                            aria-describedby="confirm-error"
                                        />
                                        <span
                                            id="confirm-error"
                                            className={errorClass}
                                        >
                                            {fieldErrors["confirmPassword"]}
                                        </span>
                                    </div>
                                ) : null}
                                <Label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-normal leading-relaxed">
                                    <Checkbox
                                        disabled={busy}
                                        checked={importTasks}
                                        onCheckedChange={(checked) =>
                                            setImportTasks(checked === true)
                                        }
                                    />
                                    Impor tugas lama dari browser ini
                                </Label>
                                {error ? (
                                    <p
                                        className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                                        role="alert"
                                    >
                                        {error}
                                    </p>
                                ) : null}
                                {notice ? (
                                    <p
                                        className="rounded-lg bg-accent p-3 text-sm text-accent-foreground"
                                        role="status"
                                    >
                                        {notice}
                                    </p>
                                ) : null}
                                <Button
                                    type="submit"
                                    disabled={busy}
                                    className="min-h-11 w-full font-semibold"
                                >
                                    {busy
                                        ? "Memproses..."
                                        : registration
                                          ? "Buat akun"
                                          : "Masuk ke Kulio"}
                                    <ArrowRight />
                                </Button>
                            </form>
                            <p className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
                                {registration
                                    ? "Sudah punya akun?"
                                    : "Belum punya akun?"}
                                <Button
                                    className="px-1"
                                    variant="link"
                                    disabled={busy}
                                    onClick={() =>
                                        changeMode(
                                            registration ? "login" : "register",
                                        )
                                    }
                                >
                                    {registration ? "Masuk" : "Daftar sekarang"}
                                </Button>
                            </p>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </main>
    );
}
