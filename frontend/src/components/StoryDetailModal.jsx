import React from 'react';
import { X } from 'lucide-react';

export function StoryDetailModal({ story, isOpen, onClose }) {
  if (!isOpen || !story) return null;

  return (
    <>
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-blue-400 text-lg">{story.id}</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  story.priority === 'High' ? 'bg-red-900/40 text-red-300' :
                  story.priority === 'Medium' ? 'bg-yellow-900/40 text-yellow-300' :
                  'bg-green-900/40 text-green-300'
                }`}>
                  {story.priority} Priority
                </span>
                <span className="text-sm px-2 py-1 rounded bg-slate-700 text-gray-300">
                  {story.points} pts
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white truncate">{story.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-white leading-relaxed whitespace-pre-wrap">{story.description}</p>
              </div>

              {/* Story Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                  <p className="text-white font-medium">{story.status}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Assignee</p>
                  <p className="text-white font-medium">{story.assignee}</p>
                </div>
              </div>

              {/* Acceptance Criteria - if available */}
              {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Acceptance Criteria</h3>
                  <ul className="space-y-2">
                    {story.acceptanceCriteria.map((criterion, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-blue-400 font-bold flex-shrink-0">✓</span>
                        <span className="text-gray-300">{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Fields - if available */}
              {story.additionalDetails && Object.keys(story.additionalDetails).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Additional Details</h3>
                  <div className="space-y-3">
                    {Object.entries(story.additionalDetails).map(([key, value]) => (
                      <div key={key} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{key}</p>
                        <p className="text-white text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
