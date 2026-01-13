'use client';

import React, { useState } from 'react';
import { FileUploadScreen } from '../../components/play-recognition/FileUploadScreen';
import { ImageViewer } from '../../components/play-recognition/ImageViewer';
import { PDFViewer } from '../../components/play-recognition/PDFViewer';
import { SavedPlayLibrary } from '../../components/play-recognition/SavedPlayLibrary';
import { getPlaybooksApiUrl } from '@/lib/api-config';
import PlayerNavbar from '@/components/PlayerNavbar';

type ViewState = 'LIBRARY' | 'UPLOAD' | 'VIEWER';

interface SelectedFile {
  url: string;
  fileName: string;
  type: 'pdf' | 'image';
}

export default function PlayRecognitionPage() {
  const [currentView, setCurrentView] = useState<ViewState>('LIBRARY');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handlers for state transitions
  const handleStartUpload = () => {
    setCurrentView('UPLOAD');
  };

  const handleUploadComplete = async (fileData: string, fileName: string, fileType: string) => {
    // Upload to API
    try {
      const apiUrl = getPlaybooksApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      // Refresh library and go back to it
      setRefreshKey(prev => prev + 1);
      setCurrentView('LIBRARY');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const handleSelectFile = (url: string, fileName: string, type: 'pdf' | 'image') => {
    setSelectedFile({ url, fileName, type });
    setCurrentView('VIEWER');
  };

  const handleBackToLibrary = () => {
    setSelectedFile(null);
    setCurrentView('LIBRARY');
  };

  // Render the current view
  const renderView = () => {
    switch (currentView) {
      case 'UPLOAD':
        return <FileUploadScreen onUploadComplete={handleUploadComplete} onBack={handleBackToLibrary} />;

      case 'VIEWER':
        if (!selectedFile) {
          setCurrentView('LIBRARY');
          return null;
        }

        if (selectedFile.type === 'pdf') {
          return (
            <PDFViewer
              pdfUrl={selectedFile.url}
              fileName={selectedFile.fileName}
              onBack={handleBackToLibrary}
            />
          );
        } else {
          return (
            <ImageViewer
              imageUrl={selectedFile.url}
              fileName={selectedFile.fileName}
              onBack={handleBackToLibrary}
            />
          );
        }

      case 'LIBRARY':
      default:
        return (
          <>
            <PlayerNavbar />
            <div className="h-[calc(100vh-64px)] overflow-hidden">
              <SavedPlayLibrary
                key={refreshKey}
                onSelectPlay={handleSelectFile}
                onNewScan={handleStartUpload}
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





