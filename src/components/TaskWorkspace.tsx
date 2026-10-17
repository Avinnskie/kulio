"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { CollaborationProvider } from "@/collaboration/Provider";
import { AuthProvider, useAuth } from "@/auth/Provider";
import { AuthForm } from "./auth/AuthForm";
import { AuthLoading } from "./auth/AuthLoading";

const ClientApp = dynamic(() => import("@/App").then((module) => module.App), {
    ssr: false,
    loading: () => (
        <div
            className="grid min-h-svh content-center justify-items-center gap-3 text-muted-foreground"
            role="status"
        >
            <span className="grid size-14 place-items-center overflow-hidden rounded-lg bg-accent">
                <Image
                    src="/favicon.png"
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 object-contain"
                />
            </span>
            <strong className="text-foreground">Menyiapkan Kulio...</strong>
            <span>Catatan dan progres tugas Anda segera tampil.</span>
        </div>
    ),
});

function AccountWorkspace() {
    const { user, legacyProfile, loading } = useAuth();
    if (loading) return <AuthLoading />;
    if (!user)
        return <AuthForm initialMode={legacyProfile ? "register" : "login"} />;
    return (
        <CollaborationProvider key={user.id}>
            <ClientApp />
        </CollaborationProvider>
    );
}

export function TaskWorkspace() {
    return (
        <AuthProvider>
            <AccountWorkspace />
        </AuthProvider>
    );
}
