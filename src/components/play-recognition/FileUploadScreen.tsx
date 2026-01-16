import React, { useState, useRef } from 'react';
import {
  SideOfBall,
  ContentType,
  Level,
  Position,
  PlaybookMetadataInput,
  SIDE_OF_BALL_LABELS,
  CONTENT_TYPE_LABELS,
  LEVEL_LABELS,
  POSITION_LABELS,
} from '@/types/playbook-metadata';

interface FileUploadScreenProps {
  onUploadComplete: (fileData: string, fileName: string, fileType: string, metadata?: PlaybookMetadataInput) => void;
  onBack: () => void;
}

export const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ onUploadComplete, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{data: string, name: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Metadata form state
  const [metadata, setMetadata] = useState<PlaybookMetadataInput>({
    position_relevance: ['all'],
  });

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        setSelectedFile({ data: result, name: file.name, type: file.type });
        setIsUploading(false);
        setShowMetadata(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsUploading(false);
    }
  };

  const handleUploadWithMetadata = () => {
    if (!selectedFile) return;
    onUploadComplete(selectedFile.data, selectedFile.name, selectedFile.type, metadata);
  };

  const handleSkipMetadata = () => {
    if (!selectedFile) return;
    onUploadComplete(selectedFile.data, selectedFile.name, selectedFile.type);
  };

  const handlePositionToggle = (position: Position) => {
    setMetadata(prev => {
      const currentPositions = prev.position_relevance || ['all'];

      if (position === 'all') {
        return { ...prev, position_relevance: ['all'] };
      }

      const withoutAll = currentPositions.filter(p => p !== 'all');

      if (withoutAll.includes(position)) {
        const newPositions = withoutAll.filter(p => p !== position);
        return {
          ...prev,
          position_relevance: newPositions.length === 0 ? ['all'] : newPositions,
        };
      } else {
        return {
          ...prev,
          position_relevance: [...withoutAll, position],
        };
      }
    });
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

  const selectedPositions = metadata.position_relevance || ['all'];

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
      <div className="flex-1 flex items-center justify-center p-8 mt-16 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {showMetadata && preview ? (
            /* Metadata Form */
            <div className="space-y-6 animate-fade-in">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10">
                <img src={preview} alt="Preview" className="w-full h-48 object-contain bg-black" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Add Details (Optional)</h3>
                  <p className="text-sm text-slate-400">Help organize your playbook by adding some optional tags</p>
                </div>

                {/* Side of Ball */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Side of Ball</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(SIDE_OF_BALL_LABELS) as [SideOfBall, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMetadata(prev => ({ ...prev, side_of_ball: value }))}
                        className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                          metadata.side_of_ball === value
                            ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Content Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMetadata(prev => ({ ...prev, content_type: value }))}
                        className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                          metadata.content_type === value
                            ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(LEVEL_LABELS) as [Level, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMetadata(prev => ({ ...prev, level: value }))}
                        className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                          metadata.level === value
                            ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Relevance */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Position Relevance</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(POSITION_LABELS) as [Position, string][]).map(([value, label]) => {
                      const isSelected = selectedPositions.includes(value) ||
                        (value !== 'all' && selectedPositions.includes('all'));
                      const isAllSelected = selectedPositions.includes('all');

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handlePositionToggle(value)}
                          disabled={value !== 'all' && isAllSelected}
                          className={`p-2 rounded-lg border transition-all text-xs font-bold ${
                            isSelected
                              ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                          } ${value !== 'all' && isAllSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={label}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Formation Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Formation Name</label>
                  <input
                    type="text"
                    value={metadata.formation_name || ''}
                    onChange={(e) => setMetadata(prev => ({ ...prev, formation_name: e.target.value }))}
                    placeholder="e.g., Spread, I-Formation, Shotgun"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                  />
                </div>

                {/* Concept Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Concept Name</label>
                  <input
                    type="text"
                    value={metadata.concept_name || ''}
                    onChange={(e) => setMetadata(prev => ({ ...prev, concept_name: e.target.value }))}
                    placeholder="e.g., Mesh, Power, Zone, Slant-Flat"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                  />
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Additional Information
                    <span className="ml-2 text-xs text-slate-500 font-normal">(Optional - helps AI understand the play better)</span>
                  </label>
                  <textarea
                    value={metadata.custom_notes || ''}
                    onChange={(e) => setMetadata(prev => ({ ...prev, custom_notes: e.target.value }))}
                    placeholder="Add detailed context about position assignments, blocking schemes, route progressions, protections, reads, adjustments, or any other information that would help the AI generate more accurate content..."
                    rows={6}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors resize-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Example: QB progressions, protection schemes, route details, blocking assignments, etc.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSkipMetadata}
                    className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-300 font-semibold hover:bg-white/10 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadWithMetadata}
                    className="flex-1 px-6 py-3 bg-[var(--neon-teal)] rounded-lg text-black font-bold hover:bg-[#00d4c5] transition-colors shadow-[0_0_15px_rgba(0,246,229,0.3)]"
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Interface */
            <>
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
          </>
          )}
        </div>
      </div>
    </div>
  );
};
