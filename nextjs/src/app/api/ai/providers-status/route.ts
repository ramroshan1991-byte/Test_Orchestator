import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasKey = !!apiKey && apiKey !== 'your_claude_api_key_here';
  const isGroq = hasKey && apiKey.startsWith('gsk_');
  
  return NextResponse.json({
    activeProvider: hasKey ? (isGroq ? 'Groq / Llama 3' : 'Claude 3.5 Sonnet') : 'Offline (No API Key set)',
    usingLocalFallback: !hasKey,
    hasApiKey: hasKey
  });
}
