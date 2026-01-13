'use client';

import React, { useState } from 'react';
import PlayerNavbar from "@/components/PlayerNavbar";
import { ScanPlayScreen } from '../../components/play-recognition/ScanPlayScreen';
import { DetectionPreview } from '../../components/play-recognition/DetectionPreview';
import { DigitalPlayPreview } from '../../components/play-recognition/DigitalPlayPreview';
import { SavedPlayLibrary } from '../../components/play-recognition/SavedPlayLibrary';

type ViewState = 'LIBRARY' | 'SCAN' | 'DETECTION' | 'DIGITAL';

export default function PlayRecognitionPage() {
  const [currentView, setCurrentView] = useState<ViewState>('LIBRARY');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Handlers for state transitions
  const handleStartScan = () => {
    setCurrentView('SCAN');
  };

  const handleScanComplete = (image: string) => {
    setCapturedImage(image);
    setCurrentView('DETECTION');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCurrentView('SCAN');
  };

  const handleConfirmDetection = () => {
    setCurrentView('DIGITAL');
  };

  const handleSavePlay = () => {
    // Logic to save would go here
    setCurrentView('LIBRARY');
  };

  const handleBackToLibrary = () => {
    setCurrentView('LIBRARY');
  };

  const handleBackToDetection = () => {
    setCurrentView('DETECTION');
  };

  // Render the current view
  const renderView = () => {
    switch (currentView) {
      case 'SCAN':
        return <ScanPlayScreen onScanComplete={handleScanComplete} onBack={handleBackToLibrary} />;
      case 'DETECTION':
        return (
          <DetectionPreview 
            image={capturedImage || ''} 
            onRetake={handleRetake} 
            onConfirm={handleConfirmDetection} 
          />
        );
      case 'DIGITAL':
        return (
          <DigitalPlayPreview 
            onSave={handleSavePlay} 
            onBack={handleBackToDetection} 
          />
        );
      case 'LIBRARY':
      default:
        return (
          <>
            <PlayerNavbar />
            <div className="h-[calc(100vh-64px)] overflow-hidden">
              <SavedPlayLibrary 
                onSelectPlay={(id) => setCurrentView('DIGITAL')} 
                onNewScan={handleStartScan} 
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-[#0A0F12] text-white overflow-hidden font-[family-name:var(--font-rajdhani)]">
      {renderView()}
    </div>
  );
}





