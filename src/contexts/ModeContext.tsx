"use client";

// ═══════════════════════════════════════════════════════════════════════════
// MODE CONTEXT — Global state for Player/Coach mode switching
// ═══════════════════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export type AppMode = "player" | "coach";

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);
const MODE_STORAGE_KEY = "chalkboard_app_mode";

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}

interface ModeProviderProps {
  children: ReactNode;
}

export function ModeProvider({ children }: ModeProviderProps) {
  // Always start with default to avoid hydration mismatch
  const [mode, setModeState] = useState<AppMode>("player");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === "coach" || saved === "player") {
      setModeState(saved);
    }
  }, []);

  // Save to localStorage whenever mode changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    }
  }, [mode, isHydrated]);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === "player" ? "coach" : "player"));
  }, []);

  const value: ModeContextValue = {
    mode,
    setMode,
    toggleMode,
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}
