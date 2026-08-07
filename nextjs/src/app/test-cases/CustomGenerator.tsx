'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { useAppStore } from '@/store/appStore';
import { RefreshCcw, Zap } from 'lucide-react';
import { generateTestCasesBatched, type GenerationProgress } from '@/lib/testCaseGeneration';

export default function CustomGenerator({ onGenerateSuccess }: { onGenerateSuccess?: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const { setTestCases, testCases: storeTestCases } = useAppStore();

  const [form, setForm] = useState({
    moduleName: '',
    targetApp: '',
    scenario: '',
    ac: '',
    appType: 'Web App',
    priority: 'All',
    types: ['Positive', 'Negative', 'Edge Case', 'Boundary'],
    count: '8-12',
    context: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('to_custom_form');
    if (saved) {
      try { setForm({ ...form, ...JSON.parse(saved) }); } catch (e) {}
    }
  }, []);

  const updateForm = (key: string, value: any) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    localStorage.setItem('to_custom_form', JSON.stringify(newForm));
  };

  const toggleType = (t: string) => {
    const newTypes = form.types.includes(t) ? form.types.filter(x => x !== t) : [...form.types, t];
    updateForm('types', newTypes);
  };

  const clearForm = () => {
    const fresh = { moduleName:'', targetApp:'', scenario:'', ac:'', appType:'Web App', priority:'All', types:['Positive', 'Negative', 'Edge Case'], count:'8-12', context:'' };
    setForm(fresh);
    localStorage.removeItem('to_custom_form');
  };

  const handleGenerate = async () => {
    if (!form.scenario) {
      showToast('Scenario is required. Please describe what to test.', 'error');
      return;
    }
    setLoading(true);
    setProgress(null);
    try {
      // Split the acceptance criteria textarea into individual criteria — the
      // count of criteria is what drives coverage depth on "Auto".
      const criteria = form.ac
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
        .filter(Boolean);

      const storyData = {
        title: `[Custom] Module: ${form.moduleName || 'New Feature'}`,
        summary: form.scenario,
        description: [form.scenario, form.context].filter(Boolean).join('\n\n'),
        acceptanceCriteria: criteria,
      };

      const generation = {
        targetApp: form.targetApp,
        count: form.count,
        types: form.types,
        priority: form.priority,
        appType: form.appType,
        context: form.context,
      };

      const result = await generateTestCasesBatched(
        storyData,
        { scope: `Types: ${form.types.join(', ')}. Priority: ${form.priority}. App Type: ${form.appType}.` },
        generation,
        setProgress
      );

      const taggedCases = result.testCases.map((tc: any) => ({
        ...tc,
        source: 'Custom',
        id: tc.tid || tc.id,
      }));

      // Each feature gets its own suite. Previously every run was prepended to one
      // shared `custom_gen` bucket, so generating for a new feature left the old
      // feature's cases in the list and the count only ever grew.
      const featureName = (form.moduleName || form.scenario.slice(0, 40) || 'Untitled feature').trim();
      const groupKey = `custom:${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      const previous = (storeTestCases as any)[groupKey] || [];

      const withFeature = taggedCases.map((tc: any) => ({ ...tc, feature: featureName }));
      setTestCases({ ...storeTestCases, [groupKey]: withFeature } as any);

      const replaced = previous.length
        ? ` Replaced the previous ${previous.length} case(s) for "${featureName}".`
        : '';

      if (result.shortfall) {
        showToast(`Generated ${taggedCases.length} test cases for "${featureName}". ${result.shortfall}${replaced}`, 'warning');
      } else {
        showToast(`✅ Generated ${taggedCases.length} test cases for "${featureName}".${replaced}`, 'success');
      }
      if (onGenerateSuccess) onGenerateSuccess();
    } catch (error) {
      showToast(
        `❌ Generation failed: ${error instanceof Error ? error.message : 'please try again'}`,
        'error'
      );
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="card p-6 border border-slate-700 bg-slate-900/50">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <span className="text-xl">✏️</span>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Custom Test Case Generator</h2>
          <p className="text-sm text-slate-400">Generate test cases directly — no Jira or test plan needed</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Feature / Module Name</label>
          <input type="text" className="input bg-slate-800" placeholder="e.g. Login Page, Payment Flow" value={form.moduleName} onChange={e => updateForm('moduleName', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Application Under Test</label>
          <input
            type="text"
            className="input bg-slate-800"
            placeholder="e.g. Facebook, or https://www.facebook.com/"
            value={form.targetApp}
            onChange={e => updateForm('targetApp', e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">
            Name the product or paste its URL. Steps will use its real screens and data. Leave blank to infer it from the scenario below.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Test Scenario / What to Test <span className="text-red-400">*</span></label>
          <textarea className={`input bg-slate-800 min-h-[80px] ${!form.scenario ? 'border-red-900/50' : ''}`} placeholder='e.g. "Test the login functionality with valid and invalid credentials..."' value={form.scenario} onChange={e => updateForm('scenario', e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Acceptance Criteria (optional)</label>
          <textarea className="input bg-slate-800 min-h-[60px]" placeholder="Paste acceptance criteria if available" value={form.ac} onChange={e => updateForm('ac', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Application Type</label>
            <div className="flex flex-wrap gap-2">
              {['Web App', 'Mobile App', 'API / Backend', 'Desktop'].map(t => (
                <button key={t} onClick={() => updateForm('appType', t)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${form.appType === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority Focus</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Critical Only', 'High & Above', 'Custom'].map(p => (
                <button key={p} onClick={() => updateForm('priority', p)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${form.priority === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Test Case Types to Generate</label>
          <div className="flex flex-wrap gap-2">
            {['Positive', 'Negative', 'Edge Case', 'Boundary', 'UI/UX', 'API', 'Performance'].map(t => {
              const active = form.types.includes(t);
              return (
                <button key={t} onClick={() => toggleType(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors ${active ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                  {active ? '✅' : '☐'} {t}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">Number of Test Cases</label>
             <div className="flex flex-wrap gap-2">
               {['Auto (AI decides)', '8-12', '12-20', '20-30', '30-40', '40-60'].map(c => (
                 <button key={c} onClick={() => updateForm('count', c)} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${form.count === c ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{c}</button>
               ))}
             </div>
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-300 mb-1">Additional Context (optional)</label>
           <textarea className="input bg-slate-800 min-h-[60px]" placeholder="Tech stack, known edge cases, env details..." value={form.context} onChange={e => updateForm('context', e.target.value)} />
        </div>

        {/* Batch progress — a 40-case run is several AI calls, so show where it is. */}
        {progress && (
          <div className="rounded-lg border border-blue-800/50 bg-blue-950/30 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-2">
              <span>
                Generating batch {Math.min(progress.batch, progress.totalBatches)} of {progress.totalBatches}
              </span>
              <span className="font-mono">
                {progress.collected} / {progress.target} cases
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((progress.collected / progress.target) * 100))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
           <button onClick={clearForm} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"><RefreshCcw className="w-4 h-4" /> Clear Form</button>
           <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
             {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
             {loading ? '⏳ Generating...' : '⚡ Generate Test Cases'}
           </button>
        </div>
      </div>
    </div>
  );
}
