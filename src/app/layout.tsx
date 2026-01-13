import type { Metadata } from "next";
import { Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CoachProvider, CoachDrawer, CoachFAB } from "@/components/ai-coach";

const rajdhani = Rajdhani({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chalkboard — Football Intelligence Platform",
  description:
    "Next-generation football learning platform. Master your playbook, study film, and dominate your position.",
  keywords: ["football", "playbook", "film study", "training", "NFL", "college football"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${rajdhani.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <CoachProvider>
          {children}
          {/* Global AI Coach Floating Button & Drawer */}
          <CoachFAB />
          <CoachDrawer />
        </CoachProvider>
      </body>
    </html>
  );
}
