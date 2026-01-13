"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { RouteId } from "@/types/football";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: Date;
  diagram?: DiagramData;
}

export interface DiagramData {
  type: "coverage" | "route" | "formation" | "blitz" | "protection";
  data: any;
}

export interface CoachContextType {
  messages: CoachMessage[];
  isOpen: boolean;
  isLoading: boolean;
  addMessage: (content: string) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearMessages: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((content: string) => {
    // Add user message
    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate coach response (AI Coach is currently disabled)
    setTimeout(() => {
      const coachMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: "AI Coach is currently disabled. This feature is being updated to work with your playbook images.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, coachMessage]);
      setIsLoading(false);
    }, 500);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <CoachContext.Provider
      value={{
        messages,
        isOpen,
        isLoading,
        addMessage,
        toggleDrawer,
        openDrawer,
        closeDrawer,
        clearMessages,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  const context = useContext(CoachContext);
  if (context === undefined) {
    throw new Error("useCoach must be used within a CoachProvider");
  }
  return context;
}
