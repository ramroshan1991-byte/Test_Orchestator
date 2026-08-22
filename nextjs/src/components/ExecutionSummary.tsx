'use client';

import React from 'react';
import { CheckCircle2, XCircle, Ban, Loader2, Circle } from 'lucide-react';
import { normalizeStatus, type TestStatus } from './StatusBadge';

export interface ExecutionCounts {
  total: number;
  Passed: number;
  Failed: number;
  Blocked: number;
  'In Progress': number;
  'Not Executed': number;
  executed: number;
  passRate: number;
  progress: number;
}

export function countExecution(cases: any[]): ExecutionCounts {
  const counts: any = { Passed: 0, Failed: 0, Blocked: 0, 'In Progress': 0, 'Not Executed': 0 };
  for (const tc of cases) counts[normalizeStatus(tc?.status) as TestStatus]++;

  const total = cases.length;
  // "Executed" means a verdict was recorded — in-progress is not a verdict.
  const executed = counts.Passed + counts.Failed + counts.Blocked;
  return {
    ...counts,
    total,
    executed,
    passRate: executed ? Math.round((counts.Passed / executed) * 100) : 0,
    progress: total ? Math.round((executed / total) * 100) : 0,
  };
}

// Each tile pairs its colour with an icon and a text label, so status is never
// carried by colour alone.
const TILES: { key: keyof ExecutionCounts; label: string; cls: string; Icon: typeof CheckCircle2 }[] = [
  { key: 'Passed', label: 'Passed', cls: 'status-pass', Icon: CheckCircle2 },
  { key: 'Failed', label: 'Failed', cls: 'status-fail', Icon: XCircle },
  { key: 'Blocked', label: 'Blocked', cls: 'status-block', Icon: Ban },
  { key: 'In Progress', label: 'In Progress', cls: 'status-run', Icon: Loader2 },
  { key: 'Not Executed', label: 'Not Executed', cls: 'status-idle', Icon: Circle },
];

/**
 * Execution readout. The app generated cases but never showed whether any had
 * been run — a QA tool's headline number is the verdict split, not the case count.
 */
export function ExecutionSummary({ cases, compact = false }: { cases: any[]; compact?: boolean }) {
  const c = countExecution(cases);
  if (!c.total) return null;

  return (
    <section className="card p-4 sm:p-5" aria-label="Execution summary">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Execution Summary</h2>
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-200 tabular-nums">{c.executed}</span> of{' '}
          <span className="tabular-nums">{c.total}</span> executed
          {c.executed > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-slate-200 tabular-nums">{c.passRate}%</span> pass rate
            </>
          )}
        </p>
      </div>

      {/* Progress meter: one stacked bar, 2px surface gaps between segments. */}
      <div
        className="flex h-2.5 w-full gap-0.5 rounded-full overflow-hidden bg-slate-700 mb-4"
        role="img"
        aria-label={`${c.Passed} passed, ${c.Failed} failed, ${c.Blocked} blocked, ${c['In Progress']} in progress, ${c['Not Executed']} not executed`}
      >
        {[
          { n: c.Passed, v: 'var(--st-pass-fg)' },
          { n: c.Failed, v: 'var(--st-fail-fg)' },
          { n: c.Blocked, v: 'var(--st-block-fg)' },
          { n: c['In Progress'], v: 'var(--st-run-fg)' },
        ]
          .filter((s) => s.n > 0)
          .map((s, i) => (
            <div
              key={i}
              style={{ width: `${(s.n / c.total) * 100}%`, backgroundColor: `rgb(${s.v})` }}
              className="first:rounded-l-full last:rounded-r-full"
            />
          ))}
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}`}>
        {TILES.map(({ key, label, cls, Icon }) => {
          const n = c[key] as number;
          return (
            <div
              key={label}
              className={`rounded-lg px-3 py-2.5 ${cls} !items-start flex-col gap-0.5`}
              style={{ display: 'flex' }}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {label}
              </span>
              <span className="text-2xl font-bold tabular-nums leading-none">{n}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
