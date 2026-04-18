import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

export const jiraAPI = {
  testConnection: async (baseURL, email, apiToken) => {
    const response = await API.post('/jira/test-connection', {
      baseURL,
      email,
      apiToken,
    });
    return response.data;
  },

  getStories: async (projectKey, sprintName = null, baseURL = null, email = null, apiToken = null) => {
    const response = await API.post('/jira/stories', {
      projectKey,
      sprintName,
      baseURL,
      email,
      apiToken,
    });
    return response.data.stories;
  },

  getProjects: async (baseURL = null, email = null, apiToken = null) => {
    const response = await API.post('/jira/projects', {
      baseURL,
      email,
      apiToken,
    });
    return response.data.projects;
  },
};

export const testPlanAPI = {
  generate: async (storyData) => {
    const response = await API.post('/test-plans/generate', { storyData });
    return response.data.testPlan;
  },
};

export const testCaseAPI = {
  generate: async (storyData, testPlanScope) => {
    const response = await API.post('/test-cases/generate', {
      storyData,
      testPlanScope,
    });
    return response.data.testCases;
  },

  update: async (testCaseId, updates) => {
    const response = await API.put(`/test-cases/${testCaseId}`, updates);
    return response.data.testCase;
  },

  delete: async (testCaseId) => {
    await API.delete(`/test-cases/${testCaseId}`);
  },
};

export const codeGeneratorAPI = {
  generateCode: async (testCase, framework, options) => {
    const response = await API.post('/code-generator/generate-code', {
      testCase,
      framework,
      options,
    });
    return response.data;
  },
};
