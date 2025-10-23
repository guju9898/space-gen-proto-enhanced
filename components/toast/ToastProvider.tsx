"use client";

import React from "react";

type ToastVariant = "success" | "error" | "info";
type Toast = { id: string; title: string; description?: string; variant?: ToastVariant; ttl?: number };

type Ctx = {
  push: (t: Omit<Toast, "id">) => void;
};
const ToastCtx = React.createContext<Ctx | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);

  const push: Ctx["push"] = (t) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, ...t, ttl: t.ttl ?? 4500 };
    setItems((prev) => [...prev, toast]);
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, toast.ttl);
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`min-w-[260px] max-w-[360px] rounded-lg px-3 py-2 text-sm shadow-lg border ${
              t.variant === "error"
                ? "bg-red-600/90 border-red-400 text-white"
                : t.variant === "success"
                ? "bg-green-600/90 border-green-400 text-white"
                : "bg-neutral-900/90 border-neutral-800 text-neutral-100"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.description && <div className="opacity-90">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
