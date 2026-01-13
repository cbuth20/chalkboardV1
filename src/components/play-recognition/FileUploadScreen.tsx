import React, { useState, useRef } from 'react';

interface FileUploadScreenProps {
  onUploadComplete: (fileData: string, fileName: string, fileType: string) => void;
  onBack: () => void;
}

export const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ onUploadComplete, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);

        // Simulate processing delay
        setTimeout(() => {
          onUploadComplete(result, file.name, file.type);
          setIsUploading(false);
        }, 1000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="relative h-full w-full bg-[#0A0F12] overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
        <div className="text-white font-bold text-lg tracking-wide">IMPORT PLAYBOOK</div>
        <div className="w-10"></div>
      </div>

      {/* Main Upload Area */}
      <div className="flex-1 flex items-center justify-center p-8 mt-16">
        <div className="w-full max-w-2xl">
          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-4 border-dashed rounded-3xl p-12 transition-all ${
              isDragging
                ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10'
                : 'border-white/10 bg-white/5'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--neon-teal)]/30 border-t-[var(--neon-teal)] animate-spin"></div>
                <p className="text-slate-400 text-lg">Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6">
                {/* Icon */}
                <div className="w-24 h-24 rounded-full bg-[var(--neon-teal)]/10 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--neon-teal)" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>

                {/* Text */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Drop your playbook here</h2>
                  <p className="text-slate-400 mb-4">or click to browse files</p>
                  <p className="text-xs text-slate-500">Supports PDF, JPG, PNG files</p>
                </div>

                {/* Browse Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[var(--neon-teal)] text-black font-bold px-8 py-3 rounded-lg hover:bg-[#00d4c5] transition-colors shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                >
                  BROWSE FILES
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-slate-500 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Camera Option */}
          <div className="flex justify-center">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-8 py-4 hover:bg-white/10 hover:border-[var(--neon-teal)]/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--neon-teal)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--neon-teal)" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-white font-bold">Take a Photo</div>
                <div className="text-slate-400 text-sm">Use your device camera</div>
              </div>
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
