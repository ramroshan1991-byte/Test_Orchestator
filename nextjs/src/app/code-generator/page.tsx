'use client';

import React, { useState, useMemo } from 'react';
import { Code2, Copy, Download, CheckCircle, Clock } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';
import type { TestCase } from '@/store/appStore';

const FRAMEWORKS = [
  {
    id: 'selenium-java',
    name: 'Selenium + Java',
    description: 'WebDriver automation with Java & TestNG',
    icon: '☕',
  },
  {
    id: 'playwright-js',
    name: 'Playwright + JavaScript',
    description: 'Modern cross-browser automation with JS',
    icon: '🎭',
  },
  {
    id: 'cypress-js',
    name: 'Cypress + JavaScript',
    description: 'Fast, reliable testing for modern web apps',
    icon: '🌳',
  },
  {
    id: 'protractor-js',
    name: 'Protractor + JavaScript',
    description: 'Angular-focused end-to-end testing',
    icon: '⚙️',
  },
];

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

export default function CodeGeneratorPage() {
  const { testCases, codeHistory, saveCodeToHistory, customPromptMode, customPrompts } = useAppStore();
  const { showToast } = useToast();

  const testCasesArray = useMemo(() => Object.values(testCases || {}).flat(), [testCases]);

  // Workflow states
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [activeFrameworkTab, setActiveFrameworkTab] = useState('');
  const [options, setOptions] = useState({
    pageObjectModel: false,
    addAssertions: true,
    addComments: true,
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const testCaseOptions = testCasesArray.length > 0
    ? testCasesArray.map((tc) => ({
        id: tc.id,
        name: tc.id || `TC-UNKN`,
        title: tc.name,
        codeGenerated: codeHistory[tc.id!] !== undefined,
      }))
    : [
        { id: 'demo-1', name: 'TC001', title: 'Verify successful payment processing', codeGenerated: false },
        { id: 'demo-2', name: 'TC002', title: 'User login with valid credentials', codeGenerated: false },
      ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      showToast('Code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      showToast('Failed to copy code', 'error');
    }
  };



  const downloadCode = () => {
    const ext = selectedFramework === 'selenium-java' ? 'java' : 'js';
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    triggerDownload(blob, getFilename(getPrefix('singlecase'), ext));
    showToast('Code downloaded!', 'success');
  };

  const handleGenerateCode = async () => {
    if (!selectedFramework || !selectedTestCase) {
      showToast('Please select framework and test case', 'error');
      return;
    }

    setLoading(true);
    try {
      // Mock code generation
      const mockCode = `// Generated test code for ${selectedTestCase.name}
// Framework: ${selectedFramework}
${customPromptMode ? `// Custom Prompt: ${customPrompts.codeGen.substring(0, 50)}...` : ''}

describe('Test: ${selectedTestCase.name}', () => {
  ${options.pageObjectModel ? '// Page Object Model enabled' : ''}
  ${options.addComments ? '// Auto-generated with comments' : ''}
  
  beforeEach(() => {
    // Setup test
  });

  it('should perform the test', async () => {
    ${options.addAssertions ? '// Assertions: ENABLED' : ''}
    
    // Test Steps
    ${selectedTestCase.steps?.map((step, i) => `// Step ${i + 1}: ${step}`).join('\n    ')}
    
    // Expected Results
    ${selectedTestCase.expectedResults?.map((result, i) => `// Result ${i + 1}: ${result}`).join('\n    ')}
  });

  afterEach(() => {
    // Cleanup
  });
});`;

      setGeneratedCode(mockCode);
      
      if (selectedTestCase.id) {
        saveCodeToHistory(selectedTestCase.id, selectedFramework, mockCode);
      }

      showToast('Code generated successfully!', 'success');
      setCurrentStep(4);
      
      // Auto-set active tab
      if (codeHistory[selectedTestCase.id || '']) {
        const frameworks = Object.keys(codeHistory[selectedTestCase.id || '']);
        setActiveFrameworkTab(frameworks[0] || selectedFramework);
      }
    } catch (error) {
      showToast(
        `Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const getFrameworksWithCode = (): string[] => {
    if (!selectedTestCase?.id || !codeHistory[selectedTestCase.id]) return [];
    return Object.keys(codeHistory[selectedTestCase.id]);
  };

  const frameworksWithHistory = getFrameworksWithCode();

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl font-bold text-slate-100">Code Generator</h1>
          </div>
          <p className="text-slate-400">Generate automated test code in 4 steps</p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex-1">
                <div className="flex items-center">
                  <button
                    onClick={() => step <= currentStep && setCurrentStep(step)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                        : 'bg-slate-700 text-gray-400 cursor-default'
                    }`}
                  >
                    {step <= 3 ? step : '✓'}
                  </button>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-1 ml-3 transition-all ${
                        currentStep > step ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Framework Selection */}
            {currentStep >= 1 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Step 1: Select Framework
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.id}
                      onClick={() => {
                        setSelectedFramework(fw.id);
                        setCurrentStep(2);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedFramework === fw.id
                          ? 'border-blue-600 bg-blue-900/30'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-3xl mb-2">{fw.icon}</div>
                      <h3 className="font-bold text-slate-100">{fw.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{fw.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Test Case Selection */}
            {currentStep >= 2 && selectedFramework && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Step 2: Select Test Case
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testCaseOptions.map((tc) => (
                    <button
                      key={tc.id}
                      onClick={() => {
                        const fullTc = testCasesArray.find((t) => t.id === tc.id);
                        setSelectedTestCase(fullTc || null);
                        setCurrentStep(3);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedTestCase?.id === tc.id
                          ? 'border-green-600 bg-green-900/30'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-blue-400 font-bold">{tc.name}</p>
                          <p className="text-slate-100 font-medium mt-1">{tc.title}</p>
                        </div>
                        {tc.codeGenerated && (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Code Options */}
            {currentStep >= 3 && selectedTestCase && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Step 3: Code Options
                </h2>
                <div className="space-y-4">
                  {Object.entries(options).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setOptions({ ...options, [key]: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-slate-200 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="mt-6 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Code'}
                </button>
              </div>
            )}

            {/* Step 4: Code Output */}
            {currentStep >= 4 && generatedCode && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Step 4: Generated Code
                </h2>

                {/* Framework History Tabs */}
                {frameworksWithHistory.length > 1 && (
                  <div className="flex gap-2 mb-4 pb-4 border-b border-slate-700">
                    {frameworksWithHistory.map((fw) => (
                      <button
                        key={fw}
                        onClick={() => setActiveFrameworkTab(fw)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          activeFrameworkTab === fw || fw === selectedFramework
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {FRAMEWORKS.find((f) => f.id === fw)?.icon} {fw}
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-slate-950 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="text-slate-300 whitespace-pre-wrap break-words">
                    {generatedCode}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      copiedCode
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={downloadCode}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                {frameworksWithHistory.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="w-4 h-4" />
                    Code history available: {frameworksWithHistory.length} framework
                    {frameworksWithHistory.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
