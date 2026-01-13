"use client";

// ═══════════════════════════════════════════════════════════════════════════
// COACH DRAWER — Floating drawer for global Chalk Talk access
// Can be opened from anywhere in the platform
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";
// import { useCoach } from "./CoachContext";
import { CoachAvatar } from "./CoachAvatar";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { KnowledgeTabs } from "./KnowledgeTabs";
import Link from "next/link";

export function CoachDrawer() {
  // const {
  //   isOpen,
  //   closeDrawer,
  //   mode,
  //   activeTab,
  //   setActiveTab,
  //   messages,
  //   isProcessing,
  //   statusMessage,
  //   sendMessage,
  //   handleAction,
  //   handleQuickAction,
  //   clearMessages,
  // } = useCoach();

  // const messagesEndRef = useRef<HTMLDivElement>(null);

  // // Auto-scroll to bottom on new messages
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

  // // Close on Escape key
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === "Escape" && isOpen) {
  //       closeDrawer();
  //     }
  //   };
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [isOpen, closeDrawer]);

  // if (!isOpen) return null;

  return (
    <></>
    // <>
    //   {/* Backdrop */}
    //   <div
    //     className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
    //     onClick={closeDrawer}
    //   />

    //   {/* Drawer */}
    //   <div
    //     className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-gradient-to-br from-[#0A0A0A] to-[#0f172a] border-l border-[#1B1E20] shadow-2xl shadow-black/50 flex flex-col animate-slide-in-right"
    //   >
    //     {/* Header */}
    //     <div className="flex-shrink-0 border-b border-[#1B1E20] px-4 py-4">
    //       <div className="flex items-center justify-between mb-3">
    //         <CoachAvatar
    //           mode={mode}
    //           isProcessing={isProcessing}
    //           statusMessage={statusMessage}
    //           size="sm"
    //         />
    //         <div className="flex items-center gap-2">
    //           {/* Expand to Full Page */}
    //           <Link
    //             href="/ai-coach"
    //             onClick={closeDrawer}
    //             className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] transition-all"
    //             title="Open full page"
    //           >
    //             <ExpandIcon className="h-4 w-4" />
    //           </Link>

    //           {/* Clear Chat */}
    //           <button
    //             onClick={clearMessages}
    //             className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] transition-all"
    //             title="Clear chat"
    //           >
    //             <ClearIcon className="h-4 w-4" />
    //           </button>

    //           {/* Close */}
    //           <button
    //             onClick={closeDrawer}
    //             className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B1E20] transition-all"
    //             title="Close (Esc)"
    //           >
    //             <CloseIcon className="h-4 w-4" />
    //           </button>
    //         </div>
    //       </div>

    //       {/* Knowledge Tabs */}
    //       <KnowledgeTabs activeTab={activeTab} onTabChange={setActiveTab} />
    //     </div>

    //     {/* Messages Area */}
    //     <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
    //       {messages.map((message) => (
    //         <ChatMessage
    //           key={message.id}
    //           message={message}
    //           onActionClick={handleAction}
    //         />
    //       ))}

    //       {/* Processing Indicator */}
    //       {isProcessing && (
    //         <div className="flex items-center gap-3 text-slate-400">
    //           <div className="flex gap-1">
    //             <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: "0ms" }} />
    //             <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: "150ms" }} />
    //             <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: "300ms" }} />
    //           </div>
    //           <span className="text-xs">Coach is thinking...</span>
    //         </div>
    //       )}

    //       <div ref={messagesEndRef} />
    //     </div>

    //     {/* Input Area */}
    //     <div className="flex-shrink-0 border-t border-[#1B1E20] px-4 py-4 bg-[#0A0A0A]/80 backdrop-blur-sm">
    //       <ChatInput
    //         onSend={sendMessage}
    //         onActionClick={handleQuickAction}
    //         isProcessing={isProcessing}
    //         placeholder="Ask Chalk Talk..."
    //       />
    //     </div>
    //   </div>
    // </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING ACTION BUTTON — Global access to Chalk Talk
// ═══════════════════════════════════════════════════════════════════════════

export function CoachFAB() {
  // const { toggleDrawer, isOpen } = useCoach();

  // Don't show FAB if drawer is open
  // if (isOpen) return null;

  return (
    <></>
    // <button
    //   onClick={toggleDrawer}
    //   className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] font-bold text-sm uppercase tracking-wide shadow-lg shadow-[#00F6E5]/30 hover:shadow-xl hover:shadow-[#00F6E5]/40 hover:scale-105 transition-all duration-200 group"
    // >
    //   <CoachIcon className="h-5 w-5" />
    //   <span className="hidden sm:inline">Chalk Talk</span>
      
    //   {/* Pulse effect */}
    //   <span className="absolute -top-1 -right-1 flex h-3 w-3">
    //     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5C253] opacity-75" />
    //     <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F5C253]" />
    //   </span>
    // </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function CoachIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <path d="M12 4v-2" />
      <path d="M9 5l-1-1.5" />
      <path d="M15 5l1-1.5" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default CoachDrawer;

