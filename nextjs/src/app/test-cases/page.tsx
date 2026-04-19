'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Copy, ChevronLeft, ChevronRight, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppStore } from '@/store/appStore';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';
import CustomGenerator from './CustomGenerator';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 5;

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
  const { testCases: storeTestCases } = useAppStore();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'custom'>('plan');
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
  }, [searchTerm, filterStatus]);

  const filteredCases = testCasesArray.filter((tc: any) => {
    const id = tc.id || tc.tid || '';
    const name = tc.name || tc.scenario || '';
    const matchSearch =
      (id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Handle both old and new status cases natively
    const tcStatus = tc.status || 'Not Executed';
    const matchStatus = filterStatus === 'All' || tcStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCases = filteredCases.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleCopy = async () => {
    try {
      const text = filteredCases
        .map((tc, idx) => {
          return `${idx + 1}. [${tc.tid || tc.id || 'undefined'}] ${tc.scenario || tc.name || 'undefined'}\n   Steps: ${(tc.test_steps || tc.steps)?.length || 0}\n   Priority: ${tc.priority}\n   Status: ${tc.status}`;
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
        'Status': tc.status || 'Not Executed',
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
        tc.status || 'Not Executed',
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

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-900/30 text-green-300 border-green-600';
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-900/30 text-blue-300 border-blue-600';
      case 'blocked':
        return 'bg-red-900/30 text-red-300 border-red-600';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Test Cases</h1>
          <p className="text-slate-400 text-sm">
            {activeTab === 'plan'
              ? `${filteredCases.length} test case${filteredCases.length !== 1 ? 's' : ''} from Test Plans`
              : `${filteredCases.length} custom test case${filteredCases.length !== 1 ? 's' : ''}`
            }
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          
          {/* Source Tabs */}
          <div className="flex gap-0 mb-6 bg-slate-800/60 border border-slate-700 rounded-xl p-1 w-fit">
            <button
              onClick={() => { setActiveTab('plan'); setCurrentPage(1); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
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
              onClick={() => { setActiveTab('custom'); setCurrentPage(1); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
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
          {activeTab === 'custom' && (
            <div className="mb-6">
              <CustomGenerator onGenerateSuccess={() => {}} />
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="card p-4 mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input w-48"
              >
                <option>All</option>
                <option>Not Executed</option>
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Blocked</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={handleExportXlsx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-slate-200 text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                XLSX
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-slate-200 text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {/* Test Cases List */}
          {paginatedCases.length > 0 ? (
            <div className="space-y-4">
              {paginatedCases.map((tc: any) => {
                const tcId = tc.id || tc.tid;
                const isExpanded = expandedId === tcId;
                
                return (
                <div 
                  key={tcId} 
                  className={`card-hover p-0 cursor-pointer transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-500 bg-slate-800/80' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : tcId)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-400 font-bold">{tcId}</span>
                          {tc.source === 'Custom' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">
                              ✏️ Custom
                            </span>
                          ) : tc.source ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/50">
                              🔗 {tc.source}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/50">
                              📋 Plan
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(tc.status || 'Not Executed')}`}>
                            {tc.status || 'Not Executed'}
                          </span>
                          {(tc.is_automated === 'Yes' || tc.isAutomated) && (
                            <span className="px-2 py-1 rounded text-xs font-medium border bg-slate-800 text-purple-400 border-purple-500/50">
                              Automated
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mt-2">{tc.name || tc.scenario}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-medium ${getPriorityColor(tc.priority)}`}>
                          {tc.priority || 'Medium'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {(tc.description || tc.testcase_description) && (
                      <p className="text-slate-400 text-sm mb-3">{tc.description || tc.testcase_description}</p>
                    )}

                    {!isExpanded ? (
                      // COLLAPSED VIEW
                      (tc.steps || tc.test_steps) && (tc.steps || tc.test_steps).length > 0 && (
                        <div className="mb-3">
                          <ol className="space-y-1 text-sm text-slate-300">
                            {(tc.steps || tc.test_steps).slice(0, 2).map((step: string, i: number) => (
                              <li key={i} className="ml-4 list-decimal">{step.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                            {(tc.steps || tc.test_steps).length > 2 && (
                              <li className="ml-4 text-slate-500 list-none mt-1">
                                +{(tc.steps || tc.test_steps).length - 2} more steps
                              </li>
                            )}
                          </ol>
                        </div>
                      )
                    ) : (
                      // EXPANDED VIEW
                      <div className="mt-6 space-y-6 border-t border-slate-700/50 pt-6 cursor-default" onClick={e => e.stopPropagation()}>
                        {(tc.precondition || (tc.preconditions && tc.preconditions.length > 0)) && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preconditions</h4>
                            <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-300 border border-slate-800">
                              {tc.precondition || (tc.preconditions || []).join(', ')}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Test Steps</h4>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 h-full">
                              <ol className="space-y-3 text-sm text-slate-300 list-decimal ml-4">
                                {(tc.steps || tc.test_steps || []).map((step: string, i: number) => (
                                  <li key={i} className="pl-1 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected Result</h4>
                              <div className="bg-green-950/20 p-3 rounded-lg text-sm text-green-200/90 border border-green-900/30">
                                {tc.expected_result || tc.expectedResult || (tc.expectedResults || []).join('\n')}
                              </div>
                            </div>
                            {(tc.actual_result || tc.actualResult || tc.status !== 'Not Executed') && (
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Actual Result</h4>
                                <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-300 border border-slate-800">
                                  {tc.actual_result || tc.actualResult || 'Awaiting execution results...'}
                                </div>
                              </div>
                            )}
                            {(tc.misc_comments) && (
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comments</h4>
                                <div className="bg-slate-900/50 p-3 rounded-lg text-sm text-slate-400 italic border border-slate-800">
                                  {tc.misc_comments}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {tc.executed_qa_name && (
                          <div className="text-xs font-medium text-slate-500 text-right pt-2">
                            Executed by: <span className="text-slate-400">{tc.executed_qa_name || tc.executedQaName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {tc.tags && tc.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-4">
                        {tc.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )})}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-12 text-center max-w-4xl mx-auto mt-8">
              <div className="mb-8">
                <span className="text-4xl block mb-4">📋</span>
                <h3 className="text-2xl font-bold text-slate-100 mb-2">No Test Cases Yet</h3>
                <p className="text-slate-400">Generate test cases using one of these methods:</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors flex flex-col">
                  <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">🔗 From Jira</h4>
                  <p className="text-sm text-slate-400 mb-8 flex-1 leading-relaxed">Fetch user stories from Jira and auto-generate test cases via test plan context.</p>
                  <button onClick={() => router.push('/dashboard')} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Go to Jira →</button>
                </div>
                <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors flex flex-col">
                   <h4 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">✏️ Custom Generator</h4>
                   <p className="text-sm text-slate-400 mb-8 flex-1 leading-relaxed">Describe a scenario and generate test cases instantly without a Jira connection.</p>
                   <button onClick={() => setActiveGenerator('custom')} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-900/20">Open Generator →</button>
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
