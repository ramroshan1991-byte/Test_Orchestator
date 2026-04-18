'use client';

import React, { useState } from 'react';
import { SettingsIcon, Save } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AIProviderStatus } from '@/components/AIProviderStatus';
import { CustomPromptMode } from '@/components/CustomPromptMode';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';

export default function SettingsPage() {
  const { clearData } = useAppStore();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    apiEndpoint: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api',
    apiKey: '••••••••••••••••',
    apiKeyVisible: false,

    llmProvider: 'openai',
    llmModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,

    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: '',

    defaultTimeout: 30,
    retryAttempts: 3,
    parallelExecutions: 4,

    darkMode: true,
    autoSync: true,
    syncInterval: 60,
  });

  const [edited, setEdited] = useState(false);

  const handleInputChange = (field: keyof typeof settings, value: any) => {
    setSettings({ ...settings, [field]: value });
    setEdited(true);
  };

  const handleToggle = (field: keyof typeof settings) => {
    const currentValue = settings[field];
    if (typeof currentValue === 'boolean') {
      handleInputChange(field, !currentValue);
    }
  };

  const handleSave = () => {
    showToast('Settings saved successfully!', 'success');
    setEdited(false);
  };

  const handleClearData = () => {
    if (confirm('Are you sure? This will clear all data including test plans, test cases, and code history.')) {
      clearData();
      showToast('All data cleared', 'info');
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
                <p className="text-slate-400">Configure your Test Orchestrator preferences</p>
              </div>
            </div>
            {edited && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl space-y-6">
            {/* API Configuration */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">⚡</span>
                <h2 className="text-xl font-bold text-slate-100">API Configuration</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    value={settings.apiEndpoint}
                    onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={settings.apiKeyVisible ? 'text' : 'password'}
                      value={settings.apiKey}
                      onChange={(e) => handleInputChange('apiKey', e.target.value)}
                      className="input flex-1"
                    />
                    <button
                      onClick={() =>
                        handleToggle('apiKeyVisible')
                      }
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                    >
                      {settings.apiKeyVisible ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* LLM Configuration */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🤖</span>
                <h2 className="text-xl font-bold text-slate-100">LLM Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    LLM Provider
                  </label>
                  <select
                    value={settings.llmProvider}
                    onChange={(e) => handleInputChange('llmProvider', e.target.value)}
                    className="input"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="local">Local LLM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Model
                  </label>
                  <select
                    value={settings.llmModel}
                    onChange={(e) => handleInputChange('llmModel', e.target.value)}
                    className="input"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5">GPT-3.5</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Temperature ({settings.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔔</span>
                <h2 className="text-xl font-bold text-slate-100">Notifications</h2>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-200">Email Notifications</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.slackNotifications}
                    onChange={() => handleToggle('slackNotifications')}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-200">Slack Notifications</span>
                </label>

                {settings.slackNotifications && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.webhookUrl}
                      onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="input"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Test Execution Settings */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-xl font-bold text-slate-100">Test Execution</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Default Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultTimeout}
                    onChange={(e) =>
                      handleInputChange('defaultTimeout', parseInt(e.target.value))
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) =>
                      handleInputChange('retryAttempts', parseInt(e.target.value))
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Parallel Executions
                  </label>
                  <input
                    type="number"
                    value={settings.parallelExecutions}
                    onChange={(e) =>
                      handleInputChange('parallelExecutions', parseInt(e.target.value))
                    }
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* AI Provider Status */}
            <div className="card p-6">
              <AIProviderStatus />
            </div>

            {/* Custom Prompt Mode */}
            <div className="card p-6">
              <CustomPromptMode />
            </div>

            {/* Data Management */}
            <div className="card p-6 border-red-700/30 bg-red-900/10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🗑️</span>
                <h2 className="text-xl font-bold text-slate-100">Data Management</h2>
              </div>

              <p className="text-slate-300 mb-4 text-sm">
                Clear all stored data including test plans, test cases, and code history.
                This action cannot be undone.
              </p>

              <button
                onClick={handleClearData}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear All Data
              </button>
            </div>

            {/* About */}
            <div className="card p-6 text-center pb-12">
              <p className="text-slate-400 text-sm">
                Test Orchestrator v2.0.0 • Next.js + React 19
              </p>
              <p className="text-slate-500 text-xs mt-2">
                © 2026. AI-powered QA automation platform.
              </p>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
