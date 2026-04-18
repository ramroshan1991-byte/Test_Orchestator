import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Eye, EyeOff, Bell, Lock, Database, Zap } from 'lucide-react';
import { AIProviderStatus } from '../components/AIProviderStatus';
import { CustomPromptMode } from '../components/CustomPromptMode';

function Settings({ onShowToast, onNavigate, darkMode }) {
  const [settings, setSettings] = useState({
    llmProvider: 'openai',
    llmModel: 'gpt-4',
    emailNotifications: true,
    slackNotifications: false,
    autoSync: true,
  });

  const [edited, setEdited] = useState(false);

  const handleToggle = (field) => {
    setSettings({ ...settings, [field]: !settings[field] });
    setEdited(true);
  };

  const handleSave = () => {
    onShowToast('Settings saved successfully!', 'success');
    setEdited(false);
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm';
  const inputClass = darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Settings</h1>
          <p className={subTextClass}>Configure your application preferences</p>
        </div>
        {edited && (
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
            <Save size={20} />
            Save Changes
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className={`p-6 rounded-xl border ${cardClass}`}>
          <div className="flex items-center gap-3 mb-6">
            <Database size={24} className="text-purple-500" />
            <h2 className={`text-xl font-bold ${textClass}`}>AI Configuration</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-bold mb-2 ${subTextClass}`}>LLM Provider</label>
              <select className={`w-full p-2 rounded-lg border outline-none ${inputClass}`}>
                <option>OpenAI</option>
                <option>Anthropic</option>
                <option>Google Gemini</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${subTextClass}`}>Model</label>
              <select className={`w-full p-2 rounded-lg border outline-none ${inputClass}`}>
                <option>GPT-4o</option>
                <option>Claude 3.5 Sonnet</option>
                <option>Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${cardClass}`}>
          <div className="flex items-center gap-3 mb-6">
            <Bell size={24} className="text-yellow-500" />
            <h2 className={`text-xl font-bold ${textClass}`}>Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className={`font-bold ${textClass}`}>Email Notifications</p>
                <p className={`text-sm ${subTextClass}`}>Receive test reports via email</p>
              </div>
              <input type="checkbox" checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} className="w-5 h-5 accent-blue-600" />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className={`font-bold ${textClass}`}>Slack Notifications</p>
                <p className={`text-sm ${subTextClass}`}>Push updates to Slack channels</p>
              </div>
              <input type="checkbox" checked={settings.slackNotifications} onChange={() => handleToggle('slackNotifications')} className="w-5 h-5 accent-blue-600" />
            </label>
          </div>
        </div>

        <AIProviderStatus darkMode={darkMode} />
        <CustomPromptMode darkMode={darkMode} />

        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
          <h2 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-bold">Clear All Local Data</button>
            <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm font-bold">Reset Backend Config</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
