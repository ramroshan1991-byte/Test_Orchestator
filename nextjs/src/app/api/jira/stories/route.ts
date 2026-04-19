import { NextResponse } from 'next/server';
import jiraService from '@/lib/services/jiraService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectKey, sprintName, baseURL, email, apiToken, forceDeepFetch } = body;

    if (!projectKey || !baseURL || !email || !apiToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stories = await jiraService.getStories(projectKey, sprintName, baseURL, email, apiToken, { forceDeepFetch });
    return NextResponse.json({ stories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
