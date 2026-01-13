import Link from "next/link";
import { LEGAL_BRAND_NAME, LEGAL_COMPANY_NAME, COPYRIGHT_YEAR } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="relative z-10 px-6 py-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-neon-teal to-ice-blue flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A0A0A">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            {/* Logo wordmark - intentionally "CHALKBOARD" */}
            <span className="text-base font-bold text-white">CHALKBOARD</span>
          </div>

          <a 
            href="mailto:chalkboardhq@gmail.com" 
            className="text-sm text-slate-400 hover:text-neon-teal transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            chalkboardhq@gmail.com
          </a>
        </div>

        {/* Legal Links Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/30">
          <div className="flex items-center gap-6">
            <Link 
              href="/privacy" 
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
          
          <p className="text-xs text-slate-600">
            © {COPYRIGHT_YEAR} {LEGAL_COMPANY_NAME}
          </p>
        </div>

        {/* Training Disclaimer */}
        <p className="text-[10px] text-slate-600 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          {LEGAL_BRAND_NAME} is a training and educational tool and does not replace coaching instruction, team meetings, or medical guidance.
        </p>

        {/* IP Notice */}
        <p className="text-[10px] text-slate-700 text-center mt-3">
          {LEGAL_BRAND_NAME} and all related content are the property of {LEGAL_COMPANY_NAME}.
        </p>
      </div>
    </footer>
  );
}
