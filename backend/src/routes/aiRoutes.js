import express from 'express';

const router = express.Router();

router.get('/providers-status', (req, res) => {
  // In a real app, this would check connectivity to each LLM provider
  // For now, we return a healthy status for the ones configured in .env
  const hasAnthropicKey = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here';
  
  res.json({
    openai: { status: 'online', name: 'OpenAI', emoji: '🤖' },
    anthropic: { status: hasAnthropicKey ? 'online' : 'warning', name: 'Anthropic', emoji: '🧠' },
    gemini: { status: 'online', name: 'Google Gemini', emoji: '✨' },
    ollama: { status: 'offline', name: 'Local Ollama', emoji: '🦙' },
    nvidia: { status: 'online', name: 'Nvidia NIM', emoji: '⚡' },
  });
});

export default router;
