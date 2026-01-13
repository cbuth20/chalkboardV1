"use client";

// ═══════════════════════════════════════════════════════════════════════════
// COACH CONTEXT — Global state management for Chalk Talk
// Provides coach functionality across the entire platform
// ═══════════════════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type {
  CoachMessage,
  CoachMode,
  CoachContext as CoachContextType,
  SuggestedAction,
} from "@/lib/ai-coach/types";
import {
  explainConcept,
  drawPlay,
  analyzeCoverage,
  generateFlashcards,
  gradeUserResponse,
  routeTeach,
  gameAssist,
  installTeaching,
  createCoachMessage,
  createUserMessage,
  getWelcomeMessage,
} from "@/lib/ai-coach/service";
import type { KnowledgeTab } from "./KnowledgeTabs";
import type { RouteId } from "@/domain/football";

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CoachState {
  isOpen: boolean;
  isFullPage: boolean;
  mode: CoachMode;
  activeTab: KnowledgeTab;
  messages: CoachMessage[];
  isProcessing: boolean;
  statusMessage: string;
  context: CoachContextType;
}

interface CoachActions {
  // UI Controls
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setFullPage: (isFullPage: boolean) => void;
  setMode: (mode: CoachMode) => void;
  setActiveTab: (tab: KnowledgeTab) => void;

  // Messaging
  sendMessage: (message: string) => void;
  handleAction: (action: SuggestedAction) => void;
  handleQuickAction: (actionId: string) => void;
  clearMessages: () => void;

  // Context Updates
  setContext: (context: Partial<CoachContextType>) => void;

  // Quick Access Functions
  askCoach: (question: string, context?: Partial<CoachContextType>) => void;
  explainThis: (concept: string) => void;
  drawDiagram: (type: string, data?: unknown) => void;
  quizMe: (topic?: string) => void;
}

interface CoachProviderValue extends CoachState, CoachActions {}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT CREATION
// ═══════════════════════════════════════════════════════════════════════════

const CoachStateContext = createContext<CoachProviderValue | null>(null);

export function useCoach() {
  const context = useContext(CoachStateContext);
  if (!context) {
    throw new Error("useCoach must be used within a CoachProvider");
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface CoachProviderProps {
  children: ReactNode;
}

export function CoachProvider({ children }: CoachProviderProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [mode, setMode] = useState<CoachMode>("teach");
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("general");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [context, setContextState] = useState<CoachContextType>({
    module: "general",
    difficultyLevel: "intermediate",
  });

  // Track if welcome message was sent
  const welcomeSentRef = useRef(false);

  // Add welcome message on first open
  const addWelcomeMessage = useCallback(() => {
    if (!welcomeSentRef.current) {
      const welcome = getWelcomeMessage(context.module);
      setMessages([welcome]);
      welcomeSentRef.current = true;
    }
  }, [context.module]);

  // ═══════════════════════════════════════════════════════════════════════════
  // UI CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    addWelcomeMessage();
  }, [addWelcomeMessage]);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isOpen, openDrawer, closeDrawer]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  const processUserMessage = useCallback(
    async (userMessage: string): Promise<CoachMessage> => {
      const lowerMessage = userMessage.toLowerCase();

      // Detect mode from user message
      let responseMode: CoachMode = mode;

      if (
        lowerMessage.includes("explain") ||
        lowerMessage.includes("what is") ||
        lowerMessage.includes("how does") ||
        lowerMessage.includes("teach me")
      ) {
        responseMode = "teach";
      } else if (
        lowerMessage.includes("draw") ||
        lowerMessage.includes("diagram") ||
        lowerMessage.includes("show me")
      ) {
        responseMode = "draw";
      } else if (
        lowerMessage.includes("quiz") ||
        lowerMessage.includes("test me")
      ) {
        responseMode = "quiz";
      } else if (
        lowerMessage.includes("coverage") ||
        lowerMessage.includes("defense") ||
        lowerMessage.includes("analyze")
      ) {
        responseMode = "analyze";
      } else if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("hint")
      ) {
        responseMode = "assist";
      }

      setMode(responseMode);

      try {
        // Build conversation history from messages (last 6 messages for context)
        const conversationHistory = messages
          .slice(-6)
          .map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: Array.isArray(msg.content)
              ? msg.content.map(c => c.type === "text" ? c.text : "").join("\n")
              : msg.content,
          }));

        // Call the Netlify function
        const response = await fetch('/.netlify/functions/coach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory,
            mode: responseMode,
            context: {
              module: context.module,
              difficultyLevel: context.difficultyLevel,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from coach');
        }

        const data = await response.json();

        // Create response content
        const responseContent = [
          {
            type: "text" as const,
            text: data.response,
          },
        ];

        const suggestedActions: SuggestedAction[] = [
          { id: "explain-more", label: "Explain More", action: "ask" },
          { id: "show-diagram", label: "Show Diagram", action: "diagram" },
          { id: "quiz-me", label: "Quiz Me", action: "quiz" },
        ];

        return createCoachMessage(responseContent, responseMode, suggestedActions);
      } catch (error) {
        console.error('Error processing message:', error);

        // Fallback response if API fails
        const responseContent = [
          {
            type: "text" as const,
            text: "I'm having trouble connecting right now. Let me give you some general guidance:\n\nFootball is all about preparation and execution. Study your playbook, understand your assignments, and trust your training. What specific area would you like to focus on?",
          },
        ];

        const suggestedActions: SuggestedAction[] = [
          { id: "try-again", label: "Try Again", action: "ask" },
        ];

        return createCoachMessage(responseContent, responseMode, suggestedActions);
      }
    },
    [mode, context.difficultyLevel, context.module, messages]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (isProcessing) return;

      // Add user message
      const userMsg = createUserMessage(message);
      setMessages((prev) => [...prev, userMsg]);

      // Process and respond
      setIsProcessing(true);
      setStatusMessage("Analyzing");

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await processUserMessage(message);
      setMessages((prev) => [...prev, response]);

      setIsProcessing(false);
      setStatusMessage("");
    },
    [isProcessing, processUserMessage]
  );

  const handleAction = useCallback(
    (action: SuggestedAction) => {
      switch (action.action) {
        case "ask":
          if (typeof action.payload === "string") {
            sendMessage(action.payload);
          }
          break;
        case "diagram":
          sendMessage("Draw me a diagram");
          break;
        case "quiz":
          sendMessage("Quiz me");
          break;
        case "simplify":
          sendMessage("Can you simplify that?");
          break;
        case "film":
          sendMessage("Break down the film for me");
          break;
        case "next":
          sendMessage("Next question please");
          break;
      }
    },
    [sendMessage]
  );

  const handleQuickAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "ask":
          // Just focus the input
          break;
        case "diagram":
          sendMessage("Draw me a play diagram");
          break;
        case "film":
          sendMessage("Help me break down this film");
          break;
        case "quiz":
          sendMessage("Give me a quiz question");
          break;
        case "simplify":
          sendMessage("Can you explain that more simply?");
          break;
      }
    },
    [sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    welcomeSentRef.current = false;
    addWelcomeMessage();
  }, [addWelcomeMessage]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT UPDATES
  // ═══════════════════════════════════════════════════════════════════════════

  const setContext = useCallback((updates: Partial<CoachContextType>) => {
    setContextState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ACCESS FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const askCoach = useCallback(
    (question: string, ctx?: Partial<CoachContextType>) => {
      if (ctx) setContext(ctx);
      openDrawer();
      setTimeout(() => sendMessage(question), 100);
    },
    [openDrawer, sendMessage, setContext]
  );

  const explainThis = useCallback(
    (concept: string) => {
      askCoach(`Explain ${concept} to me`);
    },
    [askCoach]
  );

  const drawDiagram = useCallback(
    (type: string) => {
      askCoach(`Draw me a ${type} diagram`);
    },
    [askCoach]
  );

  const quizMe = useCallback(
    (topic?: string) => {
      askCoach(topic ? `Quiz me on ${topic}` : "Give me a quiz question");
    },
    [askCoach]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVIDER VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  const value: CoachProviderValue = {
    // State
    isOpen,
    isFullPage,
    mode,
    activeTab,
    messages,
    isProcessing,
    statusMessage,
    context,

    // Actions
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setFullPage: setIsFullPage,
    setMode,
    setActiveTab,
    sendMessage,
    handleAction,
    handleQuickAction,
    clearMessages,
    setContext,
    askCoach,
    explainThis,
    drawDiagram,
    quizMe,
  };

  return (
    <CoachStateContext.Provider value={value}>
      {children}
    </CoachStateContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function extractConcept(message: string): string {
  const patterns = [
    /explain\s+(?:the\s+)?(.+?)(?:\s+to\s+me|\?|$)/i,
    /what\s+is\s+(?:a\s+)?(.+?)(?:\?|$)/i,
    /how\s+does\s+(.+?)\s+work/i,
    /teach\s+me\s+(?:about\s+)?(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return message.replace(/explain|what is|how does|teach me/gi, "").trim();
}

function extractRouteName(message: string): string | null {
  const routeNames = [
    "slant",
    "out",
    "in",
    "curl",
    "corner",
    "post",
    "go",
    "hitch",
    "flat",
    "wheel",
    "seam",
    "drag",
    "dig",
  ];

  const lowerMessage = message.toLowerCase();
  for (const route of routeNames) {
    if (lowerMessage.includes(route)) {
      return route as any;
    }
  }

  return null;
}

function getCoachResponse(message: string): string {
  const responses = [
    "Good question. Let me break that down for you.\n\nIn football, understanding the fundamentals is key. Every play starts with alignment, assignment, and technique. Master those three things and you'll be ahead of most players.",
    "That's something every player needs to know. Here's the deal:\n\nFootball is a game of inches and seconds. The mental edge comes from knowing what's coming before it happens. Film study, pattern recognition, and understanding your opponent — that's how you win.",
    "Let me coach you up on that.\n\nThe best players I've worked with all have one thing in common: they're students of the game. They don't just practice — they prepare. Every rep is an opportunity to get better.",
    "Great focus area. Here's what you need to know:\n\nEvery position has keys. Safeties read the backfield, corners read receivers, linebackers read linemen. Know your keys, trust your eyes, and let your athleticism take over.",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export default CoachProvider;

