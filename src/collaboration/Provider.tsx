"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { z } from "zod";
import {
    WorkspaceSchema,
    MutationResultSchema,
    type Command,
    type Workspace,
} from "./domain";
import { useAuth } from "@/auth/Provider";

const api = ky.create({
    timeout: 10_000,
    retry: 0,
    credentials: "same-origin",
});
const ErrorSchema = z.object({ error: z.string() });

function messageFor(error: unknown) {
    if (error instanceof HTTPError) {
        const parsed = ErrorSchema.safeParse(error.data);
        return parsed.success
            ? parsed.data.error
            : "Permintaan kolaborasi gagal. Coba kembali.";
    }
    if (error instanceof z.ZodError) return "Format data server tidak sesuai.";
    if (error instanceof Error)
        return "Tidak dapat terhubung ke server kolaborasi.";
    return "Terjadi kesalahan kolaborasi.";
}

function useWorkspaceState() {
    const { refresh: refreshAccount } = useAuth();
    const [state, setState] = useState<Workspace>({
        viewer: null,
        groups: [],
        inbox: [],
        detail: null,
    });
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const mutationLock = useRef(false);
    const sequence = useRef(0);
    const seen = useRef<Set<string> | null>(null);

    const refresh = useCallback(
        async (groupId = selectedGroup, signal?: AbortSignal) => {
            const requestId = ++sequence.current;
            try {
                const raw: unknown = await api
                    .get("/api/collaboration", {
                        searchParams: groupId ? { groupId } : {},
                        ...(signal ? { signal } : {}),
                    })
                    .json();
                const value = WorkspaceSchema.parse(raw);
                if (requestId === sequence.current) {
                    setState(value);
                    setError(null);
                    setLoading(false);
                    if (value.viewer === null) setSelectedGroup(null);
                    else if (groupId === null && value.groups[0])
                        setSelectedGroup(value.groups[0].id);
                }
            } catch (caught: unknown) {
                if (signal?.aborted) return;
                if (
                    caught instanceof HTTPError &&
                    caught.response.status === 401
                )
                    void refreshAccount();
                if (requestId === sequence.current) {
                    setError(messageFor(caught));
                    setLoading(false);
                }
            }
        },
        [selectedGroup, refreshAccount],
    );

    useEffect(() => {
        const controller = new AbortController();
        void refresh(selectedGroup, controller.signal);
        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible" && !mutationLock.current)
                void refresh(selectedGroup, controller.signal);
        }, 10_000);
        const onFocus = () => {
            if (!mutationLock.current)
                void refresh(selectedGroup, controller.signal);
        };
        window.addEventListener("focus", onFocus);
        return () => {
            controller.abort();
            window.clearInterval(interval);
            window.removeEventListener("focus", onFocus);
        };
    }, [refresh, selectedGroup]);

    useEffect(() => {
        if (loading) return;
        if (seen.current === null) {
            seen.current = new Set(state.inbox.map((item) => item.id));
            return;
        }
        for (const item of state.inbox) {
            if (!seen.current.has(item.id)) {
                seen.current.add(item.id);
                if (item.readAt === null)
                    toast.info(`${item.fromName} mengingatkan Anda`, {
                        description: `${item.taskTitle}: ${item.message}`,
                    });
            }
        }
    }, [state.inbox, loading]);

    const mutate = async (command: Command, successMessage: string) => {
        if (mutationLock.current) return false;
        mutationLock.current = true;
        setBusy(true);
        try {
            const raw: unknown = await api
                .post("/api/collaboration", { json: command })
                .json();
            const result = MutationResultSchema.parse(raw);
            if (result.groupId) setSelectedGroup(result.groupId);
            await refresh(result.groupId ?? selectedGroup);
            if (successMessage) toast.success(successMessage);
            return true;
        } catch (caught: unknown) {
            if (caught instanceof HTTPError && caught.response.status === 401)
                void refreshAccount();
            toast.error(messageFor(caught));
            if (caught instanceof HTTPError && caught.response.status === 409)
                await refresh();
            return false;
        } finally {
            mutationLock.current = false;
            setBusy(false);
        }
    };

    return {
        ...state,
        selectedGroup,
        setSelectedGroup,
        loading,
        error,
        busy,
        refresh,
        mutate,
    };
}

const CollaborationContext = createContext<ReturnType<
    typeof useWorkspaceState
> | null>(null);
export function CollaborationProvider({
    children,
}: {
    readonly children: ReactNode;
}) {
    const value = useWorkspaceState();
    return (
        <CollaborationContext value={value}>{children}</CollaborationContext>
    );
}
export function useCollaboration() {
    const context = useContext(CollaborationContext);
    if (context === null)
        throw new Error("Collaboration requires a workspace provider");
    return context;
}
