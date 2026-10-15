import { Button } from "@/components/ui/button";

type TaskCloudFeedbackProps = {
    readonly ready: boolean;
    readonly loading: boolean;
    readonly busy: boolean;
    readonly error: string | null;
    readonly onRetry: () => void;
};

export function TaskCloudFeedback({
    ready,
    loading,
    busy,
    error,
    onRetry,
}: TaskCloudFeedbackProps) {
    if (!ready)
        return (
            <div
                className="mx-auto grid max-w-lg gap-4 py-12 text-center"
                aria-busy={loading}
            >
                <h1 className="text-2xl font-bold">
                    {loading
                        ? "Memuat tugas Anda..."
                        : "Tugas belum dapat dimuat"}
                </h1>
                <p
                    className="text-sm text-muted-foreground"
                    role={error ? "alert" : "status"}
                >
                    {error ?? "Mengambil catatan dan progres dari server Kulio."}
                </p>
                {error ? (
                    <Button
                        className="mx-auto min-h-11"
                        onClick={onRetry}
                        disabled={loading}
                    >
                        Coba lagi
                    </Button>
                ) : null}
            </div>
        );
    if (error)
        return (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/10 p-4 text-sm">
                <p role="alert" className="text-destructive">
                    {error} Data terakhir tetap ditampilkan.
                </p>
                <Button variant="outline" onClick={onRetry} disabled={busy}>
                    Muat ulang
                </Button>
            </div>
        );
    return (
        <p
            role="status"
            aria-live="polite"
            className="mb-4 text-xs text-muted-foreground"
        >
            {busy
                ? "Menyimpan perubahan..."
                : "Tugas sudah tersinkron. Pembaruan perangkat lain dimuat setiap 10 detik."}
        </p>
    );
}
