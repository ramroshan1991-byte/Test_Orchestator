/**
 * Client-side batching for test case generation.
 *
 * A single AI call asked for 30-40 schema-conforming test cases either truncates
 * or quietly shortens the list, and a server-side loop would exceed the
 * serverless wall-clock limit. So the browser drives the loop: it requests small
 * batches, tells each call which scenarios already exist, dedupes, and reports
 * progress — which is how a run reaches 40 cases without any one request being
 * at risk.
 */

export const DEFAULT_BATCH_SIZE = 10;
export const MIN_TARGET_CASES = 12;
export const MAX_TARGET_CASES = 60;

export interface GenerationOptions {
  count?: string;
  types?: string[];
  priority?: string;
  appType?: string;
  context?: string;
}

export interface GenerationProgress {
  collected: number;
  target: number;
  batch: number;
  totalBatches: number;
}

export interface GenerationResult {
  testCases: any[];
  target: number;
  batches: number;
  /** Set when the run stopped before reaching the target, with the reason. */
  shortfall?: string;
}

/** Mirrors resolveTargetCount in lib/services/aiService.js. */
export function resolveTargetCount(storyData: any = {}, generation: GenerationOptions = {}): number {
  const label = String(generation.count || '');

  const range = label.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, parseInt(range[2], 10)));
  }
  const single = label.match(/^\s*(\d+)\s*$/);
  if (single) {
    return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, parseInt(single[1], 10)));
  }

  // "Auto": scale with how much the story actually gives us to test.
  const acCount = Array.isArray(storyData?.acceptanceCriteria) ? storyData.acceptanceCriteria.length : 0;
  const descLength = String(storyData?.description || '').length;
  const derived = 14 + acCount * 4 + Math.floor(descLength / 500) * 3;
  return Math.min(MAX_TARGET_CASES, Math.max(MIN_TARGET_CASES, derived));
}

const normalize = (text: string) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Generates test cases in batches until the target is met.
 *
 * Stops early if two consecutive batches add nothing new (the model has run out
 * of distinct scenarios) rather than burning calls on duplicates.
 */
export async function generateTestCasesBatched(
  storyData: any,
  testPlanScope: any,
  generation: GenerationOptions,
  onProgress?: (p: GenerationProgress) => void
): Promise<GenerationResult> {
  const target = resolveTargetCount(storyData, generation);
  const totalBatches = Math.ceil(target / DEFAULT_BATCH_SIZE);
  const maxBatches = totalBatches + 2; // headroom for short/duplicate batches

  const collected: any[] = [];
  const seen = new Set<string>();
  let emptyRounds = 0;
  let batch = 0;
  let shortfall: string | undefined;

  while (collected.length < target && batch < maxBatches) {
    onProgress?.({ collected: collected.length, target, batch: batch + 1, totalBatches });

    const size = Math.min(DEFAULT_BATCH_SIZE, target - collected.length);

    let payload: any;
    try {
      const response = await fetch('/api/test-cases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyData,
          testPlanScope: { ...(testPlanScope || {}), generation },
          batch: {
            size,
            index: batch,
            exclude: collected.map((c) => c.scenario || c.name).filter(Boolean),
          },
        }),
      });

      payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
    } catch (error) {
      // Keep whatever we already have rather than losing the whole run.
      if (collected.length === 0) throw error;
      shortfall = `Stopped after ${collected.length} of ${target} cases: ${
        error instanceof Error ? error.message : 'request failed'
      }`;
      break;
    }

    const returned: any[] = Array.isArray(payload?.testCases) ? payload.testCases : [];
    const before = collected.length;

    for (const tc of returned) {
      const key = normalize(tc?.scenario || tc?.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      collected.push(tc);
      if (collected.length >= target) break;
    }

    emptyRounds = collected.length === before ? emptyRounds + 1 : 0;
    batch += 1;

    if (emptyRounds >= 2) {
      shortfall = `The model ran out of distinct scenarios at ${collected.length} of ${target} cases.`;
      break;
    }
  }

  if (!shortfall && collected.length < target) {
    shortfall = `Reached ${collected.length} of ${target} cases within the batch limit.`;
  }

  // Renumber so IDs are sequential across batches instead of restarting each time.
  const prefix = String(storyData?.title || '').includes('[Custom]') ? 'TC_CUS_' : 'TC_';
  const testCases = collected.map((tc, i) => ({
    ...tc,
    tid: `${prefix}${String(i + 1).padStart(3, '0')}`,
  }));

  onProgress?.({ collected: testCases.length, target, batch, totalBatches });

  return { testCases, target, batches: batch, shortfall };
}
