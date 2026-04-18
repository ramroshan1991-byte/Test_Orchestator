import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, GitBranch, Download, FileText } from 'lucide-react';
import { useStore } from '../store/appStore';
import { testPlanAPI } from '../utils/api';
import { exportToMarkdown, exportToJSON, generateTestPlanMarkdown, exportToPDF, generateCombinedTestPlanMarkdown, fillTestPlanTemplate } from '../utils/exportUtils';

function TestPlans({ onShowToast, onNavigate, darkMode }) {
  const { stories = [], testPlans: storedTestPlans = {}, generateTestPlan } = useStore();
  const [testPlans, setTestPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    storyId: '',
  });
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [generatingPlanId, setGeneratingPlanId] = useState(null);

  // Update test plans from store - convert object to array
  useEffect(() => {
    const plansArray = Object.values(storedTestPlans);
    setTestPlans(plansArray);
  }, [storedTestPlans]);

  const handleGeneratePlanFromStory = async (story) => {
    setGeneratingPlanId(story.id);
    try {
      // Use the store's generateTestPlan method
      generateTestPlan(story.id, story);
      onShowToast(`Test plan generated for ${story.title}!`, 'success');
    } catch (error) {
      onShowToast(`Error generating test plan: ${error.message}`, 'error');
    } finally {
      setGeneratingPlanId(null);
    }
  };

  const handleAddPlan = () => {
    if (!formData.name.trim()) {
      onShowToast('Please enter a test plan name', 'error');
      return;
    }

    const storyId = formData.storyId || `manual-${Date.now()}`;
    const newPlan = {
      id: Date.now().toString(),
      name: formData.name,
      title: formData.name,
      description: formData.description,
      status: 'Active',
      testCases: 0,
      coverage: 0,
      dueDate: new Date().toISOString().split('T')[0],
      created: new Date().toISOString().split('T')[0],
      objective: `Ensure ${formData.name.toLowerCase()} functions correctly`,
      inScope: [],
      outOfScope: [],
      testTypes: [],
      entryCriteria: [],
      exitCriteria: [],
      risks: [],
      storyId: storyId,
    };
    
    // Store the plan in the store
    generateTestPlan(storyId, newPlan);
    setFormData({ name: '', description: '', storyId: '' });
    setShowModal(false);
    onShowToast('Test plan created successfully!', 'success');
  };

  const handleDeletePlan = (id) => {
    setTestPlans(testPlans.filter((plan) => plan.id !== id));
    onShowToast('Test plan deleted', 'info');
  };

  const handleExport = (plan, format) => {
    try {
      if (format === 'markdown') {
        const markdown = fillTestPlanTemplate(plan);
        exportToMarkdown(`${plan.name?.replace(/\s+/g, '_') || 'test_plan'}`, markdown);
        onShowToast(`Exported as Markdown!`, 'success');
      } else if (format === 'json') {
        exportToJSON(`${plan.name?.replace(/\s+/g, '_') || 'test_plan'}`, plan);
        onShowToast(`Exported as JSON!`, 'success');
      } else if (format === 'pdf') {
        const htmlContent = `
          <h1>${plan.name || plan.storyTitle}</h1>
          <p><strong>Objective:</strong> ${plan.objective}</p>
          <h2>In Scope</h2>
          <ul>${(plan.inScope || []).map(item => `<li>${item}</li>`).join('')}</ul>
          <h2>Out of Scope</h2>
          <ul>${(plan.outOfScope || []).map(item => `<li>${item}</li>`).join('')}</ul>
          <h2>Test Types</h2>
          <ul>${(plan.testTypes || []).map(type => `<li>${type}</li>`).join('')}</ul>
        `;
        exportToPDF(plan.name || plan.storyTitle, htmlContent);
        onShowToast(`Exported as PDF!`, 'success');
      }
    } catch (error) {
      onShowToast('Export failed', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-900/30 text-blue-300 border-blue-600';
      case 'Completed':
        return 'bg-green-900/30 text-green-300 border-green-600';
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-600';
    }
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Test Plans</h1>
          <p className={subTextClass}>Manage and organize your test planning</p>
        </div>
        <button
          onClick={() => {
            try {
              const filename = `Combined_Test_Plans_${new Date().toISOString().split('T')[0]}`;
              const markdown = generateCombinedTestPlanMarkdown(testPlans);
              exportToMarkdown(filename, markdown);
              onShowToast('Exported all as combined Markdown!', 'success');
            } catch (error) {
              onShowToast('Export failed', 'error');
            }
          }}
          className="flex items-center gap-2 px-6 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-colors"
        >
          <FileText size={20} />
          Export All as Markdown
        </button>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Plus size={20} />
        New Test Plan
      </button>

      {/* Generate from Stories Section */}
      {stories.length > 0 && (
        <div className={`border rounded-lg p-6 ${cardClass}`}>
          <h2 className={`text-xl font-bold mb-4 ${textClass}`}>Generate Test Plans from Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className={`p-4 rounded-lg border transition-all ${darkMode ? 'bg-slate-700/30 border-slate-600 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-blue-400 font-bold">{story.id}</p>
                    <p className={`font-semibold mt-1 ${textClass}`}>{story.title}</p>
                  </div>
                  <button
                    onClick={() => handleGeneratePlanFromStory(story)}
                    disabled={generatingPlanId === story.id}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white text-sm rounded transition-all flex items-center gap-1"
                  >
                    {generatingPlanId === story.id ? '...' : '+'}
                  </button>
                </div>
                <p className={`text-sm ${subTextClass}`}>{story.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Plans Grid */}
      <div className="grid grid-cols-1 gap-6">
        {testPlans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg overflow-hidden transition-all duration-300 ${cardClass}`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-1 ${textClass}`}>{plan.name || (plan.storyTitle ? `Test Plan: ${plan.storyTitle}` : 'Untitled Plan')}</h3>
                  <p className={`text-sm ${subTextClass}`}>{plan.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className={`rounded-lg p-3 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-1 ${subTextClass}`}>Test Cases</p>
                  <p className={`text-2xl font-bold ${textClass}`}>{plan.testCases}</p>
                </div>
                <div className={`rounded-lg p-3 ${darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-1 ${subTextClass}`}>Coverage</p>
                  <p className={`text-2xl font-bold ${textClass}`}>{plan.coverage}%</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${darkMode ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                >
                  <Eye size={16} />
                  {expandedPlan === plan.id ? 'Collapse' : 'View Details'}
                </button>
                <button 
                  onClick={() => onNavigate('test-cases')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <GitBranch size={16} />
                  Generate Test Cases
                </button>
                <div className="relative group ml-auto">
                  <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    <Download size={16} />
                    Export
                  </button>
                  <div className={`absolute hidden group-hover:block right-0 mt-1 rounded-lg shadow-lg z-50 min-w-40 border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <button onClick={() => handleExport(plan, 'pdf')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700/30 ${textClass}`}>Export as PDF</button>
                    <button onClick={() => handleExport(plan, 'markdown')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700/30 ${textClass}`}>Export as Markdown</button>
                    <button onClick={() => handleExport(plan, 'json')} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700/30 ${textClass}`}>Export as JSON</button>
                  </div>
                </div>
                <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg ml-2">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {expandedPlan === plan.id && (
              <div className={`p-6 border-t ${darkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`text-sm font-bold mb-2 ${textClass}`}>Objective</h4>
                    <p className={`text-sm ${subTextClass}`}>{plan.objective}</p>
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold mb-2 ${textClass}`}>Test Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {(plan.testTypes || []).map((type, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">{type}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`${cardClass} rounded-lg p-8 max-w-md w-full mx-4 border`}>
            <h2 className={`text-2xl font-bold mb-6 ${textClass}`}>Create New Test Plan</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${subTextClass}`}>Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter test plan name"
                  className={`w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${subTextClass}`}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows="4"
                  className={`w-full rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={handleAddPlan} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Create Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestPlans;
