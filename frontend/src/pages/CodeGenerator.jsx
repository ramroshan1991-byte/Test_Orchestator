import React, { useState, useMemo } from 'react';
import { Code2, ChevronRight, Copy, Download, AlertCircle, CheckCircle, RefreshCw, Zap, Clock } from 'lucide-react';
import { useStore } from '../store/appStore';
import { codeGeneratorAPI } from '../utils/api';

function CodeGenerator({ onShowToast, onNavigate, darkMode }) {
  const { testCases = {}, codeHistory = {}, saveCodeToHistory } = useStore();
  const testCasesArray = useMemo(() => Object.values(testCases || {}).flat(), [testCases]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [framework, setFramework] = useState('');
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const frameworks = [
    { id: 'selenium-java', name: 'Selenium + Java', description: 'WebDriver automation with Java', icon: '☕' },
    { id: 'playwright-js', name: 'Playwright + JS', description: 'Modern cross-browser automation', icon: '🎭' },
    { id: 'cypress-js', name: 'Cypress + JS', description: 'Fast, reliable testing for web', icon: '🌳' },
  ];

  const handleGenerateCode = async () => {
    if (!framework || !selectedTestCase) {
      onShowToast('Please select framework and test case', 'error');
      return;
    }
    setLoading(true);
    try {
      const response = await codeGeneratorAPI.generateCode(selectedTestCase, framework, {});
      setGeneratedCode(response.code);
      saveCodeToHistory(selectedTestCase.id, framework, response.code);
      onShowToast('Code generated!', 'success');
      setCurrentStep(4);
    } catch (error) {
      onShowToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm';

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Code Generator</h1>
        <p className={subTextClass}>Generate automation code from test cases</p>
      </div>

      <div className="flex items-center justify-between">
        {[1, 2, 3].map(step => (
          <div key={step} className={`flex-1 flex items-center gap-2 ${step < 3 ? 'border-b-2' : ''} ${currentStep >= step ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step}
            </div>
            <span className={`text-sm font-bold ${currentStep >= step ? 'text-blue-500' : 'text-gray-400'}`}>
              {step === 1 ? 'Framework' : step === 2 ? 'Test Case' : 'Result'}
            </span>
            <div className="flex-1" />
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {frameworks.map(fw => (
            <div key={fw.id} onClick={() => { setFramework(fw.id); setCurrentStep(2); }} className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500 ${framework === fw.id ? 'border-blue-600 bg-blue-500/5' : cardClass}`}>
              <div className="text-4xl mb-4">{fw.icon}</div>
              <h3 className={`text-xl font-bold mb-2 ${textClass}`}>{fw.name}</h3>
              <p className={`text-sm ${subTextClass}`}>{fw.description}</p>
            </div>
          ))}
        </div>
      )}

      {currentStep === 2 && (
        <div className={`p-6 rounded-xl border ${cardClass}`}>
          <h2 className={`text-xl font-bold mb-4 ${textClass}`}>Select Test Case</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCasesArray.length > 0 ? testCasesArray.map(tc => (
              <div key={tc.id} onClick={() => setSelectedTestCase(tc)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTestCase?.id === tc.id ? 'border-blue-600 bg-blue-500/5' : darkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                <p className="font-mono text-xs text-blue-500 font-bold mb-1">{tc.id}</p>
                <p className={`font-bold ${textClass}`}>{tc.title}</p>
              </div>
            )) : <p className="col-span-2 text-center py-10 text-gray-500">No test cases available. Generate some first!</p>}
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={() => setCurrentStep(1)} className={`flex-1 p-3 rounded-lg border font-bold ${textClass}`}>Back</button>
            <button onClick={handleGenerateCode} disabled={!selectedTestCase || loading} className="flex-1 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className={`p-6 rounded-xl border ${cardClass}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${textClass}`}>Generated Code</h2>
            <button onClick={() => { setCurrentStep(1); setGeneratedCode(''); }} className="text-blue-500 font-bold text-sm">Reset</button>
          </div>
          <div className={`p-4 rounded-lg font-mono text-sm overflow-x-auto ${darkMode ? 'bg-slate-900 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
            <pre>{generatedCode}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeGenerator;
