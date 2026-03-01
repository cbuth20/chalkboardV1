"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmModal';
import { FileUploadScreen } from '@/components/play-recognition/FileUploadScreen';
import { PlaybookMetadataInput, NOTE_TYPE_LABELS, NoteType } from '@/types/playbook-metadata';

type ViewState = 'library' | 'upload' | 'viewer';

interface NoteFile {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  noteType?: NoteType;
  tags?: string[];
  uploadedAt: string;
  processedAt?: string;
  flashcardCount: number;
  contentStatus: 'draft' | 'generating' | 'approved' | 'rejected';
}

export default function PlayerNotesPage() {
  const router = useRouter();
  const { session, orgId, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [currentView, setCurrentView] = useState<ViewState>('library');
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewingNote, setViewingNote] = useState<NoteFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  // Load notes from API
  useEffect(() => {
    if (session?.access_token && orgId) {
      loadNotes();
    }
  }, [session, orgId]);

  const loadNotes = async () => {
    if (!session?.access_token || !orgId) return;

    try {
      setLoading(true);
      const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions'
        : '/.netlify/functions';

      const response = await fetch(`${baseURL}/player-notes?orgId=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      const matchesSearch =
        note.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedNoteType === 'all' || note.noteType === selectedNoteType;
      const matchesStatus = selectedStatus === 'all' || note.contentStatus === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'status':
          comparison = a.contentStatus.localeCompare(b.contentStatus);
          break;
        case 'type':
          comparison = (a.noteType || '').localeCompare(b.noteType || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [notes, searchQuery, selectedNoteType, selectedStatus, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: notes.length,
      processed: notes.filter(n => n.contentStatus === 'approved').length,
      flashcards: notes.reduce((sum, n) => sum + n.flashcardCount, 0),
      pending: notes.filter(n => n.contentStatus === 'draft').length,
      generating: notes.filter(n => n.contentStatus === 'generating').length,
    };
  }, [notes]);

  const handleUploadComplete = async (files: Array<{fileData: string, fileName: string, fileType: string, metadata?: PlaybookMetadataInput}>) => {
    try {
      if (!session?.access_token || !orgId) {
        showToast('Authentication error. Please sign in.', 'error');
        return;
      }

      const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions'
        : '/.netlify/functions';

      // Batch uploads to prevent overwhelming the server
      const BATCH_SIZE = 5; // Upload 5 files at a time
      const batches = [];

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE));
      }

      console.log(`Uploading ${files.length} files in ${batches.length} batches of ${BATCH_SIZE}`);

      let successCount = 0;
      let failCount = 0;

      setUploadProgress({ current: 0, total: files.length });

      // Process batches sequentially to avoid overwhelming the server
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);
        setUploadProgress({ current: successCount + failCount, total: files.length });

        // Upload files in this batch in parallel
        const uploadPromises = batch.map(file => {
          const noteMetadata = {
            ...file.metadata,
            content_type: 'reference', // Mark as reference for My Notes
          };

          return fetch(`${baseURL}/player-playbooks?orgId=${orgId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              fileData: file.fileData,
              fileName: file.fileName,
              metadata: noteMetadata,
            }),
          }).then(response => {
            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
            return response;
          }).catch(error => {
            failCount++;
            console.error(`Failed to upload ${file.fileName}:`, error);
            return null;
          });
        });

        await Promise.all(uploadPromises);

        // Small delay between batches to give server time to breathe
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setUploadProgress(null);

      if (failCount > 0) {
        showToast(`Upload complete: ${successCount} succeeded, ${failCount} failed. Check console for details.`, 'warning');
      } else {
        showToast(`Successfully uploaded ${successCount} file(s) to My Notes`, 'success');
      }

      await loadNotes();
      setCurrentView('library');
    } catch (error) {
      console.error('Error uploading files:', error);
      showToast(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleProcessNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!session?.access_token) {
      showToast('You must be signed in to process notes.', 'error');
      return;
    }

    if (!(await confirm({ message: 'Process this file? This will analyze the content and generate flashcards.', confirmLabel: 'Process' }))) {
      return;
    }

    try {
      const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions'
        : '/.netlify/functions';

      const response = await fetch(`${baseURL}/player-plays-process/${noteId}?orgId=${orgId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generateInsights: true,
          generateAssignments: true,
          generateKnowledge: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      showToast('Processing started! Check back in a few minutes.', 'info');
      await loadNotes();
    } catch (error) {
      console.error('Error processing note:', error);
      showToast('Failed to start processing. Please try again.', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!(await confirm({ message: `Delete "${fileName}"? This will permanently remove the file and all associated flashcards. This cannot be undone.`, variant: 'destructive', confirmLabel: 'Delete' }))) {
      return;
    }

    try {
      const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions'
        : '/.netlify/functions';

      const response = await fetch(`${baseURL}/player-notes/${noteId}?orgId=${orgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      showToast('Note deleted successfully', 'success');
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Failed to delete note. Please try again.', 'error');
    }
  };

  const handleViewNote = (note: NoteFile) => {
    setViewingNote(note);
    setCurrentView('viewer');
  };

  const handleSort = (column: 'name' | 'date' | 'status' | 'type') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNoteIds.size === filteredNotes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(filteredNotes.map(n => n.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.size === 0) return;

    if (!(await confirm({ message: `Delete ${selectedNoteIds.size} selected file(s)? This cannot be undone.`, variant: 'destructive', confirmLabel: 'Delete' }))) {
      return;
    }

    try {
      const baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:8888/.netlify/functions'
        : '/.netlify/functions';

      const deletePromises = Array.from(selectedNoteIds).map(noteId =>
        fetch(`${baseURL}/player-notes/${noteId}?orgId=${orgId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
      );

      await Promise.all(deletePromises);
      showToast(`Successfully deleted ${selectedNoteIds.size} file(s)`, 'success');
      setSelectedNoteIds(new Set());
      await loadNotes();
    } catch (error) {
      console.error('Error deleting notes:', error);
      showToast('Failed to delete some files. Please try again.', 'error');
    }
  };

  // Upload screen view
  if (currentView === 'upload') {
    return (
      <SidebarLayout>
        {uploadProgress && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#1B1E20] p-8 rounded-2xl border border-[#2A2E30] max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Uploading Files...</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{uploadProgress.current} / {uploadProgress.total}</span>
                </div>
                <div className="w-full bg-[#0A0A0A] rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#00F6E5] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-400 text-center">
                Please wait while we upload your files in batches...
              </p>
            </div>
          </div>
        )}
        <FileUploadScreen
          mode="notes"
          onBack={() => setCurrentView('library')}
          onUploadComplete={handleUploadComplete}
        />
      </SidebarLayout>
    );
  }

  // Viewer screen
  if (currentView === 'viewer' && viewingNote) {
    return (
      <SidebarLayout>
        <div className="h-screen flex flex-col bg-[#0A0A0A] text-white">
          <header className="border-b border-[#1B1E20] bg-[#0A0A0A]/95 backdrop-blur-xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('library')}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 12H5m7 7l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <div className="h-6 w-px bg-[#1B1E20]" />
                <h1 className="text-2xl font-bold text-white">{viewingNote.fileName}</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 flex items-center justify-center p-8 bg-[#0D1117]">
            {viewingNote.fileType === 'application/pdf' || viewingNote.fileName.endsWith('.pdf') ? (
              <iframe
                src={`https://svqkijmzpmxcmmapsdzp.supabase.co/storage/v1/object/public/Chalkboard%20Bucket/${viewingNote.filePath}`}
                className="w-full h-full border-0 rounded-lg"
                title={viewingNote.fileName}
              />
            ) : (
              <img
                src={`https://svqkijmzpmxcmmapsdzp.supabase.co/storage/v1/object/public/Chalkboard%20Bucket/${viewingNote.filePath}`}
                alt={viewingNote.fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-[#00F6E5]/20 border-t-[#00F6E5]" />
            <p className="text-slate-400">Loading your notes...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Main library view
  return (
    <SidebarLayout>
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl mb-2">
                My Notes
              </h1>
              <p className="text-slate-400">
                Upload and manage your study materials, playbooks, and reference files
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('upload')}
                className="px-4 py-2 rounded-lg bg-[#00F6E5] text-black text-sm font-semibold hover:bg-[#00F6E5]/90 transition-all flex items-center gap-2"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Files
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-[#00F6E5]">{stats.total}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Files</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-green-400">{stats.processed}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Processed</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-purple-400">{stats.flashcards}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Flashcards</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-slate-400">{stats.pending}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Pending</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-2xl font-black text-yellow-400">{stats.generating}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Generating</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white placeholder-slate-500 focus:border-[#00F6E5] focus:outline-none"
            />

            <select
              value={selectedNoteType}
              onChange={(e) => setSelectedNoteType(e.target.value as NoteType | 'all')}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Types</option>
              {(Object.entries(NOTE_TYPE_LABELS) as [NoteType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[#1B1E20] border border-[#2A2E30] text-white focus:border-[#00F6E5] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Processed</option>
              <option value="generating">Generating</option>
              <option value="rejected">Failed</option>
            </select>
          </div>
        </header>

        {/* Bulk Actions Bar */}
        {selectedNoteIds.size > 0 && (
          <div className="glass-card p-4 mb-4 flex items-center justify-between">
            <span className="text-white font-semibold">
              {selectedNoteIds.size} file(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedNoteIds(new Set())}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Content - Table View */}
        {filteredNotes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-slate-400 mb-2">No files found</div>
            <p className="text-sm text-slate-500">
              {searchQuery || selectedNoteType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload files to build your notes library'}
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1B1E20] border-b border-[#2A2E30]">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedNoteIds.size === filteredNotes.length && filteredNotes.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                      >
                        File Name
                        {sortBy === 'name' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                      >
                        Type
                        {sortBy === 'type' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                      >
                        Status
                        {sortBy === 'status' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Flashcards
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                      >
                        Date
                        {sortBy === 'date' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2E30]">
                  {filteredNotes.map((note) => (
                    <tr
                      key={note.id}
                      className="hover:bg-[#1B1E20]/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNoteIds.has(note.id)}
                          onChange={() => toggleNoteSelection(note.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-[#2A2F33] bg-[#0A0A0A] text-[#00F6E5] focus:ring-[#00F6E5]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleViewNote(note)}
                          className="flex items-center gap-3 text-left hover:text-[#00F6E5] transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {note.fileType === 'application/pdf' || note.fileName.endsWith('.pdf') ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <path d="M14 2v6h6" />
                              </svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            )}
                          </div>
                          <span className="text-white font-medium truncate max-w-xs" title={note.fileName}>
                            {note.fileName}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        {note.noteType ? (
                          <span className="px-2 py-1 text-xs bg-[#00F6E5]/10 text-[#00F6E5] rounded">
                            {NOTE_TYPE_LABELS[note.noteType]}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            note.contentStatus === 'approved'
                              ? 'bg-green-900/30 text-green-400'
                              : note.contentStatus === 'generating'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : note.contentStatus === 'rejected'
                              ? 'bg-red-900/30 text-red-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {note.contentStatus === 'generating' && (
                            <span className="inline-block mr-1">⏳</span>
                          )}
                          {note.contentStatus === 'rejected' ? '❌ Failed' : note.contentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {note.flashcardCount > 0 ? (
                          <span className="text-purple-400 font-semibold">
                            {note.flashcardCount}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {new Date(note.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {note.contentStatus === 'draft' && (
                            <button
                              onClick={(e) => handleProcessNote(note.id, e)}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#00F6E5] text-black rounded-lg hover:bg-[#00F6E5]/90 transition-colors"
                            >
                              Process
                            </button>
                          )}
                          {note.contentStatus === 'rejected' && (
                            <button
                              onClick={(e) => handleProcessNote(note.id, e)}
                              className="px-3 py-1.5 text-xs font-semibold bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors"
                            >
                              🔄 Retry
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNote(note.id, note.fileName, e)}
                            className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}

// Icons
function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
