"use client";

import { createContext, useContext, useCallback, useState, useEffect, ReactNode, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return {
      confirm: async () => false,
    };
  }
  return ctx;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface ModalState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModal({ ...options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    modal?.resolve(true);
    setModal(null);
  }, [modal]);

  const handleCancel = useCallback(() => {
    modal?.resolve(false);
    setModal(null);
  }, [modal]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <ConfirmModalUI
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          variant={modal.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL UI
// ═══════════════════════════════════════════════════════════════════════════

function ConfirmModalUI({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const confirmColor =
    variant === "destructive"
      ? "bg-[#FF6A3D] hover:bg-[#FF6A3D]/80"
      : "bg-[#00F6E5] hover:bg-[#00F6E5]/80";

  const confirmTextColor =
    variant === "destructive" ? "text-white" : "text-black";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-[#1B1E20] border border-[#2A2F33] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        )}
        <p className="text-slate-300 text-sm whitespace-pre-line mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-[#2A2F33] hover:bg-[#353A3F] rounded-lg transition-colors"
          >
            {cancelLabel || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium ${confirmTextColor} ${confirmColor} rounded-lg transition-colors`}
          >
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmProvider;
