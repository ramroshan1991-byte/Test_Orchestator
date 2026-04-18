import express from 'express';
import aiService from '../services/aiService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Generate test cases
router.post('/generate', async (req, res) => {
  const { storyData, testPlanScope } = req.body;

  if (!storyData) {
    return res.status(400).json({ error: 'storyData is required' });
  }

  const testCases = await aiService.generateTestCases(storyData, testPlanScope);
  
  const testCasesWithIds = (Array.isArray(testCases) ? testCases : [testCases]).map(
    (tc, index) => ({
      ...tc,
      id: tc.id || `TC_${String(index + 1).padStart(3, '0')}`,
      workspaceId: uuidv4(),
      storyId: storyData.id,
      createdAt: new Date().toISOString(),
      status: 'Not Started',
      lastUpdated: new Date().toISOString(),
    })
  );

  res.json({ testCases: testCasesWithIds });
});

// Get all test cases (would fetch from DB)
router.get('/', async (req, res) => {
  res.json({ testCases: [] });
});

// Update test case
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;

  res.json({
    message: 'Test case updated',
    testCase: { id, ...updatedData },
  });
});

// Delete test case
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  res.json({ message: 'Test case deleted', id });
});

export default router;
