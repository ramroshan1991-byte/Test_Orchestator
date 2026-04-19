import { NextResponse } from 'next/server';
import aiService from '@/lib/services/aiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storyData, customPrompt } = body;

    if (!storyData) {
      return NextResponse.json({ error: 'storyData is required' }, { status: 400 });
    }

    const testPlan = await aiService.generateTestPlan(storyData);
    return NextResponse.json({ testPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
