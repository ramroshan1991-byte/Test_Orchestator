'use client';

import React from 'react';
import { CheckCircle2, XCircle, Ban, Loader2, Circle, Bot } from 'lucide-react';

/**
 * Execution status vocabulary. The store previously carried a mix of
 * "Not Executed" / "Not Started" / "Completed" from three different code paths,
 * while the filter dropdown offered a fourth set — so filtering silently missed
 * cases. Everything now normalises through here.
 */
export const STATUSES = ['Not Executed', 'In Progress', 'Passed', 'Failed', 'Blocked'] as const;
export type TestStatus = (typeof STATUSES)[number];

export function normalizeStatus(raw?: string): TestStatus {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'passed' || s === 'pass' || s === 'completed') return 'Passed';
  if (s === 'failed' || s === 'fail') return 'Failed';
  if (s === 'blocked') return 'Blocked';
  if (s === 'in progress' || s === 'in_progress' || s === 'running') return 'In Progress';
  return 'Not Executed';
}

const STATUS_STYLE: Record<TestStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  Passed: { cls: 'status-pass', Icon: CheckCircle2 },
  Failed: { cls: 'status-fail', Icon: XCircle },
  Blocked: { cls: 'status-block', Icon: Ban },
  'In Progress': { cls: 'status-run', Icon: Loader2 },
  'Not Executed': { cls: 'status-idle', Icon: Circle },
};

export function StatusBadge({ status, className = '' }: { status?: string; className?: string }) {
  const key = normalizeStatus(status);
  const { cls, Icon } = STATUS_STYLE[key];
  return (
    <span className={`${cls} ${className}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden />
      {key}
    </span>
  );
}

/** Priority. Uses the same reserved status ramp — highest severity reads hottest. */
const PRIORITY_STYLE: Record<string, string> = {
  critical: 'status-fail',
  high: 'status-block',
  medium: 'status-run',
  low: 'status-idle',
};

export function PriorityBadge({ priority, className = '' }: { priority?: string; className?: string }) {
  const key = String(priority || 'Medium').toLowerCase();
  const cls = PRIORITY_STYLE[key] || 'status-idle';
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span className={`${cls} ${className}`} title={`Priority: ${label}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden />
      {label}
    </span>
  );
}

export function AutomatedBadge({ value }: { value?: string | boolean }) {
  const on = value === 'Yes' || value === true;
  if (!on) return null;
  return (
    <span className="status status-idle" title="Covered by an automated script">
      <Bot className="w-3 h-3 shrink-0" aria-hidden />
      Automated
    </span>
  );
}

/** Where the case came from: a Jira story key, or the custom generator. */
export function SourceBadge({ source }: { source?: string }) {
  const isCustom = source === 'Custom';
  return (
    <span
      className="status status-idle font-mono"
      title={isCustom ? 'Created in the Custom Generator' : `From story ${source || 'test plan'}`}
    >
      {isCustom ? '✏️' : '🔗'} {source || 'Plan'}
    </span>
  );
}
