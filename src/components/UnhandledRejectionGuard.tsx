"use client";

import { useEffect } from "react";

function isAbortError(reason: unknown) {
  if (!reason) return false;
  const anyReason = reason as any;
  const name = typeof anyReason?.name === "string" ? anyReason.name : "";
  const message = typeof anyReason?.message === "string" ? anyReason.message : "";
  return (
    name === "AbortError" ||
    message.includes("signal is aborted") ||
    message.includes("The operation was aborted")
  );
}

/**
 * Netlify/Next route transitions (and some fetch timeouts) can produce benign
 * AbortError unhandled rejections that clutter logs or break hydration in some setups.
 * We suppress ONLY AbortErrors.
 */
export function UnhandledRejectionGuard() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAbortError(event.reason)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

