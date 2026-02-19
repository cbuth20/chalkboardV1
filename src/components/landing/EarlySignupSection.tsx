"use client";

import { useState } from "react";

export default function EarlySignupSection() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/early-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 md:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neon-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">You&apos;re on the list!</h3>
            <p className="text-slate-400">
              We&apos;ll be in touch soon with early access details.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-semibold text-neon-teal uppercase tracking-widest px-3 py-1 rounded-full bg-neon-teal/10 border border-neon-teal/20 mb-4">
              Early Access
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Get Early Access
            </h2>
            <p className="text-slate-400">
              Be one of the first to train with Chalkboard. We&apos;ll notify you when your spot is ready.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="early-first" className="block text-sm font-medium text-slate-400 mb-1.5">
                  First Name
                </label>
                <input
                  id="early-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal transition"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="early-last" className="block text-sm font-medium text-slate-400 mb-1.5">
                  Last Name
                </label>
                <input
                  id="early-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal transition"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="early-email" className="block text-sm font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                id="early-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal transition"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-[#0A0A0A] py-3.5 text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0A]/20 border-t-[#0A0A0A]" />
                  Submitting...
                </>
              ) : (
                "Get Early Access"
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
