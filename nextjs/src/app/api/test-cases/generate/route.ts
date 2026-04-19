import { NextResponse } from 'next/server';
import aiService from '@/lib/services/aiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storyData, testPlanScope, customPrompt } = body;

    if (!storyData) {
      return NextResponse.json({ error: 'storyData is required' }, { status: 400 });
    }

    const testCases = await aiService.generateTestCases(storyData, testPlanScope);
    return NextResponse.json({ testCases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
