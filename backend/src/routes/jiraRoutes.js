import express from 'express';
import jiraService from '../services/jiraService.js';

const router = express.Router();

// Test Jira connection
router.post('/test-connection', async (req, res) => {
  const baseURL = req.body.baseURL || req.body.url;
  const { email, apiToken, projectKey } = req.body;

  if (!baseURL || !email || !apiToken) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const result = await jiraService.testConnection(baseURL, email, apiToken, projectKey);
  res.json(result);
});

// Get stories from a project
router.post('/stories', async (req, res) => {
  const baseURL = req.body.baseURL || req.body.url;
  const { projectKey, sprintName, email, apiToken, forceDeepFetch } = req.body;

  console.log('Received /stories request with:', { projectKey, baseURL, email, apiToken: apiToken ? '***' : 'missing' });

  if (!projectKey || !baseURL || !email || !apiToken) {
    const missing = [];
    if (!projectKey) missing.push('projectKey');
    if (!baseURL) missing.push('baseURL');
    if (!email) missing.push('email');
    if (!apiToken) missing.push('apiToken');
    
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const stories = await jiraService.getStories(projectKey, sprintName, baseURL, email, apiToken, { forceDeepFetch });
    console.log(`Fetched ${stories.length} stories from Jira`);
    res.json({ stories });
  } catch (error) {
    console.error('Jira stories error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Get projects
router.post('/projects', async (req, res) => {
  const { baseURL, email, apiToken } = req.body;

  if (!baseURL || !email || !apiToken) {
    return res.status(400).json({ error: 'baseURL, email, and apiToken are required' });
  }

  try {
    const projects = await jiraService.getProjects(baseURL, email, apiToken);
    res.json({ projects });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single issue with renderedFields
router.get('/issue/:key', async (req, res) => {
  const { key } = req.params;
  const { baseURL, email, apiToken } = req.query;

  if (!key || !baseURL || !email || !apiToken) {
    return res.status(400).json({ error: 'key, baseURL, email, and apiToken are required' });
  }

  try {
    const issue = await jiraService.getIssue(key, baseURL, email, apiToken);
    res.json({ issue });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
