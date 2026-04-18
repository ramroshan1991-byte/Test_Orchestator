'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { useAppStore } from '@/store/appStore';
import { Zap, TrendingUp, CheckCircle, Code } from 'lucide-react';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function Dashboard() {
  const { testPlans, testCases, codeHistory } = useAppStore();
  const [stats, setStats] = useState<DashboardCard[]>([]);

  useEffect(() => {
    const testPlanCount = Object.keys(testPlans).length;
    const testCaseCount = Object.values(testCases || {}).flat().length;
    const codeCount = Object.keys(codeHistory).length;

    setStats([
      {
        title: 'Test Plans',
        value: testPlanCount,
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'blue',
      },
      {
        title: 'Test Cases',
        value: testCaseCount,
        icon: <CheckCircle className="w-6 h-6" />,
        color: 'green',
      },
      {
        title: 'Generated Code',
        value: codeCount,
        icon: <Code className="w-6 h-6" />,
        color: 'purple',
      },
    ]);
  }, [testPlans, testCases, codeHistory]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-900 to-blue-800 border-blue-700';
      case 'green':
        return 'from-green-900 to-green-800 border-green-700';
      case 'purple':
        return 'from-purple-900 to-purple-800 border-purple-700';
      default:
        return 'from-slate-800 to-slate-700 border-slate-600';
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          </div>
          <p className="text-slate-400">
            Welcome back! Here's your QA automation overview.
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className={`bg-gradient-to-br ${getColorClasses(
                  stat.color
                )} border rounded-xl p-6 transition-transform hover:scale-105`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-200 font-medium">{stat.title}</h3>
                  <div className="text-slate-300 opacity-70">{stat.icon}</div>
                </div>
                <p className="text-4xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Getting Started
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg">
                <span className="text-2xl">1️⃣</span>
                <div>
                  <p className="font-medium text-slate-100">Connect to Jira</p>
                  <p className="text-sm text-slate-400">
                    Import your Jira stories to get started with test generation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg">
                <span className="text-2xl">2️⃣</span>
                <div>
                  <p className="font-medium text-slate-100">Generate Test Plans</p>
                  <p className="text-sm text-slate-400">
                    Use AI to automatically create comprehensive test plans
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg">
                <span className="text-2xl">3️⃣</span>
                <div>
                  <p className="font-medium text-slate-100">Generate Test Cases</p>
                  <p className="text-sm text-slate-400">
                    Create detailed test cases with AI assistance
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-700 rounded-lg">
                <span className="text-2xl">4️⃣</span>
                <div>
                  <p className="font-medium text-slate-100">Generate Code</p>
                  <p className="text-sm text-slate-400">
                    Generate automated test code in your preferred framework
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Platform Features
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">🤖</p>
                <p className="text-sm font-medium text-slate-200 mt-2">
                  AI-Powered Generation
                </p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-2xl font-bold text-green-400">✅</p>
                <p className="text-sm font-medium text-slate-200 mt-2">
                  Custom Prompts
                </p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">📊</p>
                <p className="text-sm font-medium text-slate-200 mt-2">
                  Code History Tracking
                </p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-2xl font-bold text-orange-400">⚙️</p>
                <p className="text-sm font-medium text-slate-200 mt-2">
                  Multi-Framework Support
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
