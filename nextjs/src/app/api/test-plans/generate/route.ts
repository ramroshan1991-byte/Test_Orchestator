import { NextResponse } from 'next/server';
import aiService from '@/lib/services/aiService';

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
