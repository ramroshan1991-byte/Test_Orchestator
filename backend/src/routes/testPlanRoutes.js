import express from 'express';
import aiService from '../services/aiService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Generate test plan
router.post('/generate', async (req, res) => {
  // Accept either { storyData } or { story }
  const storyData = req.body.storyData || req.body.story || null;

  if (!storyData) {
    return res.status(400).json({ error: 'storyData is required' });
  }

  const testPlan = await aiService.generateTestPlan(storyData);
  const testPlanWithId = {
    id: uuidv4(),
    storyId: storyData.id || storyData.key || null,
    storyTitle: storyData.title || storyData.summary || null,
    ...testPlan,
    createdAt: new Date().toISOString(),
  };

  res.json({ testPlan: testPlanWithId });
});

// Get test plan
router.get('/:id', async (req, res) => {
  // This would normally fetch from database
  res.json({ message: 'Test plan retrieved' });
});

export default router;
