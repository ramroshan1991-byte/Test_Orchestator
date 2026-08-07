'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  steps: string[];
  expectedResults: string[];
  acceptanceCriteria?: string[];
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
  environment?: string;
  preconditions?: string[];
  tags?: string[];
}

export interface TestPlan {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  scope: string;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

export interface JiraStory {
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria?: string[];
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
}

export interface CodeHistory {
  [testCaseId: string]: {
    [framework: string]: {
      code: string;
      lastUpdated: number;
    };
  };
}

export interface CustomPrompts {
  testPlan: string;
  testCase: string;
  codeGen: string;
}

interface AppStore {
  // State
  testPlans: { [key: string]: TestPlan };
  testCases: { [key: string]: TestCase[] };
  jiraStories: JiraStory[];
  loading: boolean;
  error: string | null;
  selectedPlan: string | null;
  selectedFramework: string;
  codeHistory: CodeHistory;
  customPromptMode: boolean;
  customPrompts: CustomPrompts;
  activeTab: string;

  // Actions
  setTestPlans: (plans: { [key: string]: TestPlan }) => void;
  setTestCases: (cases: { [key: string]: TestCase[] }) => void;
  /** Record an execution result against one case, wherever it lives. */
  updateTestCase: (caseId: string, patch: Record<string, any>) => void;
  /** Remove a whole suite (one generation run) by its group key. */
  deleteTestCaseGroup: (groupKey: string) => void;
  /** Apply the same patch to many cases (bulk mark pass/fail/blocked). */
  updateTestCases: (caseIds: string[], patch: Record<string, any>) => void;
  deleteTestCases: (caseIds: string[]) => void;
  setJiraStories: (stories: JiraStory[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedPlan: (planId: string | null) => void;
  setSelectedFramework: (framework: string) => void;
  setActiveTab: (tab: string) => void;
  saveCodeToHistory: (testCaseId: string, framework: string, code: string) => void;
  getCodeFromHistory: (testCaseId: string, framework: string) => string | null;
  toggleCustomPromptMode: () => void;
  setCustomPrompt: (promptType: keyof CustomPrompts, promptText: string) => void;
  resetCustomPrompts: () => void;
  clearData: () => void;
}

const defaultCustomPrompts: CustomPrompts = {
  testPlan: 'Generate a comprehensive test plan based on the requirements',
  testCase: 'Create detailed test cases with steps, expected results, and acceptance criteria',
  codeGen: 'Generate automated test code using the specified framework',
};

/**
 * Stable identity for a case. Prefers `uid` (unique across suites); falls back to
 * the display id for cases generated before uid existed.
 */
export const caseKey = (tc: any): string => tc?.uid || tc?.tid || tc?.id;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      testPlans: {},
      testCases: {},
      jiraStories: [],
      loading: false,
      error: null,
      selectedPlan: null,
      selectedFramework: 'Selenium Java',
      codeHistory: {},
      customPromptMode: false,
      customPrompts: defaultCustomPrompts,
      activeTab: 'jiraConnect',

      // Actions
      setTestPlans: (plans) => set({ testPlans: plans }),
      setTestCases: (cases) => set({ testCases: cases }),

      // Cases are stored grouped by plan/source key, so an edit has to find the
      // owning group rather than index a flat list.
      updateTestCase: (caseId, patch) => {
        const groups = get().testCases || {};
        const next: { [key: string]: any[] } = {};
        for (const [key, list] of Object.entries(groups)) {
          next[key] = (list as any[]).map((tc) =>
            caseKey(tc) === caseId ? { ...tc, ...patch, lastUpdated: new Date().toISOString() } : tc
          );
        }
        set({ testCases: next as any });
      },

      updateTestCases: (caseIds, patch) => {
        const ids = new Set(caseIds);
        const groups = get().testCases || {};
        const next: { [key: string]: any[] } = {};
        for (const [key, list] of Object.entries(groups)) {
          next[key] = (list as any[]).map((tc) =>
            ids.has(caseKey(tc)) ? { ...tc, ...patch, lastUpdated: new Date().toISOString() } : tc
          );
        }
        set({ testCases: next as any });
      },

      deleteTestCaseGroup: (groupKey) => {
        const groups = { ...(get().testCases || {}) } as any;
        delete groups[groupKey];
        set({ testCases: groups });
      },

      deleteTestCases: (caseIds) => {
        const ids = new Set(caseIds);
        const groups = get().testCases || {};
        const next: { [key: string]: any[] } = {};
        for (const [key, list] of Object.entries(groups)) {
          next[key] = (list as any[]).filter((tc) => !ids.has(caseKey(tc)));
        }
        set({ testCases: next as any });
      },
      setJiraStories: (stories) => set({ jiraStories: stories }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSelectedPlan: (planId) => set({ selectedPlan: planId }),
      setSelectedFramework: (framework) => set({ selectedFramework: framework }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      saveCodeToHistory: (testCaseId: string, framework: string, code: string) => {
        const currentHistory = get().codeHistory;
        set({
          codeHistory: {
            ...currentHistory,
            [testCaseId]: {
              ...(currentHistory[testCaseId] || {}),
              [framework]: {
                code,
                lastUpdated: Date.now(),
              },
            },
          },
        });
      },

      getCodeFromHistory: (testCaseId: string, framework: string) => {
        const history = get().codeHistory;
        return history[testCaseId]?.[framework]?.code || null;
      },

      toggleCustomPromptMode: () => {
        set((state) => ({
          customPromptMode: !state.customPromptMode,
        }));
      },

      setCustomPrompt: (promptType: keyof CustomPrompts, promptText: string) => {
        set((state) => ({
          customPrompts: {
            ...state.customPrompts,
            [promptType]: promptText,
          },
        }));
      },

      resetCustomPrompts: () => {
        set({ customPrompts: defaultCustomPrompts });
      },

      clearData: () => {
        set({
          testPlans: {},
          testCases: {},
          jiraStories: [],
          codeHistory: {},
          customPrompts: defaultCustomPrompts,
          customPromptMode: false,
          selectedPlan: null,
          activeTab: 'jiraConnect',
        });
      },
    }),
    {
      name: 'app-store',
      storage:
        typeof window !== 'undefined'
          ? {
              getItem: (name) => {
                const item = window.localStorage.getItem(name);
                return item ? JSON.parse(item) : null;
              },
              setItem: (name, value) => {
                window.localStorage.setItem(name, JSON.stringify(value));
              },
              removeItem: (name) => {
                window.localStorage.removeItem(name);
              },
            }
          : undefined,
    }
  )
);
