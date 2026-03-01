"use client";

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// TOAST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return a no-op when used outside provider (prevents crashes)
    return {
      toasts: [],
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST ITEM
// ═══════════════════════════════════════════════════════════════════════════

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColor =
    toast.type === "success"
      ? "bg-[#00F6E5]/10 border-[#00F6E5]/30"
      : toast.type === "error"
        ? "bg-[#FF6A3D]/10 border-[#FF6A3D]/30"
        : toast.type === "warning"
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-slate-800/90 border-slate-700";

  const textColor =
    toast.type === "success"
      ? "text-[#00F6E5]"
      : toast.type === "error"
        ? "text-[#FF6A3D]"
        : toast.type === "warning"
          ? "text-amber-400"
          : "text-slate-200";

  const Icon =
    toast.type === "success"
      ? CheckIcon
      : toast.type === "error"
        ? XCircleIcon
        : toast.type === "warning"
          ? WarningIcon
          : InfoIcon;

  return (
    <div
      className={`animate-slide-in flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${bgColor}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${textColor}`} />
      <span className={`text-sm font-medium ${textColor}`}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.6 14.86A1.98 1.98 0 003.4 21h17.2a1.98 1.98 0 001.71-2.98L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default ToastProvider;
