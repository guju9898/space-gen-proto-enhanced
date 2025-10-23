"use client";

import React from "react";
import { supabaseBrowser } from "@/lib/supabase/browserClient";
import { getUserRenders } from "@/lib/data/getUserRenders";
import type { RenderRow } from "@/lib/types/renders";

export default function DevMyRendersPage() {
  const [rows, setRows] = React.useState<RenderRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const enabled = process.env.NEXT_PUBLIC_DEBUG === "true";

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const { data: userRes, error: userErr } = await supabaseBrowser.auth.getUser();
      if (userErr || !userRes?.user) throw new Error("Not signed in. Log in first.");
      const userId = userRes.user.id;

      const { data, error } = await getUserRenders(supabaseBrowser, userId, { limit: 20 });
      if (error) throw new Error(error);
      setRows(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load renders");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  if (!enabled) {
    return (
      <div className="p-6 text-sm">
        <p>
          Dev page disabled. Set <code>NEXT_PUBLIC_DEBUG=true</code> in <code>.env.local</code> and restart
          the dev server.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Dev • My Renders</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-neutral-800 text-white text-sm disabled:opacity-60"
        >
          {loading ? "Loading…" : "Reload"}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      {!error && (!rows || rows.length === 0) && !loading && (
        <div className="text-sm text-neutral-400">No renders yet.</div>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-neutral-400">
              <tr>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Prompt</th>
                <th className="py-2 pr-4">Image</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-800">
                  <td className="py-2 pr-4">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2 pr-4 max-w-[420px] truncate">{r.prompt ?? "—"}</td>
                  <td className="py-2 pr-4 max-w-[320px] truncate">
                    {r.image_url ? (
                      <a href={r.image_url} target="_blank" rel="noreferrer" className="underline">
                        {r.image_url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
