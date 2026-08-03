import { NextResponse } from 'next/server';
import aiService from '@/lib/services/aiService';

// One batch per request. The client loops (see lib/testCaseGeneration.ts) so a
// 40-case run never has to finish inside a single serverless invocation.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storyData, testPlanScope, batch } = body;

    if (!storyData) {
      return NextResponse.json({ error: 'storyData is required' }, { status: 400 });
    }

    const testCases = await (aiService as any).generateTestCases(storyData, testPlanScope, batch || {});
    return NextResponse.json({
      testCases,
      batchIndex: Number(batch?.index) || 0,
      requested: Number(batch?.size) || null,
      returned: Array.isArray(testCases) ? testCases.length : 0,
    });
  } catch (error: any) {
    console.error('Test Case Generation API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
