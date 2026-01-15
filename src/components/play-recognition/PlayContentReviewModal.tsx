'use client';

import React, { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { GeneratedContent, EditedContent } from '@/types/play-content';

interface PlayContentReviewModalProps {
  content: GeneratedContent;
  playName: string;
  onClose: () => void;
  onApprove: (editedContent: EditedContent, notes: string) => Promise<void>;
  onReject: (notes: string) => Promise<void>;
}

export default function PlayContentReviewModal({
  content,
  playName,
  onClose,
  onApprove,
  onReject,
}: PlayContentReviewModalProps) {
  // Convert playAnalysis.positions to editable format if assignments is empty
  const initialAssignments = useMemo(() => {
    if (content.assignments && content.assignments.length > 0) {
      return content.assignments;
    }

    // Fallback: convert playAnalysis.positions to assignment format
    if (content.playAnalysis?.positions) {
      return Object.entries(content.playAnalysis.positions).map(([position, data]: [string, any]) => ({
        id: `temp-${position}`, // Temporary ID since these weren't saved to DB
        position: position.toUpperCase(),
        alignment: data.alignment || '',
        landmark: data.landmark || '',
        assignment: data.assignment || '',
        key_read: data.read || '',
        route_id: data.routeId || null,
        route_depth: data.depth || null,
        coverage_adjustments: data.adjustments || {},
      }));
    }

    return [];
  }, [content]);

  const [editedInsights, setEditedInsights] = useState(content.insights || '');
  const [reviewNotes, setReviewNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    insights: true,
    assignments: false,
    knowledge: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSection = (section: 'insights' | 'assignments' | 'knowledge') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getEditedContent = (): EditedContent => {
    return {
      insights: editedInsights,
      assignments: [], // We'll handle this in the backend
      knowledgeCards: content.knowledgeCards.map((card) => ({
        id: card.id,
        question_prompt: card.question_prompt,
        correct_answer: card.correct_answer,
      })),
    };
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(getEditedContent(), reviewNotes);
      onClose();
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(reviewNotes);
      onClose();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0F1419] rounded-lg border border-[#1E2732] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0F1419] border-b border-[#1E2732] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Review AI Content</h2>
            <p className="text-sm text-gray-400 mt-1">{playName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{initialAssignments.length}</div>
              <div className="text-sm text-gray-400">Position Assignments</div>
            </div>
            <div className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{content.knowledgeCards.length}</div>
              <div className="text-sm text-gray-400">Quiz Cards</div>
            </div>
            <div className="bg-[#1A1F28] border border-[#1E2732] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#00D9FF]">{content.playAnalysis?.playType || 'N/A'}</div>
              <div className="text-sm text-gray-400">Play Type</div>
            </div>
          </div>

          {/* Playbook Insights Section */}
          <div className="border border-[#1E2732] rounded-lg bg-[#1A1F28]">
            <button
              onClick={() => toggleSection('insights')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1E2732] transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <span className="font-semibold text-white">Playbook Insights</span>
              </div>
              {expandedSections.insights ? (
                <ChevronUp className="text-gray-400" />
              ) : (
                <ChevronDown className="text-gray-400" />
              )}
            </button>

            {expandedSections.insights && (
              <div className="p-4 border-t border-[#1E2732]">
                <div className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                  <div className="prose prose-invert max-w-none text-sm text-gray-300 whitespace-pre-wrap">
                    {editedInsights}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This will be displayed to players in the playbook view
                </p>
              </div>
            )}
          </div>

          {/* Position Assignments Section */}
          <div className="border border-[#1E2732] rounded-lg bg-[#1A1F28]">
            <button
              onClick={() => toggleSection('assignments')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1E2732] transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span className="font-semibold text-white">
                  Position Assignments ({initialAssignments.length})
                </span>
              </div>
              {expandedSections.assignments ? (
                <ChevronUp className="text-gray-400" />
              ) : (
                <ChevronDown className="text-gray-400" />
              )}
            </button>

            {expandedSections.assignments && (
              <div className="p-4 border-t border-[#1E2732]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {initialAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-[#00D9FF] text-lg">{assignment.position}</span>
                        {assignment.route_id && (
                          <span className="text-xs px-2 py-1 bg-[#1E2732] text-gray-300 rounded">
                            {assignment.route_id} {assignment.route_depth && `(${assignment.route_depth}yd)`}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Alignment:</span>
                          <span className="text-gray-300 ml-2">{assignment.alignment}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Assignment:</span>
                          <span className="text-gray-300 ml-2">{assignment.assignment}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Key Read:</span>
                          <span className="text-gray-300 ml-2">{assignment.key_read}</span>
                        </div>
                        {assignment.landmark && (
                          <div>
                            <span className="text-gray-500">Landmark:</span>
                            <span className="text-gray-300 ml-2">{assignment.landmark}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Cards Section */}
          <div className="border border-[#1E2732] rounded-lg bg-[#1A1F28]">
            <button
              onClick={() => toggleSection('knowledge')}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1E2732] transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">❓</span>
                <span className="font-semibold text-white">
                  Quiz Cards ({content.knowledgeCards.length})
                </span>
              </div>
              {expandedSections.knowledge ? (
                <ChevronUp className="text-gray-400" />
              ) : (
                <ChevronDown className="text-gray-400" />
              )}
            </button>

            {expandedSections.knowledge && (
              <div className="p-4 border-t border-[#1E2732] space-y-3">
                {content.knowledgeCards.map((card, index) => (
                  <div key={card.id} className="bg-[#0F1419] border border-[#1E2732] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-white">Card {index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-[#1E2732] text-[#00D9FF] rounded">
                        {card.category}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Question:</div>
                        <div className="text-sm text-gray-300">{card.question_prompt}</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Answer:</div>
                        <div className="text-sm text-white font-medium">{card.correct_answer}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Play Details */}
          {content.playAnalysis && (
            <div className="border border-[#1E2732] rounded-lg bg-[#1A1F28] p-4">
              <h3 className="font-semibold text-white mb-3">Play Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Formation:</span>
                  <span className="text-gray-300 ml-2">{content.playAnalysis.formation}</span>
                </div>
                <div>
                  <span className="text-gray-500">Concept:</span>
                  <span className="text-gray-300 ml-2">{content.playAnalysis.concept}</span>
                </div>
                {content.playAnalysis.bestAgainst && content.playAnalysis.bestAgainst.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Best Against:</span>
                    <span className="text-gray-300 ml-2">{content.playAnalysis.bestAgainst.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes about this review..."
              className="w-full px-3 py-2 bg-[#1A1F28] border border-[#1E2732] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00D9FF] focus:border-transparent text-sm"
              rows={3}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-[#0F1419] border-t border-[#1E2732] px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-red-400 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 rounded-lg font-medium transition disabled:opacity-50"
          >
            <XCircle size={18} />
            Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-black bg-[#00D9FF] hover:bg-[#00B8DD] rounded-lg font-medium transition disabled:opacity-50"
          >
            <CheckCircle size={18} />
            {isSubmitting ? 'Publishing...' : 'Approve & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
