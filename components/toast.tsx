"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

let addToastFn: ((t: Omit<Toast, "id">) => void) | null = null;

export function toast(type: Toast["type"], message: string) {
  addToastFn?.({ type, message });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Math.random().toString(36).substring(2, 10);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  if (toasts.length === 0) return null;

  const colors = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`animate-slide-up rounded-lg px-4 py-2.5 text-sm shadow-lg ${colors[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
