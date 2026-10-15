import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
    applicationName: "Kulio",
    title: "Kulio",
    description: "Catat tugas kuliah, pantau progres, dan deadline.",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
};

export default function RootLayout({
    children,
}: {
    readonly children: ReactNode;
}) {
    return (
        <html
            lang="id"
            suppressHydrationWarning
            className="bg-background font-sans text-foreground antialiased"
        >
            <body className="min-w-80 bg-background text-base font-medium leading-6 md:text-[0.9375rem]">
                {children}
            </body>
        </html>
    );
}
