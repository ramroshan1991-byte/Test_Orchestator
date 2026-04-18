import React, { useState, useEffect } from 'react';

export function AIProviderStatus({ darkMode }) {
  const [providers, setProviders] = useState({
    openai: { status: 'checking', name: 'OpenAI', emoji: '🤖' },
    anthropic: { status: 'checking', name: 'Anthropic', emoji: '🧠' },
    gemini: { status: 'checking', name: 'Google Gemini', emoji: '✨' },
    ollama: { status: 'checking', name: 'Local Ollama', emoji: '🦙' },
  });

  useEffect(() => {
    const checkStatus = async () => {
      // Mock status for demo
      setTimeout(() => {
        setProviders(prev => ({
          ...prev,
          openai: { ...prev.openai, status: 'online' },
          anthropic: { ...prev.anthropic, status: 'online' },
          gemini: { ...prev.gemini, status: 'online' },
          ollama: { ...prev.ollama, status: 'offline' },
        }));
      }, 1000);
    };
    checkStatus();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'offline': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20 animate-pulse';
    }
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className={`p-6 rounded-xl border ${cardClass}`}>
      <h2 className={`text-xl font-bold mb-4 ${textClass}`}>AI Systems Status</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(providers).map((provider) => (
          <div key={provider.name} className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${getStatusColor(provider.status)}`}>
            <span className="text-2xl">{provider.emoji}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{provider.name}</span>
            <span className="text-[10px] font-black">{provider.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
