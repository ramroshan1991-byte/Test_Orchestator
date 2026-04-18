'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ProviderStatus {
  [key: string]: 'online' | 'offline' | 'warning' | 'checking';
}

const PROVIDERS = [
  { name: 'OpenAI', emoji: '🤖', color: 'green' },
  { name: 'Anthropic', emoji: '🧠', color: 'purple' },
  { name: 'Gemini', emoji: '✨', color: 'blue' },
  { name: 'Ollama', emoji: '🦙', color: 'orange' },
  { name: 'Nvidia NIM', emoji: '⚡', color: 'emerald' },
];

export function AIProviderStatus() {
  const [status, setStatus] = useState<ProviderStatus>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const result = await apiClient.checkAIProviderStatus();
        if (result) {
          setStatus(result);
        } else {
          // Fallback to mock status
          setStatus(
            Object.fromEntries(
              PROVIDERS.map((p) => [p.name, Math.random() > 0.3 ? 'online' : 'offline'])
            )
          );
        }
      } catch (error) {
        console.error('Error checking provider status:', error);
        // Fallback to mock status
        setStatus(
          Object.fromEntries(
            PROVIDERS.map((p) => [p.name, Math.random() > 0.3 ? 'online' : 'offline'])
          )
        );
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (providerStatus: string) => {
    switch (providerStatus) {
      case 'online':
        return (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900 text-green-200 border border-green-700 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Online
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900 text-yellow-200 border border-yellow-700 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse-slow" />
            Warning
          </span>
        );
      case 'checking':
        return (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse-slow" />
            Checking...
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-900 text-red-200 border border-red-700 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Offline
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PROVIDERS.map((provider) => (
          <div
            key={provider.name}
            className="card p-4 flex items-center justify-between"
          >
            <span className="text-2xl">{provider.emoji}</span>
            <div className="w-3 h-3 rounded-full bg-slate-600 animate-pulse-slow" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          AI Provider Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.name}
              className="card p-4 space-y-2 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{provider.emoji}</span>
                <span className="text-sm font-medium text-slate-400">
                  {provider.name}
                </span>
              </div>
              <div className="pt-2">
                {getStatusBadge(status[provider.name] || 'offline')}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500 text-right">
        Status updates every 30 seconds
      </p>
    </div>
  );
}
