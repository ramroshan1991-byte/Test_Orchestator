'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
  Rows3,
  List,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppStore } from '@/store/appStore';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';
import CustomGenerator from './CustomGenerator';
import { useRouter } from 'next/navigation';
import {
  StatusBadge,
  PriorityBadge,
  AutomatedBadge,
  SourceBadge,
  normalizeStatus,
  STATUSES,
} from '@/components/StatusBadge';
import { ExecutionSummary } from '@/components/ExecutionSummary';

const PAGE_SIZES = [10, 25, 50, 100];

// STANDARDIZED DOWNLOAD HELPERS
const getFilename = (prefix: string, extension: string) => {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.${extension}`;
};

const getPrefix = (type: string) => {
  const prefixMap: any = {
    testplan: 'Test-Plan',
    testcases: 'Test-Cases',
    singlecase: 'Test-Case'
  };
  return prefixMap[type] || 'Export';
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);   // append BEFORE click
  a.click();                       // then click
  setTimeout(() => {               // delay revoke by 300ms
    URL.revokeObjectURL(url);
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 300);
};

export default function TestCasesPage() {
  const {
    testCases: storeTestCases,
    updateTestCase,
    updateTestCases,
    deleteTestCases,
  } = useAppStore();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'custom'>('plan');
  const [dense, setDense] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Plan-generated cases: all keys EXCEPT 'custom_gen'
  const planTestCases = useMemo(() => {
    return Object.entries(storeTestCases || {})
      .filter(([key]) => key !== 'custom_gen')
      .flatMap(([, cases]) => cases) as any[];
  }, [storeTestCases]);

  // Custom-generated cases: only from 'custom_gen' key
  const customTestCases = useMemo(() => {
    return (storeTestCases?.['custom_gen'] || []) as any[];
  }, [storeTestCases]);

  // Active list based on selected tab
  const testCasesArray = activeTab === 'plan' ? planTestCases : customTestCases;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPriority, pageSize, activeTab]);

  const filteredCases = useMemo(
    () =>
      testCasesArray.filter((tc: any) => {
        const haystack = [tc.id, tc.tid, tc.name, tc.scenario, tc.testcase_description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
        // Compare on the normalised status — the store held three different
        // spellings, so a raw equality check silently matched nothing.
        const matchStatus = filterStatus === 'All' || normalizeStatus(tc.status) === filterStatus;
        const matchPriority =
          filterPriority === 'All' ||
          String(tc.priority || 'Medium').toLowerCase() === filterPriority.toLowerCase();
        return matchSearch && matchStatus && matchPriority;
      }),
    [testCasesArray, searchTerm, filterStatus, filterPriority]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedCases = filteredCases.slice(startIdx, startIdx + pageSize);

  const caseId = (tc: any) => tc.tid || tc.id;
  const pageIds = paginatedCases.map(caseId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectPage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  // Record a verdict. This is what makes the tool usable as a test runner
  // rather than a generator — status/actual_result/executed_qa_name existed in
  // the schema and the filter, but nothing could ever set them.
  const setStatus = (id: string, status: string) => {
    updateTestCase(id, { status });
    showToast(`${id} marked ${status}`, status === 'Failed' ? 'error' : 'success');
  };

  const bulkSet = (status: string) => {
    const ids = [...selected];
    if (!ids.length) return;
    updateTestCases(ids, { status });
    showToast(`${ids.length} case(s) marked ${status}`, 'success');
    setSelected(new Set());
  };

  const bulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} test case(s)? This cannot be undone.`)) return;
    deleteTestCases(ids);
    showToast(`${ids.length} case(s) deleted`, 'info');
    setSelected(new Set());
  };

  const handleCopy = async () => {
    try {
      const text = filteredCases
        .map((tc, idx) => {
          return `${idx + 1}. [${tc.tid || tc.id || 'undefined'}] ${tc.scenario || tc.name || 'undefined'}\n   Steps: ${(tc.test_steps || tc.steps)?.length || 0}\n   Priority: ${tc.priority}\n   Status: ${normalizeStatus(tc.status)}`;
        })
        .join('\n\n');

      await navigator.clipboard.writeText(text);
      showToast(`${filteredCases.length} test case(s) copied!`, 'success');
    } catch (error) {
      showToast('Failed to copy', 'error');
    }
  };

  const handleExportXlsx = () => {
    try {
      const rows = filteredCases.map(tc => ({
        'Scenario': tc.scenario || tc.name || '',
        'TID': tc.tid || tc.id || '',
        'Testcase Description': tc.testcase_description || tc.description || '',
        'PreCondition': tc.precondition || (tc.preconditions || []).join('\n') || '',
        'TestSteps': (tc.test_steps || tc.steps || []).join('\n') || '',
        'Expected Result': tc.expected_result || (tc.expectedResults || []).join('\n') || '',
        'Actual Result': tc.actual_result || tc.actualResult || '',
        'Status': normalizeStatus(tc.status),
        'Executed QA Name': tc.executed_qa_name || tc.executedQaName || '',
        'Misc (Comments)': tc.misc_comments || '',
        'Priority': tc.priority || '',
        'Is Automated': tc.is_automated || (tc.isAutomated ? 'Yes' : 'No')
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Test Cases');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const xlsxBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(xlsxBlob, getFilename(getPrefix('testcases'), 'xlsx'));

      showToast('XLSX downloaded!', 'success');
    } catch { showToast('Export XLSX failed', 'error'); }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF('landscape');
      doc.text('Test Cases Export', 14, 15);
      const body = filteredCases.map((tc: any) => [
        tc.tid || tc.id || '',
        tc.scenario || tc.name || '',
        tc.priority || '',
        normalizeStatus(tc.status),
        tc.is_automated || (tc.isAutomated ? 'Yes' : 'No')
      ]);
      const anyAutoTable = autoTable as any;
      anyAutoTable(doc, {
        startY: 20,
        head: [['TID', 'Scenario', 'Priority', 'Status', 'Automated']],
        body
      });

      const pdfBlob = doc.output('blob');
      triggerDownload(pdfBlob, getFilename(getPrefix('testcases'), 'pdf'));

      showToast('PDF downloaded!', 'success');
    } catch { showToast('Export PDF failed', 'error'); }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(filteredCases, null, 2);
      const jsonBlob = new Blob([dataStr], { type: 'application/json' });
      triggerDownload(jsonBlob, getFilename(getPrefix('testcases'), 'json'));

      showToast('JSON downloaded!', 'success');
    } catch (error) {
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 pt-14 lg:pt-0">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-1">Test Cases</h1>
          <p className="text-slate-400 text-sm">
            {activeTab === 'plan'
              ? `${filteredCases.length} of ${planTestCases.length} test case${planTestCases.length !== 1 ? 's' : ''} from Test Plans`
              : `${filteredCases.length} of ${customTestCases.length} custom test case${customTestCases.length !== 1 ? 's' : ''}`
            }
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5">

          {/* Source Tabs */}
          <div className="flex gap-0 bg-slate-800/60 border border-slate-700 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => { setActiveTab('plan'); setSelected(new Set()); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'plan'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 From Test Plans
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'plan' ? 'bg-blue-500/40 text-blue-100' : 'bg-slate-700 text-slate-400'
              }`}>{planTestCases.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('custom'); setSelected(new Set()); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'custom'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✏️ Custom Generator
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'custom' ? 'bg-amber-500/40 text-amber-100' : 'bg-slate-700 text-slate-400'
              }`}>{customTestCases.length}</span>
            </button>
          </div>

          {/* Custom Generator Form — only shown on Custom tab */}
          {activeTab === 'custom' && <CustomGenerator onGenerateSuccess={() => {}} />}

          {/* Execution readout */}
          <ExecutionSummary cases={testCasesArray} />

          {/* Search & Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by ID, scenario or description…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9"
                  aria-label="Search test cases"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input sm:w-44"
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input sm:w-40"
                aria-label="Filter by priority"
              >
                <option value="All">All priorities</option>
                {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm transition-colors">
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm transition-colors">
                <FileText className="w-4 h-4" /> JSON
              </button>
              <button onClick={handleExportXlsx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm transition-colors">
                <Download className="w-4 h-4" /> XLSX
              </button>
              <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm transition-colors">
                <Download className="w-4 h-4" /> PDF
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setDense((d) => !d)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm transition-colors"
                  title={dense ? 'Switch to comfortable rows' : 'Switch to compact rows'}
                >
                  {dense ? <Rows3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  {dense ? 'Comfortable' : 'Compact'}
                </button>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="input w-20 py-1.5"
                    aria-label="Rows per page"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Bulk action bar — only while something is selected */}
          {selected.size > 0 && (
            <div className="sticky top-0 z-20 card p-3 flex flex-wrap items-center gap-2 border-blue-600/60 shadow-lg">
              <span className="text-sm font-medium text-slate-200">
                {selected.size} selected
              </span>
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <span className="text-xs text-slate-400 hidden sm:inline">Mark as</span>
                {(['Passed', 'Failed', 'Blocked', 'Not Executed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => bulkSet(s)}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium transition-colors"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={bulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Test Cases List */}
          {paginatedCases.length > 0 ? (
            <div className="space-y-3">
              {/* Select-all for the current page */}
              <label className="flex items-center gap-2 px-1 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectPage}
                  className="w-4 h-4 accent-blue-600"
                />
                Select all {pageIds.length} on this page
              </label>

              {paginatedCases.map((tc: any) => {
                const tcId = caseId(tc);
                const isExpanded = expandedId === tcId;
                const isSelected = selected.has(tcId);
                const steps = tc.steps || tc.test_steps || [];

                return (
                  <div
                    key={tcId}
                    className={`card-hover overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-blue-500/70' : ''
                    } ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={dense ? 'p-3' : 'p-4 sm:p-5'}>
                      {/* Row head */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(tcId)}
                          className="mt-1 w-4 h-4 accent-blue-600 shrink-0"
                          aria-label={`Select ${tcId}`}
                        />

                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => setExpandedId(isExpanded ? null : tcId)}
                          aria-expanded={isExpanded}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-mono text-blue-400 font-bold text-sm">{tcId}</span>
                            <StatusBadge status={tc.status} />
                            <PriorityBadge priority={tc.priority} />
                            <AutomatedBadge value={tc.is_automated ?? tc.isAutomated} />
                            <SourceBadge source={tc.source} />
                          </div>
                          <h3 className={`font-semibold text-slate-100 ${dense ? 'text-sm' : 'text-base'}`}>
                            {tc.name || tc.scenario}
                          </h3>
                          {!dense && (tc.description || tc.testcase_description) && (
                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                              {tc.description || tc.testcase_description}
                            </p>
                          )}
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Inline verdict — one click to record a result */}
                          <select
                            value={normalizeStatus(tc.status)}
                            onChange={(e) => setStatus(tcId, e.target.value)}
                            className="input w-32 py-1.5 text-xs hidden sm:block"
                            aria-label={`Set status for ${tcId}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : tcId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Collapsed step peek — skipped in compact mode */}
                      {!isExpanded && !dense && steps.length > 0 && (
                        <ol className="mt-3 ml-8 space-y-1 text-sm text-slate-300 list-decimal">
                          {steps.slice(0, 2).map((step: string, i: number) => (
                            <li key={i} className="ml-2">{step.replace(/^\d+\.\s*/, '')}</li>
                          ))}
                          {steps.length > 2 && (
                            <li className="ml-2 list-none text-slate-500">+{steps.length - 2} more steps</li>
                          )}
                        </ol>
                      )}

                      {/* EXPANDED */}
                      {isExpanded && (
                        <div className="mt-5 space-y-5 border-t border-slate-700/60 pt-5">
                          {(tc.precondition || (tc.preconditions && tc.preconditions.length > 0)) && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preconditions</h4>
                              <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-300 border border-slate-700">
                                {tc.precondition || (tc.preconditions || []).join(', ')}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Test Steps</h4>
                              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 h-full">
                                <ol className="space-y-2.5 text-sm text-slate-300 list-decimal ml-4">
                                  {steps.map((step: string, i: number) => (
                                    <li key={i} className="pl-1 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</li>
                                  ))}
                                </ol>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected Result</h4>
                                <div className="p-3 rounded-lg text-sm border status-pass !block">
                                  {tc.expected_result || tc.expectedResult || (tc.expectedResults || []).join('\n')}
                                </div>
                              </div>

                              {/* Actual result is now editable — this is the field a
                                  tester fills in while running the case. */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                  Actual Result
                                </label>
                                <textarea
                                  value={tc.actual_result || tc.actualResult || ''}
                                  onChange={(e) => updateTestCase(tcId, { actual_result: e.target.value })}
                                  placeholder="What actually happened? Paste errors or observations here."
                                  rows={3}
                                  className="input resize-y text-sm"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Executed By
                                  </label>
                                  <input
                                    type="text"
                                    value={tc.executed_qa_name || tc.executedQaName || ''}
                                    onChange={(e) => updateTestCase(tcId, { executed_qa_name: e.target.value })}
                                    placeholder="QA name"
                                    className="input text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Status
                                  </label>
                                  <select
                                    value={normalizeStatus(tc.status)}
                                    onChange={(e) => setStatus(tcId, e.target.value)}
                                    className="input text-sm"
                                  >
                                    {STATUSES.map((s) => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                  Comments
                                </label>
                                <textarea
                                  value={tc.misc_comments || ''}
                                  onChange={(e) => updateTestCase(tcId, { misc_comments: e.target.value })}
                                  placeholder="Notes, defect links, environment details…"
                                  rows={2}
                                  className="input resize-y text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <p className="text-sm text-slate-400 tabular-nums">
                    Showing {startIdx + 1}–{Math.min(startIdx + pageSize, filteredCases.length)} of{' '}
                    {filteredCases.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                      disabled={safePage === 1}
                      className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-slate-300 tabular-nums px-1">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage === totalPages}
                      className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : testCasesArray.length > 0 ? (
            // Filters excluded everything — distinct from having no cases at all.
            <div className="card p-10 text-center">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-100 mb-1">No matches</h3>
              <p className="text-slate-400 text-sm mb-4">
                {testCasesArray.length} case{testCasesArray.length !== 1 ? 's' : ''} exist, but none match the current filters.
              </p>
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterPriority('All'); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="card p-8 sm:p-12 text-center max-w-4xl mx-auto">
              <div className="mb-8">
                <span className="text-4xl block mb-4">📋</span>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">No Test Cases Yet</h3>
                <p className="text-slate-400">Generate test cases using one of these methods:</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="bg-slate-800/50 p-6 sm:p-8 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors flex flex-col">
                  <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">🔗 From Jira</h4>
                  <p className="text-sm text-slate-400 mb-8 flex-1 leading-relaxed">Fetch user stories from Jira and auto-generate test cases via test plan context.</p>
                  {/* Was /dashboard, which 404s — the route is /jira-connect. */}
                  <button onClick={() => router.push('/jira-connect')} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Go to Jira →</button>
                </div>
                <div className="bg-slate-800/50 p-6 sm:p-8 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors flex flex-col">
                   <h4 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">✏️ Custom Generator</h4>
                   <p className="text-sm text-slate-400 mb-8 flex-1 leading-relaxed">Describe a scenario and generate test cases instantly without a Jira connection.</p>
                   <button onClick={() => setActiveTab('custom')} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-900/20">Open Generator →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
