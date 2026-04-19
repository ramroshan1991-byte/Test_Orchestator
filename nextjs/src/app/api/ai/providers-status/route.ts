import { NextResponse } from 'next/server';

export async function GET() {
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here';
  
  return NextResponse.json({
    activeProvider: hasAnthropicKey ? 'Claude 3.5 Sonnet' : 'Local Fallback / Mock',
    usingLocalFallback: !hasAnthropicKey,
    hasApiKey: hasAnthropicKey
  });
}
