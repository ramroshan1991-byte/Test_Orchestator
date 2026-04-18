import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  // JIRA Integration
  async fetchStories(baseURL: string, email: string, apiToken: string, projectKey?: string, options?: { forceDeepFetch?: boolean }) {
    try {
      const payload = {
        baseURL,
        email,
        apiToken,
        projectKey: projectKey || '',
        forceDeepFetch: options?.forceDeepFetch || false,
      };
      
      console.log('Fetching Jira stories with payload:', payload);
      
      const response = await this.client.post('/jira/stories', payload);
      console.log('Jira stories response:', response.data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      console.error('Failed to fetch Jira stories:', errorMessage, error.response?.data);
      throw new Error(`Failed to fetch Jira stories: ${errorMessage}`);
    }
  }

  // Test Plan Generation
  async generateTestPlan(story: any, customPrompt?: string) {
    try {
      const response = await this.client.post('/test-plans/generate', {
        storyData: story,
        customPrompt,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate test plan: ${error}`);
    }
  }

  // Test Case Generation
  // Preferred: call with (storyData, testPlanScope)
  async generateTestCases(storyData: any, testPlanScope?: any, customPrompt?: string) {
    try {
      const payload: any = {};
      if (storyData) payload.storyData = storyData;
      if (testPlanScope) payload.testPlanScope = testPlanScope;
      if (customPrompt) payload.customPrompt = customPrompt;

      const response = await this.client.post('/test-cases/generate', payload);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate test cases: ${error}`);
    }
  }

  // Code Generation
  async generateCode(
    testCase: any,
    framework: string,
    customPrompt?: string
  ) {
    try {
      const response = await this.client.post('/code/generate', {
        testCase,
        framework,
        customPrompt,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate code: ${error}`);
    }
  }

  // AI Provider Status
  async checkAIProviderStatus() {
    try {
      const response = await this.client.get('/ai/providers-status');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch AI provider status');
      return null;
    }
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Fetch single Jira issue details
  async getIssue(baseURL: string, email: string, apiToken: string, issueKey: string) {
    try {
      const response = await this.client.get(`/jira/issue/${encodeURIComponent(issueKey)}`, {
        params: { baseURL, email, apiToken },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      console.error('Failed to fetch Jira issue:', errorMessage, error.response?.data);
      throw new Error(`Failed to fetch Jira issue: ${errorMessage}`);
    }
  }
}

export const apiClient = new APIClient();
