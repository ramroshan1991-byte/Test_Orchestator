import express from 'express';
import aiService from '../services/aiService.js';

const router = express.Router();

// Generate automation code
router.post('/generate-code', async (req, res) => {
  const { testCase, framework, options } = req.body;

  if (!testCase || !framework) {
    return res
      .status(400)
      .json({ error: 'testCase and framework are required' });
  }

  const code = await aiService.generateAutomationCode(testCase, framework, options);

  res.json({
    code,
    framework,
    language: framework === 'selenium-java' ? 'java' : 'javascript',
    testCaseId: testCase.id,
  });
});

export default router;
