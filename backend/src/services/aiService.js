import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-opus-5';

// Application under test. Deliberately NOT defaulted to a demo site: hardcoding one
// overrides the actual story, which is how every story ended up with the same steps.
const TARGET_APP_URL = process.env.TARGET_APP_URL || '';

// Tells the model where the app lives, or to take it from the story if we don't know.
const appUnderTest = (storyData = {}) => {
  if (TARGET_APP_URL) return `Application under test: ${TARGET_APP_URL}`;
  const inline = String(storyData.description || storyData.summary || '').match(/https?:\/\/[^\s)"']+/);
  if (inline) return `Application under test: ${inline[0]} (taken from the story)`;
  return `Application under test: the application described in the story below. Reference its real screens, fields and buttons by the names the story uses. Do NOT substitute an unrelated demo site or invent a URL that the story does not mention.`;
};

// Claude needs streaming above ~16k output tokens, so 16k is the safe
// non-streaming ceiling. Test cases are generated in batches under it.
const MAX_OUTPUT_TOKENS = 16000;
const BATCH_SIZE = 10;
const MIN_TARGET_CASES = 12;
const MAX_TARGET_CASES = 60;

const CASE_SCHEMA = `[
  {
    "scenario": "string — a distinct, specific test scenario title",
    "tid": "string (e.g. TC_001)",
    "testcase_description": "string",
    "precondition": "string",
    "test_steps": ["string (step 1)", "string (step 2)"],
    "expected_result": "string",
    "actual_result": "",
    "status": "Not Executed",
    "executed_qa_name": "",
    "misc_comments": "",
    "priority": "Critical|High|Medium|Low",
    "is_automated": "Yes|No"
  }
]`;

const hasKey = () =>
  process.env.ANTHROPIC_API_KEY &&
  process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here' &&
  client?.messages?.create;

const normalizeScenario = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Identical prompts produce near-identical output, which is why regenerating a
// story used to return the same list. A per-run token plus an explicit
// vary-your-emphasis instruction breaks that.
const runToken = () => Math.random().toString(36).slice(2, 10);

const VARIATION_RULE = (token) => `Variation token for this run: ${token}.
This is a fresh generation run. Do not reproduce a canned or boilerplate list: vary which
behaviours you probe, the order you present them in, the concrete test data you choose, and
the wording of scenario titles compared to an obvious first-pass answer. Coverage of the
acceptance criteria is still mandatory — vary the exploration around it, not the requirements.`;

// How many cases to aim for: an explicit range from the caller wins, otherwise
// scale with how much the story actually gives us to test.
function resolveTargetCount(storyData = {}, testPlanScope = {}) {
  const label = String(testPlanScope?.generation?.count || testPlanScope?.count || '');
  const range = label.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, parseInt(range[2], 10)));
  const single = label.match(/^\s*(\d+)\s*$/);
  if (single) return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, parseInt(single[1], 10)));

  const acCount = Array.isArray(storyData.acceptanceCriteria) ? storyData.acceptanceCriteria.length : 0;
  const descLength = String(storyData.description || '').length;
  const derived = 14 + acCount * 4 + Math.floor(descLength / 500) * 3;
  return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, derived));
}

// The story description is the richest signal Jira gives us; it used to be dropped.
function buildStoryContext(storyData = {}) {
  const parts = [];
  if (storyData.key) parts.push(`Story Key: ${storyData.key}`);
  parts.push(`Title / Summary: ${storyData.summary || storyData.title || 'Feature'}`);
  if (storyData.description) parts.push(`Description:\n${String(storyData.description).slice(0, 6000)}`);
  const ac = Array.isArray(storyData.acceptanceCriteria) ? storyData.acceptanceCriteria : [];
  if (ac.length) parts.push(`Acceptance Criteria:\n${ac.map((c, i) => `${i + 1}. ${c}`).join('\n')}`);
  if (storyData.priority) parts.push(`Story Priority: ${storyData.priority}`);
  return parts.join('\n\n');
}

// Extracts a JSON array, tolerating code fences, an object wrapper, and
// truncation — and logging what it had to discard.
function parseCaseArray(content, label = 'batch') {
  let raw = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const tryParse = (t) => { try { return JSON.parse(t); } catch { return null; } };
  const unwrap = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') {
      const k = Object.keys(v).find((key) => Array.isArray(v[key]));
      if (k) return v[k];
    }
    return null;
  };

  const whole = unwrap(tryParse(raw));
  if (whole) return whole;

  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start !== -1 && end > start) {
    const sliced = unwrap(tryParse(raw.slice(start, end + 1)));
    if (sliced) return sliced;
  }
  if (start !== -1) {
    const lastComplete = raw.lastIndexOf('},');
    if (lastComplete > start) {
      const repaired = unwrap(tryParse(`${raw.slice(start, lastComplete + 1)}]`));
      if (repaired) {
        console.warn(`[${label}] response truncated; recovered ${repaired.length} complete case(s).`);
        return repaired;
      }
    }
  }
  throw new Error(`Could not parse test cases from the AI response (${label}).`);
}

class AIService {
  async generateTestPlan(storyData) {
    const storyTitle = storyData.summary || storyData.title || 'Feature';
    const storyKey  = storyData.key  || storyData.id  || 'STORY';
    const today = new Date().toISOString().split('T')[0];

    // Mock plan (no API key) — all 14 template sections
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_claude_api_key_here' || !client?.messages?.create) {
      console.warn('Anthropic not configured — returning template-structured mock test plan');
      return {
        storyKey,
        storyTitle,
        project_name: storyKey.split('-')[0] || 'Project',
        version: '1.0',
        prepared_by: 'QA Team',
        date: today,
        objective: `Validate that "${storyTitle}" meets all functional, UI, and non-functional requirements as defined in the acceptance criteria.`,
        scope: `This test plan covers functional testing, UI validation, and regression testing for ${storyTitle}.`,
        inclusions: [
          'Happy path / positive flow testing',
          'Acceptance criteria validation',
          'UI & UX validation',
          'Negative / boundary condition testing',
          'Cross-browser compatibility (Chrome, Firefox, Edge)',
        ],
        exclusions: [
          'Load/performance/stress testing',
          'Third-party service internals',
          'Backend infrastructure testing',
        ],
        test_environments: [
          { name: 'Chrome Desktop', browser: 'Chrome 120+', os: 'Windows 11 / macOS', device: 'Desktop', url: 'https://staging.example.com' },
          { name: 'Firefox Desktop', browser: 'Firefox 121+', os: 'Windows 11', device: 'Desktop', url: 'https://staging.example.com' },
          { name: 'Mobile Safari', browser: 'Safari 17+', os: 'iOS 17', device: 'iPhone 15', url: 'https://staging.example.com' },
        ],
        defect_reporting_procedure: 'Defects found during testing will be logged in Jira with severity, steps to reproduce, environment, screenshots and expected vs actual results. Critical defects block release; High defects require fix before sign-off.',
        test_strategy: 'Adopt a risk-based testing approach: functional testing to verify acceptance criteria, regression testing to confirm no regressions, and exploratory testing for edge cases. Automation-first for the regression suite using Playwright.',
        test_schedule: [
          { phase: 'Test Planning & Design', start: today, end: today, owner: 'QA Lead' },
          { phase: 'Test Case Review',       start: today, end: today, owner: 'QA Team' },
          { phase: 'Test Execution',         start: today, end: today, owner: 'QA Engineers' },
          { phase: 'Defect Retesting',       start: today, end: today, owner: 'QA Engineers' },
          { phase: 'Sign-off',               start: today, end: today, owner: 'QA Lead' },
        ],
        test_deliverables: [
          'Test Plan (this document)',
          'Test Cases (in Test Orchestrator)',
          'Test Execution Report',
          'Defect Report',
          'Test Closure Report',
        ],
        entry_criteria: [
          'Feature implementation is complete and deployed to the test environment',
          'Acceptance criteria are clearly documented in the Jira story',
          'Test environment is accessible and stable',
          'Test data is prepared and available',
        ],
        exit_criteria: [
          'All planned test cases have been executed',
          'All critical and high severity defects are resolved and retested',
          'Test coverage ≥ 95% of acceptance criteria',
          'Sign-off received from stakeholders',
        ],
        execution_entry_criteria: [
          'Test cases reviewed and approved',
          'Build deployed to staging environment',
          'Smoke test passed',
        ],
        execution_exit_criteria: [
          'Test execution complete for all priority test cases',
          'Defect report submitted',
          'No open P1 defects',
        ],
        closure_entry_criteria: [
          'All test cases executed',
          'All critical defects fixed and verified',
          'Test summary report prepared',
        ],
        closure_exit_criteria: [
          'Stakeholder sign-off obtained',
          'All test artifacts archived',
          'Lessons learned documented',
        ],
        tools: [
          { name: 'Test Orchestrator', purpose: 'Test plan & test case management' },
          { name: 'Jira', purpose: 'Defect tracking & story management' },
          { name: 'Playwright / Selenium', purpose: 'Test automation' },
          { name: 'BrowserStack', purpose: 'Cross-browser testing' },
        ],
        risks_and_mitigations: [
          { risk: 'Unstable test environment', impact: 'High', mitigation: 'Maintain dedicated staging environment with daily smoke tests' },
          { risk: 'Incomplete acceptance criteria', impact: 'Medium', mitigation: 'Review AC with PO before test design' },
          { risk: 'Late code delivery', impact: 'High', mitigation: 'Parallelize test design with development' },
        ],
        approvals: [
          { role: 'QA Lead', name: '', signature: '', date: '' },
          { role: 'Product Owner', name: '', signature: '', date: '' },
          { role: 'Engineering Lead', name: '', signature: '', date: '' },
        ],
      };
    }

    const systemMsg = `You are a senior QA lead. Generate a professional, detailed test plan JSON strictly following the given schema. Return valid JSON only — no markdown, no explanation.`;

    const schema = `{
  "storyKey": "string",
  "storyTitle": "string",
  "project_name": "string",
  "version": "string",
  "prepared_by": "QA Team",
  "date": "YYYY-MM-DD",
  "objective": "string (2-4 sentences)",
  "scope": "string (1-2 sentences describing what is being tested)",
  "inclusions": ["string"],
  "exclusions": ["string"],
  "test_environments": [{"name":"string","browser":"string","os":"string","device":"string","url":"string"}],
  "defect_reporting_procedure": "string",
  "test_strategy": "string (3-5 sentences describing testing approach)",
  "test_schedule": [{"phase":"string","start":"YYYY-MM-DD","end":"YYYY-MM-DD","owner":"string"}],
  "test_deliverables": ["string"],
  "entry_criteria": ["string"],
  "exit_criteria": ["string"],
  "execution_entry_criteria": ["string"],
  "execution_exit_criteria": ["string"],
  "closure_entry_criteria": ["string"],
  "closure_exit_criteria": ["string"],
  "tools": [{"name":"string","purpose":"string"}],
  "risks_and_mitigations": [{"risk":"string","impact":"High|Medium|Low","mitigation":"string"}],
  "approvals": [{"role":"string","name":"","signature":"","date":""}]
}`;

    const userMsg = `Generate a complete test plan for this Jira story.
${appUnderTest(storyData)}

${buildStoryContext(storyData)}

Today's date: ${today}

Use this exact JSON schema:
${schema}

Depth requirements — a thin plan is not acceptable:
- Every list section (inclusions, exclusions, test_deliverables, all four criteria pairs) must contain at least 5 specific, story-derived items.
- test_environments: at least 4 rows spanning desktop and mobile.
- test_schedule: at least 6 phases with realistic sequential dates starting from today.
- risks_and_mitigations: at least 5 story-specific risks, each with a concrete mitigation.
- tools: at least 4 tools with a stated purpose.
Derive every field from the story above.

${VARIATION_RULE(runToken())}

Return ONLY valid JSON.`;

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        output_config: { effort: 'medium' },
        messages: [
          { role: 'user', content: `${systemMsg}\n\n${userMsg}` },
        ],
      });

      // Join text blocks — content[0] may be a thinking block, not text.
      const content = (response?.content || [])
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const raw = jsonMatch ? jsonMatch[0] : content;
      return JSON.parse(raw);
    } catch (error) {
      console.error('Error generating test plan:', error);
      throw new Error('Failed to generate test plan: ' + (error.message || error));
    }
  }

  /**
   * Generates test cases, batching AI calls until the target count is reached.
   * A single call asked for 30-40 schema-conforming cases truncates or quietly
   * shortens the list, which is why the old 20-25 instruction never delivered.
   */
  async generateTestCases(storyData = {}, testPlanScope = {}) {
    const isCustom = Boolean(storyData.title && String(storyData.title).includes('[Custom]'));
    const target = resolveTargetCount(storyData, testPlanScope);
    const moduleName = isCustom
      ? String(storyData.title).replace('[Custom] Module: ', '')
      : storyData.summary || storyData.title || 'the feature under test';

    if (!hasKey()) {
      console.warn(`Anthropic not configured - generating ${target} mock cases`);
      return this.mockCases(storyData, target, isCustom, moduleName);
    }

    const scopeText =
      typeof testPlanScope?.scope === 'string'
        ? testPlanScope.scope
        : [testPlanScope?.objective, testPlanScope?.scope, (testPlanScope?.inclusions || []).join('; ')]
            .filter(Boolean)
            .join(' | ');

    const collected = [];
    const seen = new Set();
    const maxBatches = Math.ceil(target / BATCH_SIZE) + 2;
    let emptyRounds = 0;

    for (let batch = 0; batch < maxBatches && collected.length < target; batch++) {
      const size = Math.min(BATCH_SIZE, target - collected.length);
      const exclude = collected.map((c) => c.scenario).filter(Boolean).slice(-60);

      const prompt = `You are an expert QA engineer. Generate exactly ${size} NEW test cases as a JSON array.
Return ONLY a JSON array of ${size} objects. No markdown, no commentary.

Object schema (every field required):
${CASE_SCHEMA}
\n${appUnderTest(storyData)}
Feature / module: ${moduleName}

${buildStoryContext(storyData)}
${scopeText ? `\nTest plan scope / constraints:\n${scopeText}\n` : ''}${
        exclude.length
          ? `\nScenarios already covered — do NOT repeat these or produce near-duplicates:\n${exclude
              .map((s) => `- ${s}`)
              .join('\n')}\n`
          : ''
      }
Rules:
1. Test steps must be concrete, chronological, actionable QA steps naming real UI elements and data. Never write vague steps like "perform the action".
2. Expected results must be crisp and specific, including exact error text where the application shows one.
3. Stay strictly within what the story, description and acceptance criteria above imply.
4. Every scenario title must verify a genuinely different behaviour — not a renumbered restatement.
5. Spread the batch across positive, negative, edge, boundary and security angles rather than ${size} happy-path variants.
6. Return a COMPLETE, VALID JSON array of exactly ${size} objects. Do not truncate.

${VARIATION_RULE(runToken())}`;

      let batchCases = [];
      try {
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          output_config: { effort: 'medium' },
          messages: [{ role: 'user', content: prompt }],
        });
        const content = (response?.content || [])
          .map((b) => (b.type === 'text' ? b.text : ''))
          .join('');
        batchCases = parseCaseArray(content, `test-cases batch ${batch + 1}`);
      } catch (error) {
        console.error(`Batch ${batch + 1} failed:`, error.message);
        if (collected.length === 0) {
          throw new Error('Failed to generate test cases: ' + (error.message || error));
        }
        break; // keep what we have rather than losing the whole run
      }

      const before = collected.length;
      for (const tc of batchCases) {
        const key = normalizeScenario(tc?.scenario);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        collected.push(tc);
        if (collected.length >= target) break;
      }

      emptyRounds = collected.length === before ? emptyRounds + 1 : 0;
      if (emptyRounds >= 2) {
        console.warn(`Stopping at ${collected.length}/${target} cases — no new scenarios in 2 batches.`);
        break;
      }
    }

    if (collected.length < target) {
      console.warn(`Returned ${collected.length} of ${target} requested test cases.`);
    }

    // Sequential IDs across batches instead of each batch restarting at TC_001.
    const prefix = isCustom ? 'TC_CUS_' : 'TC_';
    return collected.map((tc, i) => ({ ...tc, tid: `${prefix}${String(i + 1).padStart(3, '0')}` }));
  }

  // Deterministic stand-in so the UI works without credentials. Honours the
  // resolved target instead of always emitting 25.
  mockCases(storyData, target, isCustom, moduleName) {
    const scenarioTarget = storyData.summary || storyData.title || 'the core feature';
    const types = ['Positive', 'Negative', 'Edge Case', 'Boundary', 'UI/UX', 'Security'];
    const cases = [];

    for (let i = 1; i <= target; i++) {
      const type = types[i % types.length];
      cases.push({
        scenario: `${type}: ${moduleName} — check ${i}`,
        tid: `${isCustom ? 'TC_CUS_' : 'TC_'}${String(i).padStart(3, '0')}`,
        testcase_description: `Validate ${moduleName} for ${scenarioTarget} under a ${type} condition.`,
        precondition: 'System is in a stable state and the test user has access.',
        test_steps: [`1. Open ${moduleName}`, `2. Execute the ${type} flow`, `3. Verify the outcome`],
        expected_result:
          type === 'Negative'
            ? 'The application rejects the invalid input with a specific error message.'
            : `${moduleName} behaves as specified for the ${type} flow.`,
        actual_result: '',
        status: 'Not Executed',
        executed_qa_name: '',
        misc_comments: 'Mock data generated due to missing AI credentials',
        priority: i % 5 === 0 ? 'Critical' : i % 3 === 0 ? 'High' : 'Medium',
        is_automated: i % 2 === 0 ? 'Yes' : 'No',
      });
    }
    return cases;
  }

  async generateAutomationCode(testCase, framework, options) {
    let prompt = '';

    if (framework === 'selenium-java') {
      prompt = `Generate production-ready Selenium WebDriver code in Java using 
TestNG and${options.pageObjectModel ? ' Page Object Model' : ''} for the following test case.
Include: imports, ${options.pageObjectModel ? 'page class,' : ''} test class, 
${options.addAssertions ? 'assertions,' : ''} explicit waits,
and ${options.addComments ? 'meaningful comments' : 'clean code'}.
Test Case: ${JSON.stringify(testCase)}
Return only the Java code, no explanation.`;
    } else if (framework === 'playwright-js') {
      prompt = `Generate production-ready Playwright test code in JavaScript/TypeScript
for the following test case.
Include: imports, page fixtures, locators, ${options.addAssertions ? 'assertions,' : ''}
async/await pattern, and ${options.addComments ? 'descriptive test blocks' : 'clean code'}.
Test Case: ${JSON.stringify(testCase)}
Return only the code, no explanation.`;
    }

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 6000,
        output_config: { effort: 'medium' },
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Join text blocks — content[0] may be a thinking block, not text.
      return (response?.content || []).map((b) => (b.type === 'text' ? b.text : '')).join('');
    } catch (error) {
      console.error('Error generating automation code:', error);
      throw new Error('Failed to generate automation code: ' + error.message);
    }
  }
}

export default new AIService();
