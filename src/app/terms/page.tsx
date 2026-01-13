import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service — Chalkboard",
  description: "Terms of Service for Chalkboard Sports LLC",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-deep-space-black flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 holographic-grid opacity-30" />
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
      <main className="relative z-10 flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Last updated: January 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            {/* Intro */}
            <section>
              <p>
                Welcome to Chalkboard. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
              </p>
            </section>

            {/* Early Access */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Early Access Platform
              </h2>
              <p>
                Chalkboard is currently in early access and pre-release. This means the platform is still under active development. Features, functionality, and availability may change, be added, or be removed at any time without prior notice. We appreciate your patience and feedback as we continue to build and improve.
              </p>
            </section>

            {/* Educational Tool */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Training & Educational Tool
              </h2>
              <p className="mb-4">
                Chalkboard is designed as a training and educational tool for football players, coaches, and teams. It is intended to supplement — not replace — coaching instruction, team meetings, film sessions, or any other form of professional guidance.
              </p>
              <p>
                Chalkboard does not provide medical advice and should not be used as a substitute for professional medical guidance or treatment. Always consult with qualified professionals regarding health, injury, or medical concerns.
              </p>
            </section>

            {/* No Guarantees */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                No Performance Guarantees
              </h2>
              <p>
                While Chalkboard is built to help users develop football knowledge and mental preparation, we do not guarantee any specific outcomes. Use of Chalkboard does not guarantee improved on-field performance, playing time, roster spots, scholarships, or any other athletic or career outcome. Results depend on many factors beyond the scope of this platform.
              </p>
            </section>

            {/* Disclaimer of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Disclaimer of Liability
              </h2>
              <p className="mb-4">
                Chalkboard Sports LLC is not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Injuries sustained during football activities or training</li>
                <li>Coaching decisions made by users or their teams</li>
                <li>Playing time, roster decisions, or team selection outcomes</li>
                <li>Any decisions made based on information provided through the platform</li>
              </ul>
              <p className="mt-4">
                You acknowledge that football is an inherently physical sport with associated risks, and Chalkboard is not a substitute for proper supervision, coaching, or safety precautions.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Intellectual Property
              </h2>
              <p>
                All content, branding, software, designs, graphics, and other materials on Chalkboard are owned by Chalkboard Sports LLC or its licensors. You may not copy, modify, distribute, sell, or lease any part of our platform or its content without our express written permission.
              </p>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                User Conduct
              </h2>
              <p className="mb-4">
                When using Chalkboard, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Provide accurate information when signing up</li>
                <li>Use the platform only for lawful purposes</li>
                <li>Not attempt to interfere with or disrupt the platform</li>
                <li>Not share your account credentials with others</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, Chalkboard Sports LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the platform. Our total liability for any claims related to the platform shall not exceed the amount you paid us, if any, in the twelve months prior to the claim.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Changes to These Terms
              </h2>
              <p>
                We may update these Terms of Service from time to time. If we make significant changes, we will notify you through the platform or by email. Your continued use of Chalkboard after any changes indicates your acceptance of the updated terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Governing Law
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a 
                  href="mailto:chalkboardhq@gmail.com" 
                  className="text-neon-teal hover:underline"
                >
                  chalkboardhq@gmail.com
                </a>.
              </p>
            </section>
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8 border-t border-slate-800/50">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
