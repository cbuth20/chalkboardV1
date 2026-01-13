"use client";

// ═══════════════════════════════════════════════════════════════════════════
// MODE CONTEXT — Global state for Player/Coach mode switching
// ═══════════════════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type AppMode = "player" | "coach";

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

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
  const [mode, setModeState] = useState<AppMode>("player");

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
