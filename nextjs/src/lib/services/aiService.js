import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const apiKey = process.env.ANTHROPIC_API_KEY || '';
const isGroq = apiKey.startsWith('gsk_');
const isAnthropic = apiKey.startsWith('sk-ant');
const client = isAnthropic ? new Anthropic({ apiKey }) : null;

// Application under test. Deliberately NOT defaulted: the prompts used to hardcode
// saucedemo.com, which overrode the actual story — a Facebook login story came back
// with "Navigate to https://www.saucedemo.com/" steps. Set TARGET_APP_URL only when
// every story really does target one fixed app.
const TARGET_APP_URL = process.env.TARGET_APP_URL || '';

/**
 * Resolves the application under test, most specific source first.
 *
 * TARGET_APP_URL used to win outright, which meant a story about one product
 * came back with another product's steps. It is now only a fallback for when
 * nothing else identifies an application — a named product always wins.
 */
const appUnderTest = (storyData = {}, explicitApp = '') => {
  const named = String(explicitApp || '').trim();
  if (named) {
    return `Application under test: ${named}
Use ${named}'s real screens, field labels, button text and realistic test data for it. Do NOT substitute any other website or demo application.`;
  }

  const inline = String(storyData.description || storyData.summary || storyData.title || '').match(
    /https?:\/\/[^\s)"']+/
  );
  if (inline) {
    return `Application under test: ${inline[0]} (taken from the story)
Use its real screens, field labels and realistic test data. Do NOT substitute any other website.`;
  }

  if (TARGET_APP_URL) {
    return `Application under test: determine it from the story below.
If the story names a specific application, product or website (for example a named consumer product or an internal system), that is the application under test — use ITS real screens, field labels and realistic test data.
Only if the story names no application at all, fall back to ${TARGET_APP_URL} as the default environment.
Never substitute ${TARGET_APP_URL}, or its sample credentials, for an application the story actually names.`;
  }

  return `Application under test: the application described in the story below. Reference its real screens, fields and buttons by the names the story uses. Do NOT substitute an unrelated demo site or invent a URL that the story does not mention.`;
};

// Output ceilings differ sharply by provider, and Groq's is the binding one:
// Groq counts the *requested* max_tokens against the account's tokens-per-minute
// budget, so on the free on_demand tier (12k TPM) a request asking for 16k is
// rejected before the model ever runs. Ask for what a call actually needs.
// Override GROQ_TPM_LIMIT if the account is upgraded to a higher tier.
const GROQ_TPM_LIMIT = Number(process.env.GROQ_TPM_LIMIT) || 12000;
// Leave room for the prompt itself, which is also counted.
const GROQ_MAX_OUTPUT = Math.max(1500, Math.floor(GROQ_TPM_LIMIT * 0.55));
// Claude needs streaming above ~16k output, so that is its safe non-streaming cap.
const ANTHROPIC_MAX_OUTPUT = 16000;

const outputBudget = (wanted) =>
  isGroq ? Math.min(wanted, GROQ_MAX_OUTPUT) : Math.min(wanted, ANTHROPIC_MAX_OUTPUT);

// A fully-detailed case in this 12-field schema runs ~200-260 output tokens.
const tokensForBatch = (size) => outputBudget(size * 280 + 900);

// A single call asked for 40 detailed schema-conforming cases either truncates or
// silently shortens the list, so callers request small batches and accumulate.
// The client drives the loop (see lib/testCaseGeneration.ts) because a serverless
// function has a wall-clock limit that a server-side loop would blow through.
export const DEFAULT_BATCH_SIZE = 10;
export const MIN_TARGET_CASES = 12;
export const MAX_TARGET_CASES = 60;

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Groq enforces a tokens-per-minute budget across all requests, so a multi-batch
// run trips it even when each individual call is sized correctly. Honour the
// server's retry-after rather than failing the run.
function retryDelayMs(error, attempt) {
  const header = error.response?.headers?.['retry-after'];
  if (header) return Math.min(65000, (Number(header) || 1) * 1000 + 500);
  const message = error.response?.data?.error?.message || '';
  const parsed = message.match(/try again in ([\d.]+)s/i);
  if (parsed) return Math.min(65000, Math.ceil(parseFloat(parsed[1]) * 1000) + 500);
  return Math.min(30000, 2000 * 2 ** attempt);
}

const isRateLimited = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.error?.message || error.message || '';
  return status === 429 || /rate limit|tokens per minute|TPM|too large/i.test(message);
};

async function callAI(prompt, maxTokens, { retries = 3 } = {}) {
  const budget = outputBudget(maxTokens);

  for (let attempt = 0; ; attempt++) {
    try {
      if (isGroq) {
        const body = {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: budget,
          temperature: 0.8,
        };

        const post = (payload) =>
          axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 120000,
          });

        // JSON mode keeps the response parseable; fall back if it is unavailable,
        // but never swallow a rate-limit error as an unsupported-feature error.
        let response;
        try {
          response = await post({ ...body, response_format: { type: 'json_object' } });
        } catch (err) {
          if (isRateLimited(err)) throw err;
          console.warn(
            'Groq JSON mode unavailable, retrying as free-form:',
            err.response?.data?.error?.message || err.message
          );
          response = await post(body);
        }
        return response.data.choices[0].message.content;
      }

      if (client) {
        const response = await client.messages.create({
          model: 'claude-opus-5',
          max_tokens: budget,
          output_config: { effort: 'medium' },
          messages: [{ role: 'user', content: prompt }],
        });
        // content[0] may be a thinking block, so join the text blocks.
        return response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
      }

      throw new Error('No valid AI Provider configured. Ensure ANTHROPIC_API_KEY is set in Vercel.');
    } catch (error) {
      const errorData = error.response?.data?.error?.message || error.message;

      if (isRateLimited(error) && attempt < retries) {
        const wait = retryDelayMs(error, attempt);
        console.warn(`Rate limited (attempt ${attempt + 1}/${retries + 1}); retrying in ${wait}ms.`);
        await sleep(wait);
        continue;
      }

      console.error('AI Call Error:', errorData);
      throw new Error(errorData);
    }
  }
}

// Pulls a JSON array out of a model response. Handles code fences, a
// `{"test_cases": [...]}` wrapper (JSON mode always returns an object), and
// truncated output — and reports how much it had to discard so a short batch is
// visible in the logs instead of looking like the model's own choice.
function parseCaseArray(content, label = 'batch') {
  let raw = String(content || '').trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const unwrap = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const arrayKey = Object.keys(value).find((k) => Array.isArray(value[k]));
      if (arrayKey) return value[arrayKey];
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

  // Truncated mid-object: keep every complete object and say so.
  if (start !== -1) {
    const lastComplete = raw.lastIndexOf('},');
    if (lastComplete > start) {
      const repaired = unwrap(tryParse(`${raw.slice(start, lastComplete + 1)}]`));
      if (repaired) {
        console.warn(
          `[${label}] response was truncated (likely hit max_tokens); recovered ${repaired.length} complete case(s) and discarded the partial tail.`
        );
        return repaired;
      }
    }
  }

  throw new Error(`Could not parse test cases from the AI response (${label}).`);
}

const normalizeScenario = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Identical prompts produce near-identical output, which is why regenerating a
// story used to return the same list. A per-run token plus an explicit
// vary-your-emphasis instruction breaks that. (Not a caching concern: these are
// one-shot generations, not a cached multi-turn prefix.)
const runToken = () => Math.random().toString(36).slice(2, 10);

const VARIATION_RULE = (token) => `Variation token for this run: ${token}.
This is a fresh generation run. Do not reproduce a canned or boilerplate list: vary which
behaviours you probe, the order you present them in, the concrete test data you choose, and
the wording of scenario titles compared to an obvious first-pass answer. Coverage of the
acceptance criteria is still mandatory — vary the exploration around it, not the requirements.`;

// Reads the Custom Generator form / test plan context in whatever shape the
// caller sent. `generation` is the structured form; `scope` is the older
// free-text string, still accepted so existing callers keep working.
function readOptions(testPlanScope) {
  const scope = testPlanScope || {};
  const gen = scope.generation || {};
  return {
    types: Array.isArray(gen.types) && gen.types.length
      ? gen.types
      : ['Positive', 'Negative', 'Edge Case', 'Boundary'],
    priority: gen.priority || 'All',
    appType: gen.appType || 'Web App',
    context: gen.context || '',
    countLabel: gen.count || '',
    targetApp: gen.targetApp || '',
    planScopeText:
      typeof scope.scope === 'string'
        ? scope.scope
        : [scope.objective, scope.scope, (scope.inclusions || []).join('; ')].filter(Boolean).join(' | '),
  };
}

// How many cases the run should aim for. An explicit range from the form wins;
// otherwise scale with how much the story actually gives us to test.
export function resolveTargetCount(storyData = {}, testPlanScope = {}) {
  const { countLabel } = readOptions(testPlanScope);

  const range = String(countLabel).match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, parseInt(range[2], 10)));
  }
  const single = String(countLabel).match(/^\s*(\d+)\s*$/);
  if (single) {
    return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, parseInt(single[1], 10)));
  }

  const acCount = Array.isArray(storyData.acceptanceCriteria) ? storyData.acceptanceCriteria.length : 0;
  const descLength = String(storyData.description || '').length;
  const derived = 14 + acCount * 4 + Math.floor(descLength / 500) * 3;
  return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, derived));
}

function buildStoryContext(storyData = {}) {
  const parts = [];
  if (storyData.key) parts.push(`Story Key: ${storyData.key}`);
  parts.push(`Title / Summary: ${storyData.summary || storyData.title || 'Feature'}`);
  if (storyData.description) {
    // The description is the richest signal Jira gives us — truncate rather than drop.
    parts.push(`Description:\n${String(storyData.description).slice(0, 6000)}`);
  }
  const ac = Array.isArray(storyData.acceptanceCriteria) ? storyData.acceptanceCriteria : [];
  if (ac.length) {
    parts.push(`Acceptance Criteria:\n${ac.map((c, i) => `${i + 1}. ${c}`).join('\n')}`);
  }
  if (storyData.priority) parts.push(`Story Priority: ${storyData.priority}`);
  return parts.join('\n\n');
}

class AIService {
  async generateTestPlan(storyData) {
    const storyTitle = storyData.summary || storyData.title || 'Feature';
    const storyKey = storyData.key || storyData.id || 'STORY';
    const today = new Date().toISOString().split('T')[0];

    // Mock plan (no API key) — all 14 template sections
    if (!apiKey || apiKey === 'your_claude_api_key_here') {
      console.warn('Anthropic/Groq not configured — returning template-structured mock test plan');
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

    const schema = `{
  "storyKey": "string",
  "storyTitle": "string",
  "project_name": "string",
  "version": "string",
  "prepared_by": "QA Team",
  "date": "YYYY-MM-DD",
  "objective": "string (2-4 sentences)",
  "scope": "string (2-4 sentences describing what is being tested)",
  "inclusions": ["string"],
  "exclusions": ["string"],
  "test_environments": [{"name":"string","browser":"string","os":"string","device":"string","url":"string"}],
  "defect_reporting_procedure": "string",
  "test_strategy": "string (4-6 sentences describing testing approach)",
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

    const prompt = `You are a senior QA lead. Produce a professional, detailed test plan as JSON.
Return valid JSON only — no markdown, no commentary.

${appUnderTest(storyData)}
Today's date: ${today}

Jira story:
${buildStoryContext(storyData)}

Use this exact JSON schema:
${schema}

Depth requirements — a thin plan is not acceptable:
- Every list section (inclusions, exclusions, test_deliverables, all four criteria pairs) must contain at least 5 specific, story-derived items. Generic filler such as "testing is complete" does not count.
- test_environments: at least 4 rows spanning desktop and mobile.
- test_schedule: at least 6 phases with realistic sequential dates starting from today.
- risks_and_mitigations: at least 5 risks specific to this story, each with a concrete mitigation.
- tools: at least 4 tools with a stated purpose.
- Derive every field from the story above. Do not invent requirements the story does not imply.

${VARIATION_RULE(runToken())}

Return ONLY valid JSON.`;

    try {
      const content = await callAI(prompt, outputBudget(6000));
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
      console.error('Error generating test plan:', error);
      throw new Error('Failed to generate test plan: ' + (error.message || error));
    }
  }

  /**
   * Generates one batch of test cases.
   *
   * @param storyData      Jira story or Custom Generator input.
   * @param testPlanScope  Test plan context and/or `generation` form options.
   * @param batch          { size, index, exclude[] } — `exclude` holds scenario
   *                       titles already produced so this batch adds new ground
   *                       instead of repeating. Omit for a single default batch.
   */
  async generateTestCases(storyData = {}, testPlanScope = {}, batch = {}) {
    const opts = readOptions(testPlanScope);
    const size = Math.min(25, Math.max(1, Number(batch.size) || DEFAULT_BATCH_SIZE));
    const batchIndex = Number(batch.index) || 0;
    const exclude = Array.isArray(batch.exclude) ? batch.exclude : [];
    const isCustom = String(storyData.title || '').includes('[Custom]');
    const moduleName = isCustom
      ? String(storyData.title).replace('[Custom] Module: ', '')
      : storyData.summary || storyData.title || 'the feature under test';

    // No cloud key: local Ollama first (if the operator is running one), then mock.
    // This used to run on every custom request and cost a 2-minute timeout even
    // when a cloud key was configured.
    if (!apiKey || apiKey === 'your_claude_api_key_here') {
      const ollamaCases = await this.tryOllama(storyData, testPlanScope, size, exclude);
      if (ollamaCases) return ollamaCases;
      console.warn('No AI provider configured — returning mock test cases');
      return this.mockCases(storyData, opts, size, batchIndex, isCustom, moduleName);
    }

    const avoid = exclude.length
      ? `\nScenarios already covered — do NOT repeat these, and do not produce near-duplicates of them:\n${exclude
          .slice(-60)
          .map((s) => `- ${s}`)
          .join('\n')}\n`
      : '';

    const prompt = `You are an expert QA engineer. Generate exactly ${size} NEW test cases as a JSON array.
Return ONLY a JSON array of ${size} objects, in the form {"test_cases": [ ... ]} or a bare array. No markdown, no commentary.

Object schema (every field required):
${CASE_SCHEMA}

${appUnderTest(storyData, opts.targetApp)}
Application type: ${opts.appType}
Feature / module: ${moduleName}

${buildStoryContext(storyData)}
${opts.planScopeText ? `\nTest plan scope / constraints:\n${opts.planScopeText}\n` : ''}${opts.context ? `\nAdditional context from the QA engineer:\n${opts.context}\n` : ''}
Coverage to draw from: ${opts.types.join(', ')}.
Priority focus: ${opts.priority}.
${avoid}
Rules:
1. Test steps must be concrete, chronological, actionable QA steps naming the real UI elements and test data of the application described above — e.g. "1. Open the login page", "2. Enter 'user@example.com' in the Email field", "3. Click the Log In button". Never write vague steps like "perform the action" or "verify the state".
2. Expected results must be crisp and specific — e.g. "User is redirected to the inventory page and the cart icon is visible", or the exact error text the application shows. No fluffy language.
3. Stay strictly within what the story, acceptance criteria and description above imply. Do not invent unrelated features.
4. Every scenario title must be meaningfully distinct — a different behaviour being verified, not a renumbered restatement of the same check.
5. Spread the batch across the requested coverage types rather than producing ${size} happy-path variants.
6. Return a COMPLETE, VALID JSON array of exactly ${size} objects. Do not truncate.

${VARIATION_RULE(batch.seed || runToken())}`;

    try {
      const content = await callAI(prompt, tokensForBatch(size));
      const cases = parseCaseArray(content, `test-cases batch ${batchIndex + 1}`);
      return cases.filter((c) => c && (c.scenario || c.testcase_description));
    } catch (error) {
      console.error('Error generating test cases:', error);
      throw new Error('Failed to generate test cases: ' + (error.message || error));
    }
  }

  // Local fallback for offline use. Only reached when no cloud key is set.
  async tryOllama(storyData, testPlanScope, size, exclude) {
    const model = process.env.OLLAMA_MODEL;
    if (!model) return null;
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const opts = readOptions(testPlanScope);
    const prompt = `You are an expert QA engineer. Generate exactly ${size} test cases as a valid JSON array matching this schema:
${CASE_SCHEMA}

${buildStoryContext(storyData)}
Coverage: ${opts.types.join(', ')}.
${exclude.length ? `Do not repeat these scenarios:\n${exclude.slice(-40).map((s) => `- ${s}`).join('\n')}` : ''}
Return ONLY the JSON array.`;

    try {
      console.log(`Querying local Ollama model "${model}" at ${baseUrl}...`);
      const response = await axios.post(
        `${baseUrl}/api/generate`,
        { model, prompt, stream: false },
        { timeout: 120000 }
      );
      return parseCaseArray(response.data.response || '', 'ollama');
    } catch (err) {
      console.error('Local Ollama generation failed:', err.message);
      return null;
    }
  }

  // Deterministic stand-in so the UI is usable without credentials. Honours the
  // requested batch size instead of always emitting 25.
  mockCases(storyData, opts, size, batchIndex, isCustom, moduleName) {
    const scenarioTarget = storyData.summary || storyData.title || 'the core feature';
    const types = opts.types.length ? opts.types : ['Positive', 'Negative', 'Edge Case', 'Boundary', 'UI/UX'];
    const cases = [];

    for (let i = 0; i < size; i++) {
      const n = batchIndex * size + i + 1;
      const type = types[n % types.length];
      const priority = n % 5 === 0 ? 'Critical' : n % 3 === 0 ? 'High' : 'Medium';

      cases.push({
        scenario: `${type}: ${moduleName} — check ${n}`,
        tid: `${isCustom ? 'TC_CUS_' : 'TC_'}${String(n).padStart(3, '0')}`,
        testcase_description: `Validate ${moduleName} for ${scenarioTarget} under a ${type} condition.`,
        precondition: `Environment configured for ${moduleName}. Test user access verified.`,
        test_steps: [
          `1. Open ${TARGET_APP_URL || 'the application under test'}`,
          `2. Open ${moduleName}`,
          `3. Execute the ${type} validation for check ${n}`,
        ],
        expected_result:
          type === 'Negative'
            ? 'The application rejects the invalid input with a specific error message.'
            : `${moduleName} behaves as specified for the ${type} flow.`,
        actual_result: '',
        status: 'Not Executed',
        executed_qa_name: '',
        misc_comments: 'Mock data — no AI provider configured',
        priority,
        is_automated: n % 2 === 0 ? 'Yes' : 'No',
      });
    }
    return cases;
  }

  async generateAutomationCode(testCase, framework, options) {
    let prompt = '';

    if (options.featureFileBDD) {
      prompt = `${TARGET_APP_URL ? `The target application is "${TARGET_APP_URL}". ` : ''}Generate a standard Cucumber BDD Feature File for the following test case.
Format as a proper .feature file using Given/When/Then syntax, followed by the step definition code in ${framework}.
Include: ${options.pageObjectModel ? 'Page Object Model implementation mapping to the steps,' : ''}
${options.addAssertions ? 'assertions in the Then steps,' : ''}
and ${options.addComments ? 'descriptive comments' : 'clean code'}.
Test Case: ${JSON.stringify(testCase)}
Derive locators from the test case steps and the application they describe, but strictly adhere to the provided Test Case logic. Return only the code (Feature file content followed by step definition implementation), no markdown blocks of explanation.`;
    } else if (framework === 'selenium-java') {
      prompt = `${TARGET_APP_URL ? `The target application is "${TARGET_APP_URL}". ` : ''}Generate production-ready Selenium WebDriver code in Java using
TestNG and${options.pageObjectModel ? ' Page Object Model' : ''} for the following test case.
Include: imports, ${options.pageObjectModel ? 'page class,' : ''} test class,
${options.addAssertions ? 'assertions,' : ''} explicit waits,
and ${options.addComments ? 'meaningful comments' : 'clean code'}.
Test Case: ${JSON.stringify(testCase)}
Derive locators from the test case steps and the application they describe. Return only the Java code, no explanation.`;
    } else {
      const label =
        framework === 'cypress-js' ? 'Cypress' : framework === 'protractor-js' ? 'Protractor' : 'Playwright';
      prompt = `${TARGET_APP_URL ? `The target application is "${TARGET_APP_URL}". ` : ''}Generate production-ready ${label} test code in JavaScript/TypeScript
using ${options.pageObjectModel ? 'Page Object Model pattern ' : ''}for the following test case.
Include: imports, fixtures/hooks, locators, ${options.addAssertions ? 'assertions,' : ''}
async/await pattern, and ${options.addComments ? 'descriptive test blocks' : 'clean code'}.
Test Case: ${JSON.stringify(testCase)}
Derive locators from the test case steps and the application they describe. Return only the code, no explanation.`;
    }

    try {
      return await callAI(prompt, 6000);
    } catch (error) {
      console.error('Error generating automation code:', error);
      throw new Error('Failed to generate automation code: ' + error.message);
    }
  }
}

const aiService = new AIService();
export default aiService;
