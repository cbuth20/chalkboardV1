"use client";

import { useState } from "react";
import { PlayBuilder } from "@/components/play-recognition/PlayBuilder";
import type { BuiltPlayData } from "@/components/play-recognition/PlayBuilder";

export default function DemoPlayBuilder() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (playData: BuiltPlayData) => {
    setToastMessage("Play saved locally! Sign up to save permanently.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative" style={{ height: "calc(100vh - 180px)" }}>
      <PlayBuilder
        onSave={handleSave}
        onBack={() => {}}
        mode="coach"
        embedded={true}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg bg-slate-800 border border-neon-teal/30 text-white text-sm font-medium shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
