import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, RotateCcw } from 'lucide-react';
import { useStore } from '../store/appStore';

export function CustomPromptMode({ darkMode }) {
  const { customPromptMode, customPrompts, toggleCustomPromptMode, setCustomPrompt } = useStore();
  const [expandedSection, setExpandedSection] = useState(null);
  const [editedPrompts, setEditedPrompts] = useState(customPrompts);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    Object.entries(editedPrompts).forEach(([key, value]) => setCustomPrompt(key, value));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className="space-y-4">
      <div className={`p-6 rounded-xl border flex items-center justify-between ${cardClass}`}>
        <div>
          <h3 className={`text-xl font-bold ${textClass}`}>Custom Prompt Mode</h3>
          <p className={`text-sm ${subTextClass}`}>Tailor AI behavior for specific testing needs</p>
        </div>
        <button
          onClick={toggleCustomPromptMode}
          className={`px-4 py-2 rounded-lg font-bold transition-all ${customPromptMode ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          {customPromptMode ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {customPromptMode && (
        <div className={`p-6 rounded-xl border space-y-4 ${cardClass}`}>
          {['testPlan', 'testCase', 'codeGen'].map((type) => (
            <div key={type} className="space-y-2">
              <label className={`block text-xs font-bold uppercase ${subTextClass}`}>{type} Prompt</label>
              <textarea
                value={editedPrompts[type] || ''}
                onChange={(e) => setEditedPrompts({ ...editedPrompts, [type]: e.target.value })}
                className={`w-full p-3 rounded-lg border outline-none font-mono text-sm ${darkMode ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                rows="3"
              />
            </div>
          ))}
          <button onClick={handleSave} className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">
            {saved ? 'Settings Saved' : 'Save Custom Prompts'}
          </button>
        </div>
      )}
    </div>
  );
}
