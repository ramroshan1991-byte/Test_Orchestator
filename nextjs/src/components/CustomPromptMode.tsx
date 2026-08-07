'use client';

import React, { useState } from 'react';
import { ChevronDown, RotateCcw, Save } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export function CustomPromptMode() {
  const {
    customPromptMode,
    customPrompts,
    toggleCustomPromptMode,
    setCustomPrompt,
    resetCustomPrompts,
  } = useAppStore();

  const [expandedSection, setExpandedSection] = useState<string>('');
  const [saved, setSaved] = useState(false);

  const handlePromptChange = (
    promptType: 'testPlan' | 'testCase' | 'codeGen',
    value: string
  ) => {
    setCustomPrompt(promptType, value);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      id: 'testPlan',
      label: 'Test Plan Generation',
      key: 'testPlan' as const,
      defaultPrompt: 'Generate a comprehensive test plan based on the requirements',
    },
    {
      id: 'testCase',
      label: 'Test Case Generation',
      key: 'testCase' as const,
      defaultPrompt:
        'Create detailed test cases with steps, expected results, and acceptance criteria',
    },
    {
      id: 'codeGen',
      label: 'Code Generation',
      key: 'codeGen' as const,
      defaultPrompt: 'Generate automated test code using the specified framework',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            AI Prompt Customization
          </h3>
          <p className="text-sm text-slate-400">
            {customPromptMode ? 'Using custom prompts' : 'Using default prompts'}
          </p>
        </div>
        <button
          onClick={toggleCustomPromptMode}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            customPromptMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
          }`}
        >
          {customPromptMode ? '📝 Custom' : '🤖 Default'}
        </button>
      </div>

      {customPromptMode && (
        <>
          {/* Expandable Sections */}
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="card overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === section.id ? '' : section.id
                    )
                  }
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
                >
                  <span className="font-medium text-slate-100">
                    {section.label}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      expandedSection === section.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded Content */}
                {expandedSection === section.id && (
                  <div className="px-4 py-4 border-t border-slate-700 space-y-3">
                    <textarea
                      value={customPrompts[section.key]}
                      onChange={(e) =>
                        handlePromptChange(section.key, e.target.value)
                      }
                      rows={6}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder={section.defaultPrompt}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Character count:{' '}
                        <span className="text-slate-200 font-medium">
                          {customPrompts[section.key].length}
                        </span>
                      </span>
                      <button
                        onClick={() =>
                          setCustomPrompt(section.key, section.defaultPrompt)
                        }
                        className="text-slate-300 hover:text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button
              onClick={() => {
                resetCustomPrompts();
                setExpandedSection('');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>

            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                  ✓ Saved!
                </span>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
