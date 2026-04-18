import { create } from 'zustand';

export const useStore = create((set) => ({
  // Jira configuration
  jiraConfig: {
    baseURL: localStorage.getItem('jiraBaseURL') || '',
    email: localStorage.getItem('jiraEmail') || '',
    apiToken: localStorage.getItem('jiraApiToken') || '',
    projectKey: localStorage.getItem('jiraProjectKey') || '',
    connected: localStorage.getItem('jiraConnected') === 'true',
  },

  // Stories and Test Plans
  stories: [],
  selectedStories: [],
  testPlans: {}, // { storyId: { ...planData } }
  testCases: {}, // { planId: [...testCases] }
  generatedCode: {}, // { planId: { framework: code } }
  activityLog: [],

  // Generated code history
  codeHistory: {}, // { testCaseId: { selenium: code, playwright: code, cypress: code } }
  
  // Custom prompts and settings
  customPromptMode: localStorage.getItem('customPromptMode') === 'true',
  customPrompts: {
    testPlan: localStorage.getItem('customPrompt_testPlan') || 'Generate a comprehensive test plan',
    testCase: localStorage.getItem('customPrompt_testCase') || 'Create detailed test cases',
    codeGen: localStorage.getItem('customPrompt_codeGen') || 'Generate automation code',
  },

  // Settings
  demoMode: localStorage.getItem('demoMode') === 'true',

  // Actions
  setJiraConfig: (config) =>
    set((state) => {
      localStorage.setItem('jiraBaseURL', config.baseURL);
      localStorage.setItem('jiraEmail', config.email);
      localStorage.setItem('jiraApiToken', config.apiToken);
      localStorage.setItem('jiraProjectKey', config.projectKey);
      localStorage.setItem('jiraConnected', config.connected);
      return { jiraConfig: config };
    }),

  setStories: (stories) => set({ stories }),

  selectStory: (storyId) =>
    set((state) => ({
      selectedStories: state.selectedStories.includes(storyId)
        ? state.selectedStories.filter((id) => id !== storyId)
        : [...state.selectedStories, storyId],
    })),

  // Generate test plan from story
  generateTestPlan: (storyId, storyData) =>
    set((state) => {
      const title = storyData.title || storyData.name || 'Untitled Story';
      const description = storyData.description || `Comprehensive testing for ${title}`;
      
      return {
        testPlans: {
          ...state.testPlans,
          [storyId]: {
            id: storyData.id || `TP-${storyId}`,
            name: storyData.name || `Test Plan: ${title}`,
            description: description,
            status: storyData.status || 'Active',
            storyId: storyId,
            storyTitle: title,
            storyPoints: storyData.points || 0,
            assignee: storyData.assignee || 'Unassigned',
            priority: storyData.priority || 'Medium',
            testCases: storyData.testCases || 0,
            coverage: storyData.coverage || 0,
            dueDate: storyData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created: storyData.created || new Date().toISOString().split('T')[0],
            objective: storyData.objective || `Ensure ${title.toLowerCase()} functions correctly`,
            inScope: storyData.inScope || [title, 'Error handling', 'User interactions'],
            outOfScope: storyData.outOfScope || ['Performance testing', 'Load testing'],
            testTypes: storyData.testTypes || ['Functional', 'Integration', 'Smoke'],
            entryCriteria: storyData.entryCriteria || ['Test environment ready', 'Test data prepared', 'Story refined'],
            exitCriteria: storyData.exitCriteria || ['All tests passed', 'No open blockers', 'Coverage >= 80%'],
            risks: storyData.risks || ['Data availability', 'Third-party integrations', 'Environment stability'],
          },
        },
      };
    }),

  // Generate test cases from plan
  generateTestCases: (planId, planData) =>
    set((state) => {
      const baseCases = [
        {
          id: `${planId}-TC-001`,
          title: `Verify ${planData.storyTitle} - Happy Path`,
          plan: planData.name,
          priority: planData.priority,
          status: 'Not Run',
          type: 'Functional',
          createdDate: new Date().toISOString().split('T')[0],
          module: planData.storyTitle,
          preconditions: ['System is accessible', 'User is authenticated', 'Test data is prepared'],
          testSteps: [
            { step_number: 1, action: `Initiate ${(planData.storyTitle ? planData.storyTitle.toLowerCase() : 'untitled')}`, expected_result: 'Page/Form loads successfully' },
            { step_number: 2, action: 'Enter valid data', expected_result: 'Data is accepted without errors' },
            { step_number: 3, action: 'Submit/Confirm action', expected_result: 'Action processed successfully' },
            { step_number: 4, action: 'Verify result in system', expected_result: 'Changes are persisted correctly' },
          ],
          expectedOutcome: `${planData.storyTitle} completes successfully with expected results`,
        },
        {
          id: `${planId}-TC-002`,
          title: `Verify ${planData.storyTitle} - Error Handling`,
          plan: planData.name,
          priority: 'High',
          status: 'Not Run',
          type: 'Negative',
          createdDate: new Date().toISOString().split('T')[0],
          module: planData.storyTitle,
          preconditions: ['System is accessible'],
          testSteps: [
            { step_number: 1, action: 'Attempt with invalid data', expected_result: 'Error message appears' },
            { step_number: 2, action: 'Verify error handling', expected_result: 'Appropriate error message shown' },
          ],
          expectedOutcome: 'Errors are handled gracefully with user-friendly messages',
        },
        {
          id: `${planId}-TC-003`,
          title: `Verify ${planData.storyTitle} - Edge Cases`,
          plan: planData.name,
          priority: 'Medium',
          status: 'Not Run',
          type: 'Boundary',
          createdDate: new Date().toISOString().split('T')[0],
          module: planData.storyTitle,
          preconditions: ['System is accessible'],
          testSteps: [
            { step_number: 1, action: 'Test with boundary values', expected_result: 'System handles edge cases' },
            { step_number: 2, action: 'Test with null/empty values', expected_result: 'Proper validation applied' },
          ],
          expectedOutcome: 'All edge cases are handled appropriately',
        },
      ];

      return {
        testCases: {
          ...state.testCases,
          [planId]: baseCases,
        },
      };
    }),

  // Generate code from test cases
  generateCode: (planId, testCaseIds, framework) =>
    set((state) => {
      const selectedCases = state.testCases[planId]?.filter(tc => testCaseIds.includes(tc.id)) || [];
      
      const codeTemplates = {
        selenium: `# Generated Selenium Test Code - ${planId}
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pytest

${selectedCases.map(tc => `
    def test_${tc.id.replace(/-/g, '_').toLowerCase()}(self):
        """${tc.title}"""
        # ${tc.expectedOutcome}
        ${tc.testSteps.map((step) => `
        # Step ${step.step_number}: ${step.action}
        # Expected: ${step.expected_result}`).join('\n')}
        assert True  # Replace with actual assertions
`).join('\n')}
`,
        playwright: `// Generated Playwright Test Code - ${planId}
import { test, expect } from '@playwright/test';

${selectedCases.map(tc => `
test('${tc.title}', async ({ page }) => {
  // ${tc.expectedOutcome}
  ${tc.testSteps.map((step) => `
  // Step ${step.step_number}: ${step.action}
  // Expected: ${step.expected_result}`).join('\n')}
  
  expect(true).toBeTruthy(); // Replace with actual assertions
});
`).join('\n')}
`,
      };

      return {
        generatedCode: {
          ...state.generatedCode,
          [planId]: {
            [framework]: codeTemplates[framework] || '',
            testCases: selectedCases,
          },
        },
      };
    }),

  addTestPlan: (storyId, testPlan) =>
    set((state) => ({
      testPlans: { ...state.testPlans, [storyId]: testPlan },
    })),

  addTestCases: (planId, testCases) =>
    set((state) => ({
      testCases: { ...state.testCases, [planId]: testCases },
    })),

  addActivityLog: (activity) =>
    set((state) => ({
      activityLog: [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          ...activity,
        },
        ...state.activityLog.slice(0, 49),
      ],
    })),

  deleteTestCase: (planId, testCaseId) =>
    set((state) => ({
      testCases: {
        ...state.testCases,
        [planId]: (state.testCases[planId] || []).filter(tc => tc.id !== testCaseId),
      },
    })),

  toggleDemoMode: () =>
    set((state) => {
      localStorage.setItem('demoMode', !state.demoMode);
      return { demoMode: !state.demoMode };
    }),

  // Code history management
  saveCodeToHistory: (testCaseId, framework, code) =>
    set((state) => ({
      codeHistory: {
        ...state.codeHistory,
        [testCaseId]: {
          ...(state.codeHistory[testCaseId] || {}),
          [framework]: code,
          lastUpdated: new Date().toISOString(),
        },
      },
    })),

  getCodeFromHistory: (testCaseId, framework) =>
    set((state) => {
      return state;
    }),

  // Custom prompt management
  toggleCustomPromptMode: () =>
    set((state) => {
      const newMode = !state.customPromptMode;
      localStorage.setItem('customPromptMode', newMode);
      return { customPromptMode: newMode };
    }),

  setCustomPrompt: (promptType, promptText) =>
    set((state) => {
      localStorage.setItem(`customPrompt_${promptType}`, promptText);
      return {
        customPrompts: {
          ...state.customPrompts,
          [promptType]: promptText,
        },
      };
    }),

  clearData: () =>
    set({
      stories: [],
      selectedStories: [],
      testPlans: {},
      testCases: {},
      generatedCode: {},
      codeHistory: {},
      activityLog: [],
    }),
}));
