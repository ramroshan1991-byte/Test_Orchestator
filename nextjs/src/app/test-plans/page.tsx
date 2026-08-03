'use client';

import React, { useState, useMemo } from 'react';
import { FileText, Download, ChevronDown, Trash2, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useAppStore } from '@/store/appStore';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';

import { apiClient } from '@/lib/api-client';
import { generateTestCasesBatched, type GenerationProgress } from '@/lib/testCaseGeneration';

// STANDARDIZED DOWNLOAD HELPERS
const getFilename = (prefix: string, extension: string, title?: string) => {
  const date = new Date().toISOString().slice(0, 10);
  const baseName = title 
    ? title.replace(/[^a-z0-9]/gi, '_').substring(0, 60) 
    : prefix;
  return `${baseName}_${date}.${extension}`;
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

// Helper: render a plain string list as bullets
const BulletList = ({ items }: { items?: string[] }) => (
  <ul className="space-y-1.5">
    {(items || []).map((item, i) => (
      <li key={i} className="flex gap-2 text-slate-300 text-sm">
        <span className="text-purple-400 mt-0.5">•</span>
        <span>{item}</span>
      </li>
    ))}
    {(!items || items.length === 0) && <li className="text-slate-500 text-sm italic">None specified</li>}
  </ul>
);

// Section wrapper
const Section = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <div className="border border-slate-700 rounded-xl overflow-hidden">
    <div className="bg-slate-700/50 px-5 py-3 flex items-center gap-3 border-b border-slate-700">
      <span className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h3 className="font-semibold text-slate-100">{title}</h3>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

// Criteria pair
const CriteriaPair = ({ entryLabel, exitLabel, entry, exit }: { entryLabel: string; exitLabel: string; entry?: string[]; exit?: string[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">✅ {entryLabel}</p>
      <BulletList items={entry} />
    </div>
    <div>
      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">🚪 {exitLabel}</p>
      <BulletList items={exit} />
    </div>
  </div>
);

export default function TestPlansPage() {
  const { jiraStories, testPlans, setTestPlans, testCases, setTestCases } = useAppStore();
  const { showToast } = useToast();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [generatingCasesFor, setGeneratingCasesFor] = useState<string | null>(null);
  const [caseProgress, setCaseProgress] = useState<GenerationProgress | null>(null);

  const testPlansArray: any[] = useMemo(() => Object.values(testPlans || {}), [testPlans]);

  const handleGeneratePlanFromStory = async (storyKey: string) => {
    setGeneratingPlanId(storyKey);
    setCurrentStepIndex(0);
    try {
      const story = jiraStories.find((s) => s.key === storyKey);
      if (!story) { showToast('Story not found', 'error'); return; }
      const steps = ['Analyzing user story...', 'Identifying scope and risks...', 'Building test strategy...', 'Structuring all sections...'];
      for (let i = 0; i < steps.length; i++) { setCurrentStepIndex(i); await new Promise((r) => setTimeout(r, 800)); }
      setCurrentStepIndex(steps.length);
      await new Promise((r) => setTimeout(r, 300));
      const resp = await apiClient.generateTestPlan(story);
      const returnedPlan = resp?.testPlan || resp;
      if (!returnedPlan) throw new Error('Invalid response from AI service');
      setTestPlans({ ...testPlans, [storyKey]: returnedPlan });
      showToast(`Test plan generated for ${story.summary}!`, 'success');
      setExpandedPlan(storyKey);
    } catch (error) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setGeneratingPlanId(null);
      setCurrentStepIndex(null);
    }
  };

  const handleDeletePlan = (storyKey: string) => {
    const updated = { ...testPlans };
    delete updated[storyKey];
    setTestPlans(updated);
    showToast('Test plan deleted', 'info');
  };

  const handleGenerateTestCasesFromPlan = async (plan: any) => {
    const storyKey = plan.storyKey || plan.storyId || null;
    const planKey = String(plan.id || storyKey || Date.now());
    setGeneratingCasesFor(planKey);
    setCaseProgress(null);
    try {
      // Pass the full Jira story (description + acceptance criteria), not just the
      // title — coverage depth is derived from what the story actually contains.
      const storyData = storyKey
        ? jiraStories.find((s) => s.key === storyKey) || { key: storyKey, summary: plan.storyTitle }
        : { key: null, summary: plan.storyTitle || plan.project_name };

      const result = await generateTestCasesBatched(
        storyData,
        plan,
        { count: 'Auto (AI decides)' },
        setCaseProgress
      );

      if (!result.testCases.length) throw new Error('No test cases returned');

      const tagged = result.testCases.map((tc: any) => ({
        ...tc,
        source: storyKey || 'Plan',
        id: tc.tid || tc.id,
      }));

      // Merge — replacing the map wiped every other story's cases.
      setTestCases({ ...testCases, [planKey]: tagged });

      if (result.shortfall) {
        showToast(`Generated ${tagged.length} test cases. ${result.shortfall}`, 'warning');
      } else {
        showToast(`Generated ${tagged.length} test cases`, 'success');
      }
    } catch (error) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
    } finally {
      setGeneratingCasesFor(null);
      setCaseProgress(null);
    }
  };





  const handleExportXlsx = (plan: any) => {
    try {
      const wb = XLSX.utils.book_new();
      const summaryRows = [
        { Field: 'Project Name', Value: plan.project_name || '' },
        { Field: 'Story', Value: plan.storyTitle || '' },
        { Field: 'Version', Value: plan.version || '' },
        { Field: 'Prepared By', Value: plan.prepared_by || '' },
        { Field: 'Date', Value: plan.date || '' },
        { Field: 'Objective', Value: plan.objective || '' },
        { Field: 'Scope', Value: plan.scope || '' },
        { Field: 'Test Strategy', Value: plan.test_strategy || '' },
        { Field: 'Defect Procedure', Value: plan.defect_reporting_procedure || '' },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
      
      if ((plan.inclusions||[]).length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((plan.inclusions||[]).map((s:string) => ({ Inclusions: s }))), 'Inclusions');
      if ((plan.exclusions||[]).length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((plan.exclusions||[]).map((s:string) => ({ Exclusions: s }))), 'Exclusions');
      if ((plan.test_environments||[]).length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plan.test_environments), 'Environments');
      if ((plan.test_schedule||[]).length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plan.test_schedule), 'Schedule');
      if ((plan.risks_and_mitigations||[]).length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plan.risks_and_mitigations), 'Risks');
      if ((plan.tools||[]).length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(plan.tools), 'Tools');
      
      const fileName = getFilename(getPrefix('testplan'), 'xlsx', plan.storyTitle || plan.project_name);
      XLSX.writeFile(wb, fileName);
      showToast('XLSX downloaded!', 'success');
    } catch (e) { 
      console.error(e);
      showToast('Failed to export XLSX', 'error'); 
    }
  };

  const handleExportJson = (plan: any) => {
    try {
      const fileName = getFilename(getPrefix('testplan'), 'json', plan.storyTitle || plan.project_name);
      const jsonBlob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
      triggerDownload(jsonBlob, fileName);
      showToast('JSON downloaded!', 'success');
    } catch { showToast('Failed to export JSON', 'error'); }
  };

  const handleExportPdf = (plan: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Test Plan: ${plan.project_name || 'Document'}`, 14, 20);
      let y = 30;
      doc.setFontSize(12);
      
      const addSection = (title: string, text: string) => {
        doc.setFontSize(12);
        doc.text(title, 14, y); y += 6;
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text || 'N/A', 180);
        doc.text(lines, 14, y);
        y += (lines.length * 5) + 5;
      };

      addSection("Objective:", plan.objective);
      addSection("Scope:", plan.scope);
      addSection("Test Strategy:", plan.test_strategy);

      if (plan.test_schedule && plan.test_schedule.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Phase', 'Start', 'End', 'Owner']],
          body: plan.test_schedule.map((s:any) => [s.phase, s.start, s.end, s.owner])
        });
      }
      
      const fileName = getFilename(getPrefix('testplan'), 'pdf', plan.storyTitle || plan.project_name);
      doc.save(fileName);
      showToast('PDF downloaded!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to export PDF', 'error');
    }
  };

  const impactColor = (impact: string) =>
    impact === 'High' ? 'bg-red-700/80 text-red-200' : impact === 'Medium' ? 'bg-amber-700/80 text-amber-200' : 'bg-green-700/80 text-green-200';

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-slate-100">Test Plans</h1>
          </div>
          <p className="text-slate-400">AI-generated test plans following your template structure</p>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

          {/* Generate from Stories */}
          {jiraStories.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Generate Test Plans from Stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jiraStories.map((story) => (
                  <div key={story.key} className="card-hover p-4 space-y-3">
                    <div>
                      <p className="font-mono text-blue-400 font-bold">{story.key}</p>
                      <p className="text-slate-100 font-semibold mt-1">{story.summary}</p>
                      {testPlans[story.key] && (
                        <span className="text-xs text-green-400 mt-1 inline-flex items-center gap-1">✓ Plan generated</span>
                      )}
                    </div>
                    {generatingPlanId === story.key ? (
                      <div className="w-full p-3 bg-slate-800 rounded text-sm text-slate-300 space-y-1">
                        <p className="text-slate-400 text-xs">Generating test plan...</p>
                        {['Analyzing user story...','Identifying scope and risks...','Building test strategy...','Structuring all sections...'].map((step, i) => (
                          <p key={i} className={`text-xs ${currentStepIndex !== null && i < currentStepIndex ? 'text-green-400' : currentStepIndex === i ? 'text-purple-300' : 'text-slate-500'}`}>
                            {currentStepIndex !== null && i < currentStepIndex ? '✓' : currentStepIndex === i ? '⏳' : '○'} {step}
                          </p>
                        ))}
                        {currentStepIndex !== null && currentStepIndex >= 4 && <p className="text-green-300 text-xs">✅ Saving...</p>}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGeneratePlanFromStory(story.key)}
                        className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-all font-medium"
                      >
                        {testPlans[story.key] ? 'Regenerate Plan' : 'Generate Plan'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Plans List — Full 14-section view */}
          {testPlansArray.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-100">Generated Test Plans</h2>
              {testPlansArray.map((plan, idx) => {
                const planKey = Object.keys(testPlans)[idx] || plan.id || String(idx);
                const isExpanded = expandedPlan === planKey;
                return (
                  <div key={planKey} className="card">
                    {/* Plan header row */}
                    <button
                      className="w-full text-left px-6 py-4 flex items-center justify-between"
                      onClick={() => setExpandedPlan(isExpanded ? null : planKey)}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-purple-400 text-sm font-bold">{plan.storyKey || planKey}</span>
                          <span className="text-xs text-slate-500">v{plan.version || '1.0'}</span>
                          <span className="text-xs text-slate-500">{plan.date}</span>
                        </div>
                        <h3 className="font-bold text-slate-100 mt-1">{plan.storyTitle || plan.project_name || 'Test Plan'}</h3>
                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{plan.objective}</p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-4 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Full plan body */}
                    {isExpanded && (
                      <div className="border-t border-slate-700 px-6 pb-6 pt-5 space-y-4">

                        {/* Section 1 – Test Plan header */}
                        <Section number="1" title="Test Plan">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Project</p><p className="text-slate-100 font-medium">{plan.project_name}</p></div>
                            <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Version</p><p className="text-slate-100 font-medium">{plan.version}</p></div>
                            <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Prepared By</p><p className="text-slate-100 font-medium">{plan.prepared_by}</p></div>
                            <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Date</p><p className="text-slate-100 font-medium">{plan.date}</p></div>
                          </div>
                        </Section>

                        {/* Section 2 – Objective */}
                        <Section number="2" title="Objective">
                          <p className="text-slate-300 text-sm leading-relaxed">{plan.objective}</p>
                        </Section>

                        {/* Section 3 – Scope */}
                        <Section number="3" title="Scope">
                          <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            {typeof plan.scope === 'string' ? plan.scope : 'Reference inclusions and exclusions below.'}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">3.1 Inclusions</p>
                              <BulletList items={plan.inclusions || (plan.scope?.in_scope)} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">3.2 Exclusions</p>
                              <BulletList items={plan.exclusions || (plan.scope?.out_of_scope)} />
                            </div>
                          </div>
                        </Section>

                        {/* Section 4 – Test Environments */}
                        <Section number="4" title="Test Environments">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                                  <th className="text-left py-2 pr-4">Name</th>
                                  <th className="text-left py-2 pr-4">Browser</th>
                                  <th className="text-left py-2 pr-4">OS</th>
                                  <th className="text-left py-2 pr-4">Device</th>
                                  <th className="text-left py-2">URL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(plan.test_environments || []).map((env: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-700/50">
                                    <td className="py-2 pr-4 text-slate-200">{env.name}</td>
                                    <td className="py-2 pr-4 text-slate-300">{env.browser}</td>
                                    <td className="py-2 pr-4 text-slate-300">{env.os}</td>
                                    <td className="py-2 pr-4 text-slate-300">{env.device}</td>
                                    <td className="py-2 text-blue-400 text-xs">{env.url || '—'}</td>
                                  </tr>
                                ))}
                                {!(plan.test_environments||[]).length && <tr><td colSpan={5} className="py-2 text-slate-500 italic text-sm">No environments defined</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </Section>

                        {/* Section 5 – Defect Reporting */}
                        <Section number="5" title="Defect Reporting Procedure">
                          <p className="text-slate-300 text-sm leading-relaxed">{plan.defect_reporting_procedure || '—'}</p>
                        </Section>

                        {/* Section 6 – Test Strategy */}
                        <Section number="6" title="Test Strategy">
                          <p className="text-slate-300 text-sm leading-relaxed">{plan.test_strategy || '—'}</p>
                        </Section>

                        {/* Section 7 – Test Schedule */}
                        <Section number="7" title="Test Schedule">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                                  <th className="text-left py-2 pr-4">Phase</th>
                                  <th className="text-left py-2 pr-4">Start</th>
                                  <th className="text-left py-2 pr-4">End</th>
                                  <th className="text-left py-2">Owner</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(plan.test_schedule || []).map((s: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-700/50">
                                    <td className="py-2 pr-4 text-slate-200">{s.phase}</td>
                                    <td className="py-2 pr-4 text-slate-300">{s.start}</td>
                                    <td className="py-2 pr-4 text-slate-300">{s.end}</td>
                                    <td className="py-2 text-slate-300">{s.owner}</td>
                                  </tr>
                                ))}
                                {!(plan.test_schedule||[]).length && <tr><td colSpan={4} className="py-2 text-slate-500 italic text-sm">No schedule defined</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </Section>

                        {/* Section 8 – Test Deliverables */}
                        <Section number="8" title="Test Deliverables">
                          <BulletList items={plan.test_deliverables} />
                        </Section>

                        {/* Section 9 – Entry & Exit Criteria */}
                        <Section number="9" title="Entry and Exit Criteria">
                          <CriteriaPair entryLabel="Entry Criteria" exitLabel="Exit Criteria" entry={plan.entry_criteria} exit={plan.exit_criteria} />
                        </Section>

                        {/* Section 10 – Test Execution */}
                        <Section number="10" title="Test Execution">
                          <CriteriaPair entryLabel="Entry Criteria" exitLabel="Exit Criteria" entry={plan.execution_entry_criteria} exit={plan.execution_exit_criteria} />
                        </Section>

                        {/* Section 11 – Test Closure */}
                        <Section number="11" title="Test Closure">
                          <CriteriaPair entryLabel="Entry Criteria" exitLabel="Exit Criteria" entry={plan.closure_entry_criteria} exit={plan.closure_exit_criteria} />
                        </Section>

                        {/* Section 12 – Tools */}
                        <Section number="12" title="Tools">
                          <div className="flex flex-wrap gap-3">
                            {(plan.tools || []).map((t: any, i: number) => (
                              <div key={i} className="px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
                                <p className="text-slate-100 text-sm font-semibold">{t.name}</p>
                                <p className="text-slate-400 text-xs">{t.purpose}</p>
                              </div>
                            ))}
                            {!(plan.tools||[]).length && <p className="text-slate-500 italic text-sm">No tools specified</p>}
                          </div>
                        </Section>

                        {/* Section 13 – Risks & Mitigations */}
                        <Section number="13" title="Risks and Mitigations">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                                  <th className="text-left py-2 pr-4">Risk</th>
                                  <th className="text-left py-2 pr-4">Impact</th>
                                  <th className="text-left py-2">Mitigation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(plan.risks_and_mitigations || []).map((r: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-700/50">
                                    <td className="py-2 pr-4 text-slate-200">{r.risk}</td>
                                    <td className="py-2 pr-4">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${impactColor(r.impact)}`}>{r.impact}</span>
                                    </td>
                                    <td className="py-2 text-slate-300">{r.mitigation}</td>
                                  </tr>
                                ))}
                                {!(plan.risks_and_mitigations||[]).length && <tr><td colSpan={3} className="py-2 text-slate-500 italic text-sm">No risks defined</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </Section>

                        {/* Section 14 – Approvals */}
                        <Section number="14" title="Approvals">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                                  <th className="text-left py-2 pr-4">Role</th>
                                  <th className="text-left py-2 pr-4">Name</th>
                                  <th className="text-left py-2 pr-4">Signature</th>
                                  <th className="text-left py-2">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(plan.approvals || []).map((a: any, i: number) => (
                                  <tr key={i} className="border-b border-slate-700/50">
                                    <td className="py-3 pr-4 text-slate-200 font-medium">{a.role}</td>
                                    <td className="py-3 pr-4 text-slate-400 italic">{a.name || '________________'}</td>
                                    <td className="py-3 pr-4 text-slate-400 italic">{a.signature || '________________'}</td>
                                    <td className="py-3 text-slate-400 italic">{a.date || '________________'}</td>
                                  </tr>
                                ))}
                                {!(plan.approvals||[]).length && <tr><td colSpan={4} className="py-2 text-slate-500 italic text-sm">No approvals defined</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </Section>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button onClick={() => handleExportXlsx(plan)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                            <Download className="w-4 h-4" /> Export XLSX
                          </button>
                          <button onClick={() => handleExportJson(plan)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors">
                            <Download className="w-4 h-4" /> Export JSON
                          </button>
                          <button onClick={() => handleExportPdf(plan)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors">
                            <Download className="w-4 h-4" /> Export PDF
                          </button>
                          <button
                            onClick={() => handleGenerateTestCasesFromPlan(plan)}
                            disabled={generatingCasesFor !== null}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors ml-auto"
                          >
                            <ClipboardList className="w-4 h-4" />
                            {generatingCasesFor === planKey
                              ? caseProgress
                                ? `Generating… ${caseProgress.collected}/${caseProgress.target}`
                                : 'Generating…'
                              : 'Generate Test Cases →'}
                          </button>
                          <button onClick={() => handleDeletePlan(planKey)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm font-medium transition-colors">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {testPlansArray.length === 0 && jiraStories.length === 0 && (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2 font-medium">No test plans yet.</p>
              <p className="text-slate-500 text-sm">Start by connecting to Jira and importing stories, then click "Generate Test Plan" on any story.</p>
            </div>
          )}

          {testPlansArray.length === 0 && jiraStories.length > 0 && (
            <div className="card p-8 text-center">
              <p className="text-slate-400 text-sm">Select a story above and click "Generate Plan" — or open any story card and click <strong className="text-purple-400">Generate Test Plan</strong>.</p>
            </div>
          )}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
