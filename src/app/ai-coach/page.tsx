"use client";

// ═══════════════════════════════════════════════════════════════════════════
// CHALK TALK PAGE — Full-page Chalk Talk experience
// The command center for football intelligence
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import PlayerNavbar from "@/components/PlayerNavbar";
import {
  CoachAvatar,
  ChatMessage,
  ChatInput,
  KnowledgeTabs,
  type KnowledgeTab,
} from "@/components/ai-coach";
import type {
  CoachMessage,
  CoachMode,
  SuggestedAction,
  CoachContext,
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
  defineTerm,
  getPositionTerminology,
  explainPlayCall,
  translatePlayBetweenSystems,
  explainCoachingSystem,
} from "@/lib/ai-coach/service";
import type { RouteId } from "@/domain/football";

// ═══════════════════════════════════════════════════════════════════════════
// COACH CAPABILITIES DATA
// ═══════════════════════════════════════════════════════════════════════════

const COACH_CAPABILITIES: Record<KnowledgeTab, {
  title: string;
  description: string;
  actions: { label: string; query: string; icon: React.ReactNode }[];
}> = {
  general: {
    title: "Ask Anything",
    description: "Your personal football tutor. Ask any football question.",
    actions: [
      { label: "Coverage Basics", query: "Explain the difference between Cover 2 and Cover 3", icon: <ShieldIcon /> },
      { label: "Route Tree", query: "Teach me the route tree", icon: <RouteIcon /> },
      { label: "Pass Protection", query: "How does slide protection work?", icon: <BlockIcon /> },
      { label: "Pre-Snap Reads", query: "How do I read the defense pre-snap?", icon: <EyeIcon /> },
    ],
  },
  terminology: {
    title: "NFL Terminology",
    description: "Learn real coaching language, play calls, and offensive systems.",
    actions: [
      { label: "Define a Term", query: "What does audible mean?", icon: <BookIcon /> },
      { label: "QB Terms", query: "What are the key QB terminology terms?", icon: <ClipboardIcon /> },
      { label: "Play Call System", query: "Explain how NFL play calls work", icon: <SpeakerIcon /> },
      { label: "West Coast vs Air Raid", query: "What's the difference between West Coast and Air Raid offense?", icon: <BrainIcon /> },
    ],
  },
  assignments: {
    title: "Assignments",
    description: "Master your position-specific responsibilities.",
    actions: [
      { label: "WR Assignments", query: "What are my assignments as a receiver?", icon: <ClipboardIcon /> },
      { label: "Hot Routes", query: "Explain hot routes and sight adjustments", icon: <ZapIcon /> },
      { label: "Blocking Rules", query: "What are the receiver blocking rules?", icon: <ShieldIcon /> },
      { label: "Motion Rules", query: "When do I motion and what does it tell me?", icon: <ArrowIcon /> },
    ],
  },
  coverages: {
    title: "Coverage Recognition",
    description: "Learn to identify and attack every coverage shell.",
    actions: [
      { label: "Cover 1", query: "Explain Cover 1 man coverage", icon: <CoverageIcon /> },
      { label: "Cover 2", query: "How do I attack Cover 2?", icon: <CoverageIcon /> },
      { label: "Cover 3", query: "What are the weaknesses of Cover 3?", icon: <CoverageIcon /> },
      { label: "Cover 4", query: "Break down quarters coverage", icon: <CoverageIcon /> },
    ],
  },
  fronts: {
    title: "Defensive Fronts",
    description: "Read fronts and identify pressure packages.",
    actions: [
      { label: "4-3 Defense", query: "Explain the 4-3 defensive front", icon: <FrontIcon /> },
      { label: "3-4 Defense", query: "How does the 3-4 work?", icon: <FrontIcon /> },
      { label: "Blitz ID", query: "How do I identify a blitz pre-snap?", icon: <FireIcon /> },
      { label: "Pressure Pickup", query: "How does the RB identify his blitz pickup?", icon: <ShieldIcon /> },
    ],
  },
  routes: {
    title: "Route Techniques",
    description: "Master releases, stems, breaks, and leverage adjustments.",
    actions: [
      { label: "Slant Route", query: "Teach me the slant route technique", icon: <RouteIcon /> },
      { label: "Post Route", query: "How do I run the post route?", icon: <RouteIcon /> },
      { label: "Out Route", query: "What's the technique for the out route?", icon: <RouteIcon /> },
      { label: "Release Techniques", query: "How do I release vs press coverage?", icon: <SprintIcon /> },
    ],
  },
  playbook: {
    title: "Playbook Study",
    description: "Deep dive into plays, concepts, and formations.",
    actions: [
      { label: "Mesh Concept", query: "Explain the mesh concept", icon: <PlayIcon /> },
      { label: "Smash Concept", query: "How does the smash concept work?", icon: <PlayIcon /> },
      { label: "Trips Formation", query: "Break down trips right", icon: <FormationIcon /> },
      { label: "RPO Basics", query: "What is an RPO and how does it work?", icon: <BrainIcon /> },
    ],
  },
  "film-room": {
    title: "Film Study",
    description: "Analyze plays and develop your football IQ.",
    actions: [
      { label: "Pre-Snap Keys", query: "What should I look for pre-snap?", icon: <FilmIcon /> },
      { label: "Post-Snap Reads", query: "How do I read coverage post-snap?", icon: <EyeIcon /> },
      { label: "Leverage Cues", query: "How do I use defender leverage?", icon: <TargetIcon /> },
      { label: "Pattern Matching", query: "What is pattern match coverage?", icon: <PuzzleIcon /> },
    ],
  },
  games: {
    title: "Game Mode Help",
    description: "Get hints and explanations during study games.",
    actions: [
      { label: "Coverage ID Help", query: "Help me identify coverages", icon: <HelpIcon /> },
      { label: "Blitz ID Help", query: "Give me hints for blitz ID", icon: <HelpIcon /> },
      { label: "Route Tag Help", query: "Help me with route recognition", icon: <HelpIcon /> },
      { label: "Formation Help", query: "Help me identify formations", icon: <HelpIcon /> },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AICoachPage() {
  // State
  const [mode, setMode] = useState<CoachMode>("teach");
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("general");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [context, setContext] = useState<CoachContext>({
    module: "general",
    difficultyLevel: "intermediate",
  });
  const [showCapabilities, setShowCapabilities] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeSentRef = useRef(false);

  // Add welcome message on mount
  useEffect(() => {
    if (!welcomeSentRef.current) {
      const welcome = getWelcomeMessage(context.module);
      setMessages([welcome]);
      welcomeSentRef.current = true;
    }
  }, [context.module]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Process user message and generate response
  const processUserMessage = useCallback(
    async (userMessage: string): Promise<CoachMessage> => {
      const lowerMessage = userMessage.toLowerCase();
      let responseContent;
      let responseMode: CoachMode = mode;

      // Explain/Teach intent
      if (
        lowerMessage.includes("explain") ||
        lowerMessage.includes("what is") ||
        lowerMessage.includes("how does") ||
        lowerMessage.includes("teach me") ||
        lowerMessage.includes("break down")
      ) {
        responseMode = "teach";
        const concept = extractConcept(userMessage);
        responseContent = explainConcept({
          concept,
          depth: context.difficultyLevel === "beginner" ? "simple" : "standard",
          includeVisual: true,
        });
      }
      // Draw/Diagram intent
      else if (
        lowerMessage.includes("draw") ||
        lowerMessage.includes("diagram") ||
        lowerMessage.includes("show me")
      ) {
        responseMode = "draw";
        const diagram = drawPlay({
          formation: "shotgun-spread",
          coverage: "cover-3",
        });
        responseContent = [
          { type: "text" as const, text: "Here's the diagram you requested:" },
          { type: "diagram" as const, diagram },
        ];
      }
      // Quiz intent
      else if (
        lowerMessage.includes("quiz") ||
        lowerMessage.includes("test me")
      ) {
        responseMode = "quiz";
        const flashcards = generateFlashcards("all", 1);
        if (flashcards.length > 0) {
          responseContent = [{ type: "flashcard" as const, flashcard: flashcards[0] }];
        } else {
          responseContent = [{ type: "text" as const, text: "Let me find a quiz question for you..." }];
        }
      }
      // Route learning intent
      else if (
        lowerMessage.includes("route") &&
        (lowerMessage.includes("run") || lowerMessage.includes("technique") || lowerMessage.includes("teach"))
      ) {
        responseMode = "teach";
        const routeName = extractRouteName(userMessage);
        if (routeName) {
          responseContent = routeTeach({
            routeId: routeName as RouteId,
            includeVariations: true,
          });
        } else {
          responseContent = [
            {
              type: "text" as const,
              text: "Which route would you like me to teach? I can cover slants, outs, curls, posts, corners, digs, and more.",
            },
          ];
        }
      }
      // Game assist intent
      else if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("hint")
      ) {
        responseMode = "assist";
        responseContent = gameAssist({
          gameName: activeTab === "games" ? "coverage-id" : "general",
          needsHint: lowerMessage.includes("hint"),
          needsExplanation: true,
        });
      }
      // Coverage analysis intent
      else if (
        lowerMessage.includes("coverage") ||
        lowerMessage.includes("defense")
      ) {
        responseMode = "analyze";
        const analysis = analyzeCoverage({});
        responseContent = [
          {
            type: "text" as const,
            text: `Based on what I can see, this looks like **${analysis.coverageGuess.name}**.\n\n${analysis.coachingNotes.join("\n\n")}`,
          },
        ];
      }
      // Terminology - Define a term
      else if (
        lowerMessage.includes("what does") && lowerMessage.includes("mean") ||
        lowerMessage.includes("define") ||
        lowerMessage.includes("what is a ") ||
        lowerMessage.includes("what's a ")
      ) {
        responseMode = "teach";
        const termMatch = userMessage.match(/(?:what does|define|what is a|what's a)\s+["']?([^"'?]+)["']?/i);
        const term = termMatch ? termMatch[1].replace(/\s*mean\s*$/i, "").trim() : userMessage;
        responseContent = defineTerm(term);
      }
      // Terminology - Position terms
      else if (
        lowerMessage.includes("terminology") &&
        (lowerMessage.includes("qb") || lowerMessage.includes("quarterback") ||
         lowerMessage.includes("wr") || lowerMessage.includes("receiver") ||
         lowerMessage.includes("rb") || lowerMessage.includes("running back") ||
         lowerMessage.includes("ol") || lowerMessage.includes("lineman") ||
         lowerMessage.includes("db") || lowerMessage.includes("defensive back"))
      ) {
        responseMode = "teach";
        let position = "qb";
        if (lowerMessage.includes("wr") || lowerMessage.includes("receiver")) position = "wr";
        if (lowerMessage.includes("rb") || lowerMessage.includes("running back")) position = "rb";
        if (lowerMessage.includes("ol") || lowerMessage.includes("lineman")) position = "ol";
        if (lowerMessage.includes("db") || lowerMessage.includes("defensive back")) position = "db";
        if (lowerMessage.includes("te") || lowerMessage.includes("tight end")) position = "te";
        if (lowerMessage.includes("lb") || lowerMessage.includes("linebacker")) position = "lb";
        responseContent = getPositionTerminology(position);
      }
      // Terminology - Play calls
      else if (
        lowerMessage.includes("play call") ||
        lowerMessage.includes("call work") ||
        lowerMessage.includes("huddle call")
      ) {
        responseMode = "teach";
        responseContent = explainPlayCall(userMessage);
      }
      // Terminology - Offensive systems
      else if (
        lowerMessage.includes("west coast") ||
        lowerMessage.includes("air raid") ||
        lowerMessage.includes("erhardt") ||
        lowerMessage.includes("coryell") ||
        lowerMessage.includes("shanahan") ||
        lowerMessage.includes("spread option") ||
        (lowerMessage.includes("offensive") && lowerMessage.includes("system"))
      ) {
        responseMode = "teach";
        if (lowerMessage.includes("west coast")) {
          responseContent = explainCoachingSystem("west-coast");
        } else if (lowerMessage.includes("air raid")) {
          responseContent = explainCoachingSystem("air-raid");
        } else if (lowerMessage.includes("erhardt") || lowerMessage.includes("perkins")) {
          responseContent = explainCoachingSystem("erhardt-perkins");
        } else if (lowerMessage.includes("coryell")) {
          responseContent = explainCoachingSystem("coryell");
        } else if (lowerMessage.includes("shanahan") || lowerMessage.includes("mcvay")) {
          responseContent = explainCoachingSystem("shanahan");
        } else if (lowerMessage.includes("spread option")) {
          responseContent = explainCoachingSystem("spread-option");
        } else {
          responseContent = translatePlayBetweenSystems(userMessage);
        }
      }
      // Terminology - Translate between systems
      else if (
        lowerMessage.includes("translate") ||
        lowerMessage.includes("in different systems") ||
        lowerMessage.includes("across systems")
      ) {
        responseMode = "teach";
        const conceptMatch = userMessage.match(/translate\s+["']?([^"']+)["']?/i);
        responseContent = translatePlayBetweenSystems(conceptMatch ? conceptMatch[1] : userMessage);
      }
      // Default response
      else {
        responseContent = [
          { type: "text" as const, text: getCoachResponse(userMessage) },
        ];
      }

      setMode(responseMode);

      const suggestedActions: SuggestedAction[] = [
        { id: "explain-more", label: "Explain More", action: "ask" },
        { id: "show-diagram", label: "Show Diagram", action: "diagram" },
        { id: "quiz-me", label: "Quiz Me", action: "quiz" },
      ];

      return createCoachMessage(responseContent, responseMode, suggestedActions);
    },
    [mode, context.difficultyLevel, activeTab]
  );

  // Send message handler
  const sendMessage = async (message: string) => {
    if (isProcessing) return;

    // Hide capabilities panel after first message
    setShowCapabilities(false);

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
  };

  // Handle suggested action clicks
  const handleAction = (action: SuggestedAction) => {
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
  };

  // Handle quick action toolbar clicks
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "ask":
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
  };

  // Clear chat
  const clearMessages = () => {
    setMessages([]);
    welcomeSentRef.current = false;
    setShowCapabilities(true);
    const welcome = getWelcomeMessage(context.module);
    setMessages([welcome]);
    welcomeSentRef.current = true;
  };

  // Handle tab change
  const handleTabChange = (tab: KnowledgeTab) => {
    setActiveTab(tab);
    setContext((prev) => ({ ...prev, module: tab === "film-room" ? "film-room" : tab as CoachContext["module"] }));
  };

  // Handle capability card click
  const handleCapabilityClick = (query: string) => {
    sendMessage(query);
  };

  const currentCapabilities = COACH_CAPABILITIES[activeTab];

  return (
    <div className="min-h-screen bg-[#0A0A0A] holographic-grid flex flex-col">
      <PlayerNavbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        {/* Left Panel - Capabilities & Quick Actions */}
        <aside
          className={`w-full lg:w-80 xl:w-96 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[#1B1E20] bg-gradient-to-b from-[#0d1117] to-[#0A0A0A] overflow-y-auto transition-all duration-300 ${
            showCapabilities ? "max-h-[400px] lg:max-h-full" : "max-h-0 lg:max-h-full lg:w-20"
          }`}
        >
          <div className={`p-4 lg:p-6 ${!showCapabilities && "lg:hidden"}`}>
            {/* Coach Persona Card */}
            <div className="glass-card p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <CoachAvatar mode={mode} size="lg" showLabel={false} />
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00F6E5]">
                    Chalk Talk
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Position Coach Mode
                  </span>
                </div>
              </div>

              {/* Coach Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1B1E20]">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">∞</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Knowledge</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#00F6E5]">24/7</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#F5C253]">NFL</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Caliber</div>
                </div>
              </div>
            </div>

            {/* Current Domain Card */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Current Focus
              </h3>
              <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00F6E5]/15 border border-[#00F6E5]/30">
                    <BrainIcon className="h-5 w-5 text-[#00F6E5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentCapabilities.title}</h4>
                    <p className="text-xs text-slate-500">{currentCapabilities.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Popular Questions
              </h3>
              <div className="space-y-2">
                {currentCapabilities.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCapabilityClick(action.query)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1B1E20]/50 border border-[#1B1E20] hover:border-[#00F6E5]/30 hover:bg-[#00F6E5]/5 transition-all group text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B1E20] group-hover:bg-[#00F6E5]/15 transition-colors">
                      <span className="h-4 w-4 text-slate-400 group-hover:text-[#00F6E5] transition-colors">
                        {action.icon}
                      </span>
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-slate-600 group-hover:text-[#00F6E5] ml-auto transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Coach Mode
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(["teach", "quiz", "film"] as CoachMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                      mode === m
                        ? "bg-[#00F6E5]/15 text-[#00F6E5] border border-[#00F6E5]/30"
                        : "bg-[#1B1E20] text-slate-400 border border-transparent hover:text-white hover:border-slate-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Collapsed State (Desktop) */}
          <div className={`hidden lg:flex flex-col items-center py-6 gap-4 ${showCapabilities ? "lg:hidden" : ""}`}>
            <button
              onClick={() => setShowCapabilities(true)}
              className="p-3 rounded-xl bg-[#1B1E20] text-slate-400 hover:text-[#00F6E5] hover:bg-[#00F6E5]/10 transition-all"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <CoachAvatar mode={mode} size="sm" showLabel={false} />
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Header with Tabs */}
          <header className="flex-shrink-0 border-b border-[#1B1E20] bg-[#0A0A0A]/80 backdrop-blur-xl">
            <div className="px-4 lg:px-6 py-3">
              <div className="flex items-center justify-between mb-3">
                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className="lg:hidden">
                    <CoachAvatar mode={mode} size="sm" showLabel={false} />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                      Chalk Talk
                      {isProcessing && (
                        <span className="flex items-center gap-1.5 text-xs font-normal text-[#00F6E5]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00F6E5] animate-pulse" />
                          {statusMessage}
                        </span>
                      )}
                    </h1>
                    <p className="text-xs text-slate-500 hidden sm:block">
                      Your personal football tutor — powered by real NFL knowledge
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Toggle Panel Button (Mobile) */}
                  <button
                    onClick={() => setShowCapabilities(!showCapabilities)}
                    className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg bg-[#1B1E20] text-slate-400 hover:text-white transition-colors"
                  >
                    {showCapabilities ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </button>

                  {/* Clear Chat */}
                  <button
                    onClick={clearMessages}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1B1E20] text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-white transition-colors"
                  >
                    <ClearIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>

                  {/* Link to Games */}
                  <Link
                    href="/games"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00F6E5]/10 border border-[#00F6E5]/20 text-xs font-semibold uppercase tracking-wide text-[#00F6E5] hover:bg-[#00F6E5]/20 transition-colors"
                  >
                    <GamepadIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Play Games</span>
                  </Link>
                </div>
              </div>

              {/* Knowledge Tabs */}
              <KnowledgeTabs activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4 scrollbar-thin">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onActionClick={handleAction}
              />
            ))}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center gap-3 text-slate-400">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs">Coach is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-[#1B1E20] px-4 lg:px-6 py-4 bg-gradient-to-t from-[#0A0A0A] to-transparent">
            <ChatInput
              onSend={sendMessage}
              onActionClick={handleQuickAction}
              isProcessing={isProcessing}
              placeholder={`Ask about ${currentCapabilities.title.toLowerCase()}...`}
            />
          </div>
        </main>

        {/* Right Panel - Context & History (Desktop) */}
        <aside className="hidden xl:block w-72 flex-shrink-0 border-l border-[#1B1E20] bg-gradient-to-b from-[#0d1117] to-[#0A0A0A] overflow-y-auto">
          <div className="p-6">
            {/* Session Info */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Session
              </h3>
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Messages</span>
                  <span className="text-sm font-bold text-white">{messages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Mode</span>
                  <span className="text-sm font-bold text-[#00F6E5] capitalize">{mode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Domain</span>
                  <span className="text-sm font-bold text-white capitalize">{activeTab}</span>
                </div>
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Difficulty
              </h3>
              <div className="flex flex-col gap-2">
                {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setContext((prev) => ({ ...prev, difficultyLevel: level }))}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all text-left ${
                      context.difficultyLevel === level
                        ? "bg-[#00F6E5]/15 text-[#00F6E5] border border-[#00F6E5]/30"
                        : "bg-[#1B1E20] text-slate-400 border border-transparent hover:text-white"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Reference */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Quick Reference
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20]/50">
                  <div className="h-2 w-2 rounded-full bg-[#00F6E5]" />
                  <span className="text-xs text-slate-400">Single High = Cov 1/3</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20]/50">
                  <div className="h-2 w-2 rounded-full bg-[#3DF3FF]" />
                  <span className="text-xs text-slate-400">Two High = Cov 2/4</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1B1E20]/50">
                  <div className="h-2 w-2 rounded-full bg-[#FF6A3D]" />
                  <span className="text-xs text-slate-400">No Safety = Cov 0</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
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
    /break\s+down\s+(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return message.replace(/explain|what is|how does|teach me|break down/gi, "").trim();
}

function extractRouteName(message: string): string | null {
  const routeNames = [
    "slant", "out", "in", "curl", "corner", "post", "go",
    "hitch", "flat", "wheel", "seam", "drag", "dig",
  ];

  const lowerMessage = message.toLowerCase();
  for (const route of routeNames) {
    if (lowerMessage.includes(route)) {
      return route;
    }
  }

  return null;
}

function getCoachResponse(message: string): string {
  const responses = [
    "Good question. Let me break that down for you.\n\nIn football, understanding the fundamentals is key. Every play starts with alignment, assignment, and technique. Master those three things and you'll be ahead of most players.\n\n**Want me to dive deeper into any of these areas?**",
    "That's something every player needs to know. Here's the deal:\n\nFootball is a game of inches and seconds. The mental edge comes from knowing what's coming before it happens. Film study, pattern recognition, and understanding your opponent — that's how you win.\n\n**Should I quiz you on this?**",
    "Let me coach you up on that.\n\nThe best players I've worked with all have one thing in common: they're students of the game. They don't just practice — they prepare. Every rep is an opportunity to get better.\n\n**Want to see a diagram?**",
    "Great focus area. Here's what you need to know:\n\nEvery position has keys. Safeties read the backfield, corners read receivers, linebackers read linemen. Know your keys, trust your eyes, and let your athleticism take over.\n\n**Want me to break down your position specifically?**",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function ShieldIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function RouteIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V7" />
      <path d="M7 12l5-5 5 5" />
    </svg>
  );
}

function BlockIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function EyeIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BookIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  );
}

function SpeakerIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function ClipboardIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

function ZapIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ArrowIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CoverageIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function FrontIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
    </svg>
  );
}

function FireIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function SprintIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H17" />
    </svg>
  );
}

function PlayIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function FormationIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function BrainIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
    </svg>
  );
}

function FilmIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
    </svg>
  );
}

function TargetIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function PuzzleIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.707l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.611-1.611a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.707l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
    </svg>
  );
}

function HelpIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronUpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ClearIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function GamepadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4" />
      <path d="M8 10v4" />
      <circle cx="17" cy="10" r="1" fill="currentColor" />
      <circle cx="17" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function MenuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
