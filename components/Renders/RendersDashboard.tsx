"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browserClient";
import { getUserRenders } from "@/lib/data/getUserRenders";
import type { RenderRow } from "@/lib/types/renders";
import { ToastProvider, useToast } from "@/components/toast/ToastProvider";
import { startRenderPolling } from "@/lib/renders/pollRenders";
import { TERMINAL_STATUSES } from "@/lib/renders/statusHelpers";
import { RenderCard } from "./RenderCard";

// Optional realtime (only if you already created it earlier)
let subscribeToRenderChanges: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  subscribeToRenderChanges = require("@/lib/realtime/renderUpdates").subscribeToRenderChanges;
} catch {}

const PAGE_SIZE = 9;
const AUTO_OPEN_ON_COMPLETE = false;
const ENABLE_REALTIME = process.env.NEXT_PUBLIC_ENABLE_REALTIME !== "false";

interface RendersDashboardProps {
  userId: string;
  initial: RenderRow[];
}

export function RendersDashboard({ userId, initial }: RendersDashboardProps) {
  const [renders, setRenders] = useState<RenderRow[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const hasRealtime = useRef(false);
  const pollStopRef = useRef<null | (() => void)>(null);
  const { push } = useToast();

  // Load more renders
  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await getUserRenders(supabaseBrowser, userId, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      if (error) throw new Error(error);
      setRenders((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Realtime (optional) or Polling (fallback)
  useEffect(() => {
    if (!userId) return;

    // If realtime is explicitly enabled AND the helper exists, use it; else use polling
    if (ENABLE_REALTIME && typeof subscribeToRenderChanges === "function" && !hasRealtime.current) {
      hasRealtime.current = true;
      const unsubscribe = subscribeToRenderChanges(userId, {
        onInsert: (row: RenderRow) => {
          setRenders((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
          push({ title: "Render started", description: row.prompt ?? undefined, variant: "info" });
        },
        onUpdate: (row: RenderRow, oldRow?: Partial<RenderRow>) => {
          setRenders((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)));
          if (oldRow?.status !== row.status) {
            if (row.status === "succeeded") {
              push({ title: "Render completed", description: row.prompt ?? undefined, variant: "success" });
              if (AUTO_OPEN_ON_COMPLETE && row.image_url) window.open(row.image_url, "_blank");
            } else if (!TERMINAL_STATUSES.has(oldRow?.status as string) && TERMINAL_STATUSES.has(row.status)) {
              push({ title: "Render ended", description: `Status: ${row.status}`, variant: "info" });
            }
          }
        },
      });
      return () => unsubscribe();
    }

    // Polling fallback (default)
    pollStopRef.current?.();
    pollStopRef.current = startRenderPolling(userId, {
      pageSize: Math.max(PAGE_SIZE, 18),
      getPrev: () => renders,
      onSnapshot: (rows, diff) => {
        // apply snapshot
        setRenders(rows);

        // toasts based on diff
        diff?.inserted.forEach((row) => {
          push({ title: "Render started", description: row.prompt ?? undefined, variant: "info" });
        });
        diff?.updated.forEach(({ before, after }) => {
          if (before.status !== after.status) {
            if (after.status === "succeeded") {
              push({ title: "Render completed", description: after.prompt ?? undefined, variant: "success" });
              if (AUTO_OPEN_ON_COMPLETE && after.image_url) window.open(after.image_url, "_blank");
            } else if (TERMINAL_STATUSES.has(after.status) && !TERMINAL_STATUSES.has(before.status)) {
              push({ title: "Render ended", description: `Status: ${after.status}`, variant: "info" });
            }
          }
        });
      },
    });

    return () => {
      pollStopRef.current?.();
      pollStopRef.current = null;
    };
  }, [userId, ENABLE_REALTIME, push]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: string) => {
    const row = renders.find((r) => r.id === id);
    if (!row) return;
    if (!confirm("Delete this render? This will remove it from your history.")) return;

    // Optimistic remove
    setRenders((prev) => prev.filter((r) => r.id !== id));

    try {
      const response = await fetch(`/api/renders/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Delete failed");
      }
      push({ title: "Render deleted", variant: "success" });
    } catch (error) {
      // Rollback if failed
      setRenders((prev) => [row, ...prev]);
      push({ title: "Delete failed", description: "Please try again", variant: "error" });
    }
  };

  if (error)
    return (
      <div className="p-6 text-red-500">
        <p>{error}</p>
      </div>
    );

  if (renders.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <p className="text-neutral-400">You don't have any renders yet.</p>
        <Link href="/studio/interior" className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium">
          Generate your first render →
        </Link>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-1">My Renders</h1>
      <p className="text-neutral-400 mb-6">Manage and view your generated designs</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {renders.map((render) => (
          <RenderCard key={render.id} render={render} onDelete={handleDelete} />
        ))}
      </div>

      {/* Load More Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={loadMore}
          disabled={loading}
          className="px-4 py-2 bg-neutral-800 rounded-md text-sm hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>
    </div>
  );
}
