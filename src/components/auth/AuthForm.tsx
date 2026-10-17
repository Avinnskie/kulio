"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "@/auth/Provider";
import { LoginSchema, RegisterSchema } from "@/auth/domain";
import { authDestination } from "@/auth/navigation";
import { importBrowserTasks } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ThemeLogo } from "@/components/ThemeLogo";
import { useThemeChoice } from "@/hooks/useThemeChoice";
import {
    AccountNameField,
    EmailField,
    PasswordFields,
    type AuthFieldErrors,
} from "./AuthFields";

type AuthMode = "login" | "register";

function AuthEditorialPanel() {
    return (
        <aside
            aria-hidden="true"
            className="sticky top-0 hidden h-[100dvh] min-w-0 self-start overflow-hidden border-l border-border bg-card lg:block"
        >
            <p className="absolute right-12 top-14 z-10 max-w-xl text-right text-4xl font-bold leading-[1.08] tracking-[-0.04em] xl:right-20 xl:top-20 xl:text-5xl">
                Rencana berubah.
                <br />
                Kendali tetap
                <br />
                <span className="text-brand">di tangan Anda.</span>
            </p>
            <Image
                src="/favicon.png"
                alt=""
                width={512}
                height={512}
                className="absolute -left-32 top-1/4 size-72 object-contain opacity-15 saturate-50 xl:-left-36 xl:size-80 dark:opacity-20"
            />
            <Image
                src="/favicon.png"
                alt=""
                width={512}
                height={512}
                className="absolute -bottom-28 -right-24 size-80 object-contain opacity-15 saturate-50 xl:-bottom-36 xl:-right-24 xl:size-96 dark:opacity-20"
            />
        </aside>
    );
}

export function AuthForm({
    initialMode = "login",
}: {
    readonly initialMode?: AuthMode;
}) {
    const { legacyProfile, busy, error, notice, authenticate, clearError } =
        useAuth();
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [importTasks, setImportTasks] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
    const router = useRouter();
    useThemeChoice();
    const registration = mode === "register";

    const changeMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setFieldErrors({});
        clearError();
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = Object.fromEntries(new FormData(event.currentTarget));
        const parsed = registration
            ? RegisterSchema.safeParse({ ...form, action: "register" })
            : LoginSchema.safeParse({ ...form, action: "login" });

        if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] ?? "form");
                errors[key] ??= issue.message;
            }
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        void authenticate(
            parsed.data,
            importTasks ? (user) => importBrowserTasks(user.id) : undefined,
        ).then((result) => {
            if (result?.user) router.replace(authDestination());
        });
    };

    return (
        <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(28rem,34%)_minmax(0,1fr)]">
            <section className="relative z-10 min-w-0 bg-secondary px-4 py-6 sm:px-8 lg:min-h-[100dvh] lg:px-10 lg:py-8">
                <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col lg:min-h-[calc(100dvh-4rem)]">
                    <a
                        href="/"
                        aria-label="Kulio — kembali ke beranda"
                        className="inline-flex w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-secondary"
                    >
                        <ThemeLogo className="h-10 sm:h-11" priority />
                    </a>

                    <div className="my-auto py-10 sm:py-12">
                        <header className="mb-8 text-center">
                            <h1 className="text-3xl font-bold tracking-[-0.035em]">
                                {registration
                                    ? "Daftar akun Kulio"
                                    : "Masuk ke Kulio"}
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {registration
                                    ? "Buat akun Anda terlebih dahulu."
                                    : "Lanjutkan tugas dan kolaborasi Anda."}
                            </p>
                        </header>

                        {legacyProfile && registration ? (
                            <div
                                className="mb-5 grid gap-1 rounded-lg bg-brand-subtle p-4 text-sm"
                                role="status"
                            >
                                <strong>
                                    Profil {legacyProfile.displayName}{" "}
                                    ditemukan.
                                </strong>
                                <span className="text-muted-foreground">
                                    Keanggotaan ruang dan progres profil ini
                                    akan dipertahankan.
                                </span>
                            </div>
                        ) : null}

                        <form
                            key={mode}
                            className="grid gap-4"
                            noValidate
                            onSubmit={submit}
                        >
                            {registration ? (
                                <AccountNameField
                                    busy={busy}
                                    defaultValue={
                                        legacyProfile?.displayName ?? ""
                                    }
                                    error={fieldErrors["displayName"]}
                                />
                            ) : null}
                            <EmailField
                                busy={busy}
                                error={fieldErrors["email"]}
                            />
                            <PasswordFields
                                registration={registration}
                                busy={busy}
                                errors={fieldErrors}
                            />
                            {error ? (
                                <p
                                    className="rounded-lg bg-danger-soft p-3 text-sm text-destructive"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            ) : null}
                            {notice ? (
                                <p
                                    className="rounded-lg bg-brand-subtle p-3 text-sm text-foreground"
                                    role="status"
                                >
                                    {notice}
                                </p>
                            ) : null}
                            <Button
                                type="submit"
                                disabled={busy}
                                className="mt-1 min-h-12 w-full font-semibold"
                            >
                                {busy
                                    ? "Memproses..."
                                    : registration
                                      ? "Buat akun Kulio"
                                      : "Masuk ke Kulio"}
                                <ArrowRight />
                            </Button>
                        </form>

                        <p className="mt-7 flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
                            {registration
                                ? "Sudah punya akun?"
                                : "Belum punya akun?"}
                            <Button
                                className="min-h-11 px-1"
                                type="button"
                                variant="link"
                                disabled={busy}
                                onClick={() =>
                                    changeMode(
                                        registration ? "login" : "register",
                                    )
                                }
                            >
                                {registration
                                    ? "Masuk sekarang"
                                    : "Daftar sekarang"}
                            </Button>
                        </p>
                    </div>
                </div>
            </section>
            <AuthEditorialPanel />
        </main>
    );
}
