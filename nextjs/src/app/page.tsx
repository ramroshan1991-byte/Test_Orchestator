'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { useAppStore } from '@/store/appStore';
import { ExecutionSummary } from '@/components/ExecutionSummary';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import {
  Zap, TrendingUp, CheckCircle, Code, ArrowRight,
  ChevronRight, FileText, Bot, Activity
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { testPlans, testCases, codeHistory } = useAppStore();
  const [aiStatus, setAiStatus] = useState<{ activeProvider: string; hasApiKey: boolean } | null>(null);

  const testPlanList = Object.values(testPlans || {}) as any[];
  const testCaseList = Object.values(testCases || {}).flat() as any[];
  const codeCount = Object.keys(codeHistory || {}).length;

  // Fetch AI provider status
  useEffect(() => {
    fetch('/api/ai/providers-status')
      .then(r => r.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ activeProvider: 'Unknown', hasApiKey: false }));
  }, []);

  const stats = [
    {
      title: 'Test Plans',
      value: testPlanList.length,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'blue',
      href: '/test-plans',
      description: 'AI-generated test plans',
    },
    {
      title: 'Test Cases',
      value: testCaseList.length,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green',
      href: '/test-cases',
      description: 'Detailed test case library',
    },
    {
      title: 'Generated Code',
      value: codeCount,
      icon: <Code className="w-6 h-6" />,
      color: 'purple',
      href: '/code-generator',
      description: 'Automation scripts ready',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'border-blue-500/40 hover:border-blue-500';
      case 'green': return 'border-green-500/40 hover:border-green-500';
      case 'purple': return 'border-purple-500/40 hover:border-purple-500';
      default: return 'border-slate-600';
    }
  };

  const getIconBg = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-600 text-white';
      case 'green': return 'bg-green-600 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const workflowSteps = [
    { emoji: '🔗', label: 'Connect to Jira', desc: 'Import user stories to start test generation', href: '/jira-connect', color: 'text-blue-400' },
    { emoji: '📋', label: 'Generate Test Plans', desc: 'Use AI to create comprehensive test plans', href: '/test-plans', color: 'text-indigo-400' },
    { emoji: '✅', label: 'Generate Test Cases', desc: 'Create detailed, realistic test cases', href: '/test-cases', color: 'text-green-400' },
    { emoji: '🤖', label: 'Generate Automation Code', desc: 'Build Selenium, Playwright or BDD scripts', href: '/code-generator', color: 'text-purple-400' },
  ];

  const recentTestPlans = testPlanList.slice(-5).reverse();
  const recentTestCases = testCaseList.slice(-6).reverse();

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 pt-14 lg:pt-0">

        {/* Header */}
        <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-slate-400 text-sm">QA Automation Overview</p>
              </div>
            </div>
            {/* AI Status Badge */}
            <div
              className={`${aiStatus?.hasApiKey ? 'status-pass' : 'status-fail'} !px-4 !py-2 !text-sm`}
              title={aiStatus?.hasApiKey ? 'An AI provider is configured' : 'No AI key configured — output will be mock data'}
            >
              <span className={`w-2 h-2 rounded-full bg-current ${aiStatus?.hasApiKey ? 'animate-pulse' : ''}`} />
              <Bot className="w-4 h-4" />
              {aiStatus ? aiStatus.activeProvider : 'Checking AI…'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">

          {/* Stats Cards — Clicking navigates to the page */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <button
                key={stat.title}
                onClick={() => router.push(stat.href)}
                className={`bg-slate-800 ${getColorClasses(stat.color)} border rounded-xl p-6 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconBg(stat.color)}`}>
                    {stat.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <p className="text-4xl font-bold text-slate-100 mb-1 tabular-nums">{stat.value}</p>
                <p className="text-slate-300 font-medium text-sm">{stat.title}</p>
                <p className="text-slate-500 text-xs mt-1">{stat.description}</p>
              </button>
            ))}
          </div>

          {/* Execution readout — the headline number for a QA tool is the
              verdict split, not how many cases were generated. */}
          <ExecutionSummary cases={testCaseList} compact />

          {/* Two column layout: Workflow + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Workflow Steps */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-slate-100">Quick Workflow</h2>
              </div>
              <div className="space-y-2">
                {workflowSteps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(step.href)}
                    className="w-full flex items-center gap-4 p-4 bg-slate-700/40 hover:bg-slate-700/80 border border-slate-700/30 hover:border-slate-600 rounded-xl transition-all duration-200 text-left group"
                  >
                    <span className="text-2xl">{step.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${step.color}`}>{step.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5 truncate">{step.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Test Plans */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-100">Recent Test Plans</h2>
                </div>
                <button
                  onClick={() => router.push('/test-plans')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {recentTestPlans.length > 0 ? (
                <div className="space-y-2">
                  {recentTestPlans.map((plan: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => router.push('/test-plans')}
                      className="w-full flex items-center gap-3 p-3 bg-slate-700/40 hover:bg-slate-700/80 border border-slate-700/30 hover:border-indigo-700/50 rounded-lg transition-all duration-200 text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate">
                          {plan.storyTitle || plan.project_name || 'Test Plan'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {plan.storyKey || plan.version || '—'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <FileText className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm mb-3">No test plans yet</p>
                  <button
                    onClick={() => router.push('/test-plans')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Generate First Plan →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Test Cases — Full width */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-slate-100">Recent Test Cases</h2>
              </div>
              <button
                onClick={() => router.push('/test-cases')}
                className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentTestCases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentTestCases.map((tc: any, i: number) => {
                  const tcId = tc.tid || tc.id || `TC-${i + 1}`;
                  const tcName = tc.scenario || tc.name || 'Test Case';
                  return (
                    <button
                      key={i}
                      onClick={() => router.push('/test-cases')}
                      className="flex items-start gap-3 p-4 bg-slate-700/40 hover:bg-slate-700/80 border border-slate-700/30 hover:border-green-700/50 rounded-xl text-left transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-blue-400 mb-1">{tcId}</p>
                        <p className="text-slate-200 text-sm font-medium truncate leading-snug">{tcName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <PriorityBadge priority={tc.priority} />
                          <StatusBadge status={tc.status} />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 self-center flex-shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <CheckCircle className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm mb-3">No test cases yet</p>
                <button
                  onClick={() => router.push('/test-cases')}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Generate Test Cases →
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
