'use client';

import React, { useState } from 'react';
import { FileUploadScreen } from '../../components/play-recognition/FileUploadScreen';
import { ImageViewer } from '../../components/play-recognition/ImageViewer';
import { PDFViewer } from '../../components/play-recognition/PDFViewer';
import { SavedPlayLibrary } from '../../components/play-recognition/SavedPlayLibrary';
import { PlayContentLoadingIndicator } from '../../components/play-recognition/PlayContentLoadingIndicator';
import { PlayContentGenerationProvider } from '@/contexts/PlayContentGenerationContext';
import { getPlaybooksApiUrl } from '@/lib/api-config';
import { PlaybookMetadataInput } from '@/types/playbook-metadata';
import { SidebarLayout } from '@/components/SidebarLayout';

type ViewState = 'LIBRARY' | 'UPLOAD' | 'VIEWER' | 'CREATE_PLAY';

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

  const handleStartCreatePlay = () => {
    setCurrentView('CREATE_PLAY');
  };

  const handleUploadComplete = async (fileData: string, fileName: string, fileType: string, metadata?: PlaybookMetadataInput) => {
    try {
      // TODO: Get teamId from auth context instead of hardcoding
      // Using a valid UUID format as placeholder
      const teamId = '00000000-0000-0000-0000-000000000000'; // Replace with actual teamId from context

      const apiUrl = getPlaybooksApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileData,
          metadata,
          teamId,
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

  const handlePlayBuilt = async (playData: any, metadata?: PlaybookMetadataInput) => {
    try {
      const teamId = '00000000-0000-0000-0000-000000000000'; // TODO: Get from auth context

      const apiUrl = getPlaybooksApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: `built-play-${Date.now()}.json`,
          playData, // Structured play data instead of fileData
          metadata,
          teamId,
          isBuiltPlay: true, // Flag to indicate this is a built play, not uploaded image
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save built play');
      }

      // Refresh library and go back to it
      setRefreshKey(prev => prev + 1);
      setCurrentView('LIBRARY');
    } catch (error) {
      console.error('Error saving built play:', error);
      alert('Failed to save play. Please try again.');
    }
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

      case 'CREATE_PLAY':
        // Import dynamically to avoid loading play designer on initial page load
        const PlayBuilder = require('@/components/play-recognition/PlayBuilder').PlayBuilder;
        return <PlayBuilder onSave={handlePlayBuilt} onBack={handleBackToLibrary} />;

      case 'LIBRARY':
      default:
        return (
          <SidebarLayout>
            <div className="h-screen overflow-hidden">
              <SavedPlayLibrary
                key={refreshKey}
                onSelectPlay={handleSelectFile}
                onFileUpload={handleStartUpload}
                onCreatePlay={handleStartCreatePlay}
              />
            </div>
          </SidebarLayout>
        );
    }
  };

  return (
    <PlayContentGenerationProvider>
      <div className="h-screen w-full bg-[#0A0F12] text-white overflow-hidden font-[family-name:var(--font-rajdhani)]">
        {renderView()}
        <PlayContentLoadingIndicator />
      </div>
    </PlayContentGenerationProvider>
  );
}





