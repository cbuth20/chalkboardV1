"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { PlayList, PlayMetadata, FieldEditor, ToastProvider, useToast } from "@/components/playbook-builder";
import { DemoPlay, DemoPlayer, DemoRoute } from "@/lib/playbook/demo-types";
import PlaybookStore from "@/lib/playbook/store";

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK PAGE — Main container component
// ═══════════════════════════════════════════════════════════════════════════

export default function PlaybookPage() {
  return (
    <ToastProvider>
      <PlaybookBuilder />
    </ToastProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK BUILDER — Core state management and layout
// ═══════════════════════════════════════════════════════════════════════════

function PlaybookBuilder() {
  const { showToast } = useToast();

  // Core state
  const [plays, setPlays] = useState<DemoPlay[]>([]);
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Derived: selected play
  const selectedPlay = plays.find((p) => p.id === selectedPlayId) || null;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD FROM LOCALSTORAGE ON MOUNT
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    try {
      const loaded = PlaybookStore.load();
      setPlays(loaded);
      // Select first play by default
      if (loaded.length > 0) {
        setSelectedPlayId(loaded[0].id);
      }
      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to load playbook:", err);
      showToast("Failed to load playbook. Using demo data.", "error");
      const sample = PlaybookStore.reset();
      setPlays(sample);
      if (sample.length > 0) {
        setSelectedPlayId(sample[0].id);
      }
      setIsLoaded(true);
    }
  }, [showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE TO LOCALSTORAGE ON CHANGES
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (isLoaded && plays.length > 0) {
      try {
        PlaybookStore.save(plays);
      } catch (err) {
        console.error("Failed to save playbook:", err);
        showToast("Failed to save changes.", "error");
      }
    }
  }, [plays, isLoaded, showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAY LIST HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSelectPlay = useCallback((id: string) => {
    setSelectedPlayId(id);
  }, []);

  const handleCreatePlay = useCallback((newPlay: DemoPlay) => {
    setPlays((prev) => [...prev, newPlay]);
    setSelectedPlayId(newPlay.id);
    showToast("New play created!", "success");
  }, [showToast]);

  const handleDuplicatePlay = useCallback((dupPlay: DemoPlay) => {
    setPlays((prev) => [...prev, dupPlay]);
    setSelectedPlayId(dupPlay.id);
    showToast("Play duplicated!", "success");
  }, [showToast]);

  const handleDeletePlay = useCallback(
    (id: string) => {
      setPlays((prev) => {
        const newPlays = prev.filter((p) => p.id !== id);
        // If we deleted the selected play, select another
        if (id === selectedPlayId && newPlays.length > 0) {
          setSelectedPlayId(newPlays[0].id);
        }
        return newPlays;
      });
      showToast("Play deleted.", "info");
    },
    [selectedPlayId, showToast]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleUpdateMetadata = useCallback(
    (updates: Partial<DemoPlay>) => {
      if (!selectedPlayId) return;
      setPlays((prev) =>
        prev.map((p) =>
          p.id === selectedPlayId
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [selectedPlayId]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // FIELD EDITOR HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const handleUpdatePlayers = useCallback(
    (players: DemoPlayer[]) => {
      if (!selectedPlayId) return;
      setPlays((prev) =>
        prev.map((p) =>
          p.id === selectedPlayId
            ? { ...p, players, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [selectedPlayId]
  );

  const handleUpdateRoutes = useCallback(
    (routes: DemoRoute[]) => {
      if (!selectedPlayId) return;
      setPlays((prev) =>
        prev.map((p) =>
          p.id === selectedPlayId
            ? { ...p, routes, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [selectedPlayId]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT & RESET
  // ═══════════════════════════════════════════════════════════════════════════

  const handleExportJSON = useCallback(() => {
    try {
      const json = selectedPlay
        ? PlaybookStore.exportPlayJSON(selectedPlay.id)
        : PlaybookStore.exportJSON();

      if (!json) {
        showToast("Nothing to export.", "error");
        return;
      }

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedPlay
        ? `${selectedPlay.name.replace(/\s+/g, "-").toLowerCase()}.json`
        : "chalkboard-playbook.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Playbook exported!", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Failed to export.", "error");
    }
  }, [selectedPlay, showToast]);

  const handleResetDemo = useCallback(() => {
    if (confirm("Reset all plays to demo data? This cannot be undone.")) {
      const sample = PlaybookStore.reset();
      setPlays(sample);
      if (sample.length > 0) {
        setSelectedPlayId(sample[0].id);
      }
      showToast("Demo data restored!", "success");
    }
  }, [showToast]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <Navbar />
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00F6E5] border-t-transparent" />
            <span className="text-sm text-slate-400">Loading playbook...</span>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      <main className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar: Play List */}
        <PlayList
          plays={plays}
          selectedPlayId={selectedPlayId}
          onSelectPlay={handleSelectPlay}
          onCreatePlay={handleCreatePlay}
          onDuplicatePlay={handleDuplicatePlay}
          onDeletePlay={handleDeletePlay}
        />

        {/* Center: Field Editor + Collapsible Play Details */}
        <div className="flex flex-1 flex-col">
          {/* Play Diagram - Maximized height */}
          <div className="flex-1 min-h-[500px]">
            <FieldEditor
              play={selectedPlay}
              onUpdatePlayers={handleUpdatePlayers}
              onUpdateRoutes={handleUpdateRoutes}
            />
          </div>

          {/* Collapsible Play Details */}
          <PlayMetadata
            play={selectedPlay}
            onUpdate={handleUpdateMetadata}
            onExportJSON={handleExportJSON}
            onResetDemo={handleResetDemo}
          />
        </div>
      </main>
    </div>
  );
}
