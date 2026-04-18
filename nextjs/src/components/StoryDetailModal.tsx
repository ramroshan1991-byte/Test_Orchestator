'use client';

import React from 'react';
import { X, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { JiraStory } from '@/store/appStore';
import { useAppStore } from '@/store/appStore';

interface StoryDetailModalProps {
  story: JiraStory | null;
  isOpen: boolean;
  onClose: () => void;
  baseUrl?: string;
  email?: string;
  apiToken?: string;
}

export function StoryDetailModal({
  story,
  isOpen,
  onClose,
  baseUrl,
  email,
  apiToken,
}: StoryDetailModalProps) {
  const router = useRouter();
  const { testPlans, setTestPlans } = useAppStore();

  const [loadingDetails, setLoadingDetails] = React.useState(false);
  const [generatingPlan, setGeneratingPlan] = React.useState(false);
  const [planStepIndex, setPlanStepIndex] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [detailed, setDetailed] = React.useState<any | null>(null);

  if (!isOpen || !story) return null;

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDetails = async () => {
    if (!story || !baseUrl || !email || !apiToken) return;
    setLoadingDetails(true);
    try {
      const { apiClient } = await import('@/lib/api-client');
      const res = await apiClient.getIssue(baseUrl, email, apiToken, story.key);
      if (res && res.issue) {
        const issue = res.issue;
        setDetailed({
          ...story,
          summary: issue.summary || story.summary,
          description: issue.description || story.description,
          acceptanceCriteria: issue.acceptanceCriteria || story.acceptanceCriteria,
          assignee: issue.assignee || story.assignee,
          dueDate: issue.dueDate || story.dueDate,
          additionalDetails: issue.additionalDetails || (story as any).additionalDetails,
          created: issue.additionalDetails?.Created || (story as any).created,
          updated: issue.additionalDetails?.Updated || (story as any).updated,
        });
      }
    } catch (e) {
      console.error('Failed to fetch issue details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleGenerateTestPlan = async () => {
    setGeneratingPlan(true);
    setPlanStepIndex(0);
    const steps = [
      'Analyzing story & acceptance criteria...',
      'Identifying scope and risks...',
      'Building test strategy...',
      'Structuring test plan sections...',
    ];
    try {
      for (let i = 0; i < steps.length; i++) {
        setPlanStepIndex(i);
        await new Promise((r) => setTimeout(r, 700));
      }
      setPlanStepIndex(steps.length);
      await new Promise((r) => setTimeout(r, 300));

      const { apiClient } = await import('@/lib/api-client');
      const storyForPlan = detailed || story;
      const resp = await apiClient.generateTestPlan(storyForPlan);
      const returnedPlan = resp?.testPlan || resp;

      if (!returnedPlan) throw new Error('Invalid response from AI service');

      setTestPlans({ ...testPlans, [story.key]: returnedPlan });
      showToast(`Test plan generated for "${story.summary}"!`, 'success');
      setTimeout(() => {
        onClose();
        router.push('/test-plans');
      }, 1200);
    } catch (error) {
      showToast(
        `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setGeneratingPlan(false);
      setPlanStepIndex(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const abs = d.toLocaleDateString();
      const diff = Date.now() - d.getTime();
      const minutes = Math.round(diff / 60000);
      if (minutes < 1) return `${abs} (just now)`;
      if (minutes < 60) return `${abs} (${minutes}m ago)`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${abs} (${hours}h ago)`;
      const days = Math.round(hours / 24);
      return `${abs} (${days}d ago)`;
    } catch {
      return iso;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'highest':
        return 'bg-red-900 text-red-200 border-red-700';
      case 'high':
        return 'bg-orange-900 text-orange-200 border-orange-700';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'low':
      case 'lowest':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'closed':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-900 text-blue-200 border-blue-700';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  const s = detailed || story;
  const sa = s as any;

  const planSteps = [
    'Analyzing story & acceptance criteria...',
    'Identifying scope and risks...',
    'Building test strategy...',
    'Structuring test plan sections...',
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fixed inset-0 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto slide-down"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                {s.key}: {s.summary}
              </h2>
              <div className="flex items-center gap-4 mb-2 text-slate-400 text-sm flex-wrap">
                {sa.created && <span>Created: {formatDate(sa.created)}</span>}
                {sa.updated && <span className="ml-3">Updated: {formatDate(sa.updated)}</span>}
                {sa.additionalDetails?.Type && (
                  <span className="ml-3">Type: {sa.additionalDetails.Type}</span>
                )}
                {sa.points !== undefined && (
                  <span className="ml-3">Points: {sa.points}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(s.priority)}`}>
                  {s.priority}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(s.status)}`}>
                  {s.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-2 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Description */}
            {s.description && s.description !== 'No description provided' && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{s.description}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              {s.assignee && (
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Assigned To</p>
                  <p className="text-slate-200">{s.assignee}</p>
                </div>
              )}
              {s.dueDate && (
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-1">Due Date</p>
                  <p className="text-slate-200">{new Date(s.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Acceptance Criteria */}
            {s.acceptanceCriteria && s.acceptanceCriteria.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                    Acceptance Criteria
                  </h3>
                </div>
                <ul className="space-y-2">
                  {s.acceptanceCriteria.map((criterion: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-slate-200 leading-relaxed">
                      <span className="text-green-400 font-bold mt-1">✓</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No Acceptance Criteria */}
            {(!s.acceptanceCriteria || s.acceptanceCriteria.length === 0) && (
              <div className="p-4 bg-slate-700 rounded-lg border border-slate-600 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-300">No acceptance criteria defined for this story.</p>
              </div>
            )}

            {/* Plan generation progress */}
            {generatingPlan && (
              <div className="p-4 bg-slate-700/60 rounded-lg border border-purple-700/40 space-y-2">
                <p className="text-slate-300 text-sm font-semibold mb-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  Generating Test Plan...
                </p>
                {planSteps.map((step, i) => (
                  <p
                    key={i}
                    className={`text-sm transition-all ${
                      planStepIndex !== null && i < planStepIndex
                        ? 'text-green-400'
                        : planStepIndex === i
                        ? 'text-purple-300 font-medium'
                        : 'text-slate-500'
                    }`}
                  >
                    {planStepIndex !== null && i < planStepIndex ? '✓' : planStepIndex === i ? '⏳' : '○'} {step}
                  </p>
                ))}
                {planStepIndex !== null && planStepIndex >= planSteps.length && (
                  <p className="text-green-400 text-sm font-medium">✅ Saving test plan...</p>
                )}
              </div>
            )}

            {/* Toast */}
            {toast && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  toast.type === 'success'
                    ? 'bg-green-900/40 border border-green-600 text-green-300'
                    : 'bg-red-900/40 border border-red-600 text-red-300'
                }`}
              >
                {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex gap-3">
              {(!s.description || s.description === 'No description provided') && (
                <button
                  onClick={fetchDetails}
                  disabled={loadingDetails}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {loadingDetails ? 'Fetching...' : 'Fetch Details'}
                </button>
              )}
            </div>

            <div className="flex gap-3 ml-auto">
              {/* ✅ GENERATE TEST PLAN BUTTON */}
              <button
                onClick={handleGenerateTestPlan}
                disabled={generatingPlan}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-purple-900/30"
              >
                {generatingPlan ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {generatingPlan ? 'Generating...' : 'Generate Test Plan'}
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
