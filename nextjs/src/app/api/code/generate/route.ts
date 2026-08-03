import { NextResponse } from 'next/server';
import aiService from '@/lib/services/aiService';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testCase, framework, options } = body;

    if (!testCase || !framework) {
      return NextResponse.json({ error: 'testCase and framework are required' }, { status: 400 });
    }

    const code = await aiService.generateAutomationCode(testCase, framework, options || {
      pageObjectModel: true,
      addAssertions: true,
      addComments: true
    });
    
    return NextResponse.json({ code });
  } catch (error: any) {
    console.error('Code Generation API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
