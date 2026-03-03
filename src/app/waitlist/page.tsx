"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { LEGAL_BRAND_NAME } from "@/lib/brand";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;

    setIsSubmitting(true);
    
    // Simulate submission delay - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // TODO: Send to your backend/email service (e.g., Mailchimp, ConvertKit, Supabase)
    console.log("Waitlist signup:", { email, role });
    
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-deep-space-black flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 holographic-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-teal/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-5 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-teal to-ice-blue flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A0A0A">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              CHALKBOARD
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-teal/10 border border-neon-teal/20 mb-6">
                  <div className="w-2 h-2 rounded-full bg-neon-teal animate-pulse" />
                  <span className="text-xs font-semibold text-neon-teal uppercase tracking-wider">
                    Early Access
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  Join the Waitlist
                </h1>
                
                <p className="text-slate-400 leading-relaxed">
                  Be the first to train smarter. Get early access to {LEGAL_BRAND_NAME} and help shape the future of football preparation.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                    I am a...
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-[#1e293b] border border-slate-700 text-white focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    <option value="" disabled className="text-slate-500">Select your role</option>
                    <option value="player-hs">High School Player</option>
                    <option value="player-college">College Player</option>
                    <option value="player-pro">Professional Player</option>
                    <option value="coach-hs">High School Coach</option>
                    <option value="coach-college">College Coach</option>
                    <option value="coach-pro">Professional Coach</option>
                    <option value="parent">Parent</option>
                    <option value="trainer">Trainer / Instructor</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !email || !role}
                  className="w-full py-3.5 rounded-lg bg-gradient-to-r from-neon-teal to-ice-blue text-[#0A0A0A] font-bold text-sm uppercase tracking-wide transition-all hover:shadow-[0_0_30px_rgba(0,246,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </>
                  ) : (
                    "Join the Waitlist"
                  )}
                </button>

                {/* Consent Text */}
                <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">
                  By joining the waitlist, you agree to receive early access updates and product communications from {LEGAL_BRAND_NAME}. You can unsubscribe at any time.
                </p>
              </form>

              {/* Early Access Disclaimer */}
              <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  {LEGAL_BRAND_NAME} is currently in early access. Features, availability, and timelines are subject to change.
                </p>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-neon-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                You're on the list!
              </h2>
              
              <p className="text-slate-400 mb-8 leading-relaxed">
                Thanks for joining. We&apos;ll be in touch soon with early access details and updates on {LEGAL_BRAND_NAME}.
              </p>

              <div className="glass-card p-6 text-left mb-8">
                <p className="text-sm text-slate-300 mb-3">While you wait:</p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-teal mt-1.5 flex-shrink-0" />
                    Follow us for updates and football IQ content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-teal mt-1.5 flex-shrink-0" />
                    Share with teammates who want to prepare smarter
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-teal mt-1.5 flex-shrink-0" />
                    Check your inbox for a confirmation email
                  </li>
                </ul>
              </div>

              {/* Early Access Notice on Success */}
              <div className="mt-8 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  {LEGAL_BRAND_NAME} is currently in early access. Features, availability, and timelines are subject to change.
                </p>
              </div>

              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back to home
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
