import { NextResponse } from 'next/server';
import aiService from '@/lib/services/aiService';

// A full 14-section plan at 16k output tokens takes well over the 10s default.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storyData } = body;

    if (!storyData) {
      return NextResponse.json({ error: 'storyData is required' }, { status: 400 });
    }

    const testPlan = await aiService.generateTestPlan(storyData);
    return NextResponse.json({ testPlan });
  } catch (error: any) {
    console.error('Test Plan Generation API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
