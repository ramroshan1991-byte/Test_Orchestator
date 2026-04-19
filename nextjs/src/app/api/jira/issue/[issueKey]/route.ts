import { NextResponse } from 'next/server';
import jiraService from '@/lib/services/jiraService';

export async function GET(request: Request, context: any) {
  try {
    const { params } = context;
    const issueKey = params?.issueKey || params?.key;

    if (!issueKey) {
      return NextResponse.json({ error: 'Issue Key is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const baseURL = searchParams.get('baseURL');
    const email = searchParams.get('email');
    const apiToken = searchParams.get('apiToken');

    if (!baseURL || !email || !apiToken) {
      return NextResponse.json({ error: 'baseURL, email, and apiToken are required' }, { status: 400 });
    }

    const issue = await jiraService.getIssue(issueKey, baseURL, email, apiToken);
    return NextResponse.json({ issue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
