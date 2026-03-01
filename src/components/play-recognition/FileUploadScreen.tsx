import React, { useState, useRef } from 'react';
import { useConfirm } from '@/components/ConfirmModal';
import {
  SideOfBall,
  Position,
  PlaybookMetadataInput,
  PLAYBOOK_TAGS,
  PlaybookTag,
  getPositionsForSideOfBall,
  Unit,
  UNIT_LABELS,
  PLAY_TYPE_LABELS,
  SUGGESTED_SECTIONS,
  SUGGESTED_SITUATIONS,
  getPrimaryClassificationsForUnit,
  NOTE_TYPE_LABELS,
  NoteType,
  FileCategory,
  FILE_CATEGORY_LABELS,
} from '@/types/playbook-metadata';
import { ALL_POSITIONS } from '@/lib/positions';

interface UploadedFile {
  data: string;
  name: string;
  type: string;
  preview: string;
  metadata: PlaybookMetadataInput;
}

interface FileUploadScreenProps {
  mode?: 'plays' | 'notes'; // NEW: mode to differentiate between plays and notes
  onUploadComplete: (files: Array<{fileData: string, fileName: string, fileType: string, metadata?: PlaybookMetadataInput}>) => void;
  onBack: () => void;
}

export const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ mode = 'plays', onUploadComplete, onBack }) => {
  const { confirm } = useConfirm();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentFile = currentFileIndex !== null ? uploadedFiles[currentFileIndex] : null;

  const handleFileSelect = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const filePromises = Array.from(files).map((file) => {
        return new Promise<UploadedFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve({
              data: result,
              name: file.name,
              type: file.type,
              preview: result,
              metadata: {
                position_relevance: ['all'],
                tags: [],
                content_type: mode === 'notes' ? 'reference' : 'play', // Set content type based on mode
              },
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const newFiles = await Promise.all(filePromises);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);

      // Auto-select first file if none selected
      if (currentFileIndex === null && newFiles.length > 0) {
        setCurrentFileIndex(uploadedFiles.length);
      }
    } catch (error) {
      console.error('Error reading files:', error);
      setIsUploading(false);
    }
  };

  const handleUpdateMetadata = (updates: Partial<PlaybookMetadataInput>) => {
    if (currentFileIndex === null) return;

    setUploadedFiles(prev => prev.map((file, idx) =>
      idx === currentFileIndex
        ? { ...file, metadata: { ...file.metadata, ...updates } }
        : file
    ));
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));

    if (currentFileIndex === index) {
      setCurrentFileIndex(uploadedFiles.length > 1 ? 0 : null);
    } else if (currentFileIndex !== null && currentFileIndex > index) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  const handleUploadAll = async () => {
    // Warn if uploading a large number of files
    if (uploadedFiles.length > 100) {
      if (!(await confirm({
        message: `You're about to upload ${uploadedFiles.length} files.\n\n` +
        `This may take several minutes and will be processed in batches to avoid server overload.\n\n` +
        `For best performance, consider uploading in smaller batches (50-100 files at a time).\n\n` +
        `Continue with upload?`,
        confirmLabel: "Continue",
      }))) {
        return;
      }
    }

    setIsUploadingAll(true);
    const filesToUpload = uploadedFiles.map(file => ({
      fileData: file.data,
      fileName: file.name,
      fileType: file.type,
      metadata: file.metadata,
    }));
    onUploadComplete(filesToUpload);
  };

  const handlePositionToggle = (position: Position) => {
    if (currentFileIndex === null) return;

    const currentMetadata = uploadedFiles[currentFileIndex].metadata;
    const currentPositions = currentMetadata.position_relevance || ['all'];

    let newPositions: Position[];
    if (position === 'all') {
      newPositions = ['all'];
    } else {
      const withoutAll = currentPositions.filter(p => p !== 'all');
      if (withoutAll.includes(position)) {
        newPositions = withoutAll.filter(p => p !== position);
        if (newPositions.length === 0) newPositions = ['all'];
      } else {
        newPositions = [...withoutAll, position];
      }
    }

    handleUpdateMetadata({ position_relevance: newPositions });
  };

  const handleUnitChange = (unit: Unit) => {
    // Map unit to side_of_ball for backend compatibility
    const unitToSideOfBall: Record<Unit, SideOfBall> = {
      'O': 'offense',
      'D': 'defense',
      'ST': 'special_teams',
    };

    handleUpdateMetadata({
      unit: unit,
      side_of_ball: unitToSideOfBall[unit],
      position_relevance: ['all'], // Reset positions when unit changes
      primary_classification: undefined, // Reset classification when unit changes
      content_type: 'play', // Default content type (database enum value)
    });
  };

  const handleTagToggle = (tag: PlaybookTag) => {
    if (currentFileIndex === null) return;

    const currentTags = uploadedFiles[currentFileIndex].metadata.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];

    handleUpdateMetadata({ tags: newTags });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/') || file.type === 'application/pdf'
      );

      if (validFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        handleFileSelect(dataTransfer.files);
      }
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
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    e.target.value = '';
  };

  const selectedPositions = currentFile?.metadata.position_relevance || ['all'];

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
        <div className="text-white font-bold text-lg tracking-wide">
          IMPORT PLAYBOOK {uploadedFiles.length > 0 && `(${uploadedFiles.length} files)`}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex p-8 mt-16 overflow-hidden">
        {uploadedFiles.length > 0 ? (
          // File list + metadata editor
          <div className="flex gap-6 w-full max-w-7xl mx-auto">
            {/* Left: File List */}
            <div className="w-64 flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Files ({uploadedFiles.length})</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[var(--neon-teal)] text-xs font-semibold hover:underline"
                >
                  + Add More
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`group relative rounded-lg border p-3 cursor-pointer transition-all ${
                      currentFileIndex === index
                        ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                    onClick={() => setCurrentFileIndex(index)}
                  >
                    {/* Preview */}
                    <div className="w-full h-20 rounded overflow-hidden bg-black mb-2">
                      {file.type.startsWith('image/') && !file.name.toLowerCase().match(/\.(heic|heif)$/) ? (
                        <img src={file.preview} alt={file.name} className="w-full h-full object-contain" />
                      ) : file.name.toLowerCase().match(/\.(heic|heif)$/) ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span className="text-[8px] mt-1">HEIC</span>
                        </div>
                      ) : file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-400">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M9 13h6" />
                            <path d="M9 17h3" />
                          </svg>
                          <span className="text-[8px] mt-1">PDF</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <path d="M14 2v6h6" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* File name */}
                    <p className="text-white text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </p>

                    {/* Tags */}
                    {file.metadata.tags && file.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {file.metadata.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-[var(--neon-teal)]/20 text-[var(--neon-teal)] rounded">
                            {tag}
                          </span>
                        ))}
                        {file.metadata.tags.length > 2 && (
                          <span className="text-[9px] px-1.5 py-0.5 text-slate-400">
                            +{file.metadata.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload All Button */}
              <button
                onClick={handleUploadAll}
                disabled={isUploadingAll}
                className="w-full bg-[var(--neon-teal)] text-black font-bold py-3 rounded-lg hover:bg-[#00d4c5] transition-colors shadow-[0_0_15px_rgba(0,246,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploadingAll ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-3 border-black/30 border-t-black animate-spin"></div>
                    <span>UPLOADING...</span>
                  </>
                ) : (
                  <span>UPLOAD ALL ({uploadedFiles.length})</span>
                )}
              </button>
            </div>

            {/* Right: Metadata Editor */}
            {currentFile && (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {/* Preview */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
                    {currentFile.type.startsWith('image/') && !currentFile.name.toLowerCase().match(/\.(heic|heif)$/) ? (
                      <img src={currentFile.preview} alt="Preview" className="w-full h-64 object-contain" />
                    ) : currentFile.name.toLowerCase().match(/\.(heic|heif)$/) ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <div className="mt-4 text-center">
                          <p className="font-medium text-white">{currentFile.name}</p>
                          <p className="text-sm text-slate-500 mt-1">HEIC Image</p>
                          <p className="text-xs text-slate-600 mt-2">Preview not available</p>
                          <p className="text-xs text-slate-600">Will be converted to JPEG during upload</p>
                        </div>
                      </div>
                    ) : currentFile.type === 'application/pdf' || currentFile.name.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-96">
                        <iframe
                          src={currentFile.preview}
                          className="w-full h-full border-0"
                          title={`PDF Preview: ${currentFile.name}`}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                        <p className="mt-4 text-sm">Document</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{currentFile.name}</h3>
                      <p className="text-sm text-slate-400">Add metadata to help organize your playbook</p>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {PLAYBOOK_TAGS.map((tag) => {
                          const isSelected = currentFile.metadata.tags?.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagToggle(tag)}
                              className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                                isSelected
                                  ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Tags help group related files for multi-file generation
                      </p>
                    </div>

                    {/* Note Type (only for notes mode) */}
                    {mode === 'notes' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Note Type</label>
                        <select
                          value={currentFile.metadata.note_type || ''}
                          onChange={(e) => handleUpdateMetadata({ note_type: e.target.value as NoteType })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                        >
                          <option value="">Select Note Type...</option>
                          {(Object.entries(NOTE_TYPE_LABELS) as [NoteType, string][]).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* File Category (only for notes mode) */}
                    {mode === 'notes' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
                        <select
                          value={currentFile.metadata.file_category || ''}
                          onChange={(e) => handleUpdateMetadata({ file_category: e.target.value as FileCategory })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                        >
                          <option value="">Select Category...</option>
                          {(Object.entries(FILE_CATEGORY_LABELS) as [FileCategory, string][]).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Formation Name (only for plays mode) */}
                    {mode === 'plays' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Formation Name</label>
                        <input
                          type="text"
                          value={currentFile.metadata.formation_name || ''}
                          onChange={(e) => handleUpdateMetadata({ formation_name: e.target.value })}
                          placeholder="e.g., Trips, Shotgun, I-Formation"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                        />
                      </div>
                    )}

                    {/* Classification Section (only for plays mode) */}
                    {mode === 'plays' && (
                      <div className="border-t border-white/10 pt-5">
                        <h4 className="text-base font-bold text-white mb-4">Play Classification</h4>

                      {/* Unit & Play Type */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Unit <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={currentFile.metadata.unit || ''}
                            onChange={(e) => handleUnitChange(e.target.value as Unit)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                          >
                            <option value="">Select Unit...</option>
                            {(Object.entries(UNIT_LABELS) as [Unit, string][]).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {currentFile.metadata.unit === 'O' && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                              Play Type
                            </label>
                            <select
                              value={currentFile.metadata.play_type || ''}
                              onChange={(e) => handleUpdateMetadata({ play_type: e.target.value as 'PASS' | 'RUN' | 'RPO' | 'SCREEN' })}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                            >
                              <option value="">Select Type...</option>
                              {(Object.entries(PLAY_TYPE_LABELS) as [keyof typeof PLAY_TYPE_LABELS, string][]).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Playbook Section */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Playbook Section
                          <span className="ml-2 text-xs text-slate-500 font-normal">(e.g., Pass Game, Run Game, Third Down)</span>
                        </label>
                        <input
                          type="text"
                          list="section-suggestions"
                          value={currentFile.metadata.playbook_section || ''}
                          onChange={(e) => handleUpdateMetadata({ playbook_section: e.target.value })}
                          placeholder="Enter or select a section..."
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                        />
                        <datalist id="section-suggestions">
                          {SUGGESTED_SECTIONS.map(section => (
                            <option key={section} value={section} />
                          ))}
                        </datalist>
                      </div>

                      {/* Primary Classification */}
                      {currentFile.metadata.unit && (
                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Primary Classification
                          </label>
                          <select
                            value={currentFile.metadata.primary_classification || ''}
                            onChange={(e) => handleUpdateMetadata({ primary_classification: e.target.value })}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                          >
                            <option value="">Select Classification...</option>
                            {getPrimaryClassificationsForUnit(currentFile.metadata.unit).map(classification => (
                              <option key={classification} value={classification}>{classification}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Situation */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Situation
                          <span className="ml-2 text-xs text-slate-500 font-normal">(Optional - e.g., 3rd Down, Red Zone)</span>
                        </label>
                        <input
                          type="text"
                          list="situation-suggestions"
                          value={currentFile.metadata.situation || ''}
                          onChange={(e) => handleUpdateMetadata({ situation: e.target.value })}
                          placeholder="Enter or select a situation..."
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors"
                        />
                        <datalist id="situation-suggestions">
                          {SUGGESTED_SITUATIONS.map(situation => (
                            <option key={situation} value={situation} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    )}

                    {/* Position Relevance (only for plays mode) */}
                    {mode === 'plays' && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                          Position Relevance
                          {!currentFile.metadata.unit && (
                            <span className="ml-2 text-xs text-amber-400">Select "Unit" first</span>
                          )}
                        </label>
                      {currentFile.metadata.unit && currentFile.metadata.side_of_ball ? (
                        <div className="grid grid-cols-5 gap-2">
                          {/* "All" button */}
                          <button
                            type="button"
                            onClick={() => handlePositionToggle('all')}
                            className={`p-2 rounded-lg border transition-all text-xs font-bold ${
                              selectedPositions.includes('all')
                                ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                            }`}
                            title="All Positions"
                          >
                            ALL
                          </button>

                          {/* Positions for selected side of ball */}
                          {getPositionsForSideOfBall(currentFile.metadata.side_of_ball).map((pos) => {
                            const isSelected = selectedPositions.includes(pos) ||
                              selectedPositions.includes('all');
                            const posInfo = ALL_POSITIONS[pos];
                            return (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => handlePositionToggle(pos)}
                                className={`p-2 rounded-lg border transition-all text-xs font-bold ${
                                  isSelected
                                    ? 'border-[var(--neon-teal)] bg-[var(--neon-teal)]/10 text-[var(--neon-teal)]'
                                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                                }`}
                                title={posInfo?.name || pos}
                              >
                                {pos}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center text-slate-400 text-sm">
                          Please select a "Unit" to choose position relevance
                        </div>
                      )}
                      </div>
                    )}

                    {/* Additional Information */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Additional Notes
                        <span className="ml-2 text-xs text-slate-500 font-normal">(Optional - helps AI generate better content)</span>
                      </label>
                      <textarea
                        value={currentFile.metadata.custom_notes || ''}
                        onChange={(e) => handleUpdateMetadata({ custom_notes: e.target.value })}
                        placeholder="Add any additional context: concepts, routes, protections, reads, adjustments, coaching points, etc."
                        rows={4}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[var(--neon-teal)] transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Interface
          <div className="w-full max-w-2xl mx-auto">
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
                  <p className="text-slate-400 text-lg">Processing files...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-[var(--neon-teal)]/10 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--neon-teal)" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Drop your playbook files here</h2>
                    <p className="text-slate-400 mb-2">or click to browse files</p>
                    <p className="text-xs text-slate-500">Supports multiple PDF, JPG, PNG files</p>
                  </div>

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
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Camera Option */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-slate-500 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

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
        )}
      </div>
    </div>
  );
};
