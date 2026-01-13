import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy — Chalkboard",
  description: "Privacy Policy for Chalkboard Sports LLC",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mb-10">
            Last updated: January 2026
          </p>

          <div className="space-y-8 text-slate-300 leading-relaxed">
            {/* Intro */}
            <section>
              <p>
                Chalkboard Sports LLC ("Chalkboard," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
              </p>
            </section>

            {/* What We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                What We Collect
              </h2>
              <p className="mb-4">
                When you sign up for early access or use Chalkboard, we may collect the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>
                  <span className="text-slate-300">Email address</span> — to communicate with you about early access, product updates, and important announcements
                </li>
                <li>
                  <span className="text-slate-300">Selected role</span> — such as player, coach, parent, or trainer — to better understand our users and tailor the experience
                </li>
                <li>
                  <span className="text-slate-300">Basic usage analytics</span> — such as pages visited and features used — to help us improve the platform
                </li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                How We Use Your Information
              </h2>
              <p className="mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Provide early access to Chalkboard</li>
                <li>Send product updates and communications about new features</li>
                <li>Improve the platform based on how users interact with it</li>
                <li>Respond to your questions or requests</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Data Security
              </h2>
              <p>
                Your data is stored securely and we take reasonable measures to protect it from unauthorized access, alteration, or destruction. We do not sell your personal information to third parties.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Third-Party Services
              </h2>
              <p>
                We may use third-party services to help us operate Chalkboard, such as email providers and analytics tools. These services may have access to your information only to perform tasks on our behalf and are obligated not to disclose or use it for other purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Rights
              </h2>
              <p className="mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of any inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Unsubscribe from our communications at any time</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at{" "}
                <a 
                  href="mailto:chalkboardhq@gmail.com" 
                  className="text-neon-teal hover:underline"
                >
                  chalkboardhq@gmail.com
                </a>.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. If we make significant changes, we will notify you through the platform or by email. Your continued use of Chalkboard after any changes indicates your acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
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
