"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AI BREAKDOWN PANEL — Coach Analysis & Q&A
// AI-powered play analysis and coaching insights
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { useFilmRoom } from '../FilmRoomContext';
import { CoachNotes } from './CoachNotes';
import { PlayAnalysis } from './PlayAnalysis';

interface Message {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: Date;
}

export function AIBreakdownPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'notes'>('analysis');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentClip, askCoach } = useFilmRoom();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quick questions
  const quickQuestions = [
    "What coverage is this?",
    "What's the RB's read?",
    "Who busted here?",
    "What's the backside doing?",
    "Coaching note for me?",
  ];

  const handleSend = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askCoach(question);
      
      const coachMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'coach',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'coach',
        content: "I couldn't analyze that right now. Try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  if (!currentClip) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4">
        <CoachIcon className="h-12 w-12 text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm text-center">
          Load a clip to get AI coaching insights
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1B1E20]">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0A]">
          {[
            { key: 'analysis', label: 'Analysis', icon: <ChartIcon className="h-4 w-4" /> },
            { key: 'chat', label: 'Ask Coach', icon: <ChatIcon className="h-4 w-4" /> },
            { key: 'notes', label: 'Notes', icon: <NotesIcon className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'bg-[#00F6E5]/20 text-[#00F6E5]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'analysis' && <PlayAnalysis clip={currentClip} />}
        
        {activeTab === 'notes' && <CoachNotes clip={currentClip} />}
        
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#00F6E5]/10 mb-4">
                    <CoachIcon className="h-8 w-8 text-[#00F6E5]" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Ask the AI Coach</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Get instant analysis on this play. Ask about coverage, assignments, or coaching points.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-[#00F6E5] text-[#0A0A0A]'
                          : 'bg-[#1B1E20] text-white'
                      }`}
                    >
                      {message.role === 'coach' && (
                        <div className="flex items-center gap-2 mb-2">
                          <CoachIcon className="h-4 w-4 text-[#00F6E5]" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00F6E5]">
                            AI Coach
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-[#00F6E5] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">Coach is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 0 && (
              <div className="flex-shrink-0 px-4 pb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
                  Quick Questions
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 rounded-lg bg-[#1B1E20] text-xs font-medium text-slate-300 hover:bg-[#00F6E5]/15 hover:text-[#00F6E5] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-[#1B1E20]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this play..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#1B1E20] border border-transparent text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00F6E5]/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00F6E5] to-[#00d4c5] text-[#0A0A0A] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#00F6E5]/30"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

function CoachIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <path d="M12 4v-2" />
      <path d="M9 5l-1-1.5" />
      <path d="M15 5l1-1.5" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function NotesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default AIBreakdownPanel;








