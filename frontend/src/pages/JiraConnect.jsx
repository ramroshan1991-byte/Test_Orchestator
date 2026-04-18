import React, { useState, useEffect, useCallback } from 'react';
import { Link2, CheckCircle, AlertCircle, Settings, RefreshCw, Trash2, Download } from 'lucide-react';
import { useStore } from '../store/appStore';
import { jiraAPI } from '../utils/api';
import { StoryDetailModal } from '../components/StoryDetailModal';

function JiraConnect({ onShowToast, onNavigate, darkMode }) {
  const [jiraUrl, setJiraUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [email, setEmail] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStories, setFetchingStories] = useState(false);
  const [synced, setSynced] = useState(null);

  // Zustand store
  const { stories, selectedStories, setStories, selectStory } = useStore();
  const jiraConfig = useStore((state) => state.jiraConfig);
  const setJiraConfig = useStore((state) => state.setJiraConfig);
  const demoMode = useStore((state) => state.demoMode);
  const toggleDemoMode = useStore((state) => state.toggleDemoMode);

  const isConnected = jiraConfig.connected;

  const handleFetchStories = useCallback(async (forcedConfig = null) => {
    const configToUse = forcedConfig || jiraConfig;
    const isDemo = demoMode || (!configToUse.connected && !forcedConfig);

    setFetchingStories(true);
    try {
      if (isDemo) {
        const mockStories = [
          { id: 'D-1001', title: 'User can login with valid credentials', description: 'Allow users to authenticate using email and password', priority: 'High', points: 3, status: 'To Do', assignee: 'QA Team' },
          { id: 'D-1002', title: 'Display user profile after login', description: 'Show profile page with user details', priority: 'Medium', points: 2, status: 'In Progress', assignee: 'Frontend Team' },
          { id: 'D-1003', title: 'Forgot password functionality', description: 'Allow users to reset password via email link', priority: 'High', points: 5, status: 'To Do', assignee: 'Backend Team' },
        ];
        setStories(mockStories);
        setSynced(new Date());
        onShowToast('Loaded demo stories', 'info');
      } else {
        const fetched = await jiraAPI.getStories(
          configToUse.projectKey, 
          null, 
          configToUse.baseURL, 
          configToUse.email, 
          configToUse.apiToken
        );
        
        const rawStories = Array.isArray(fetched) ? fetched : fetched?.stories || [];
        
        // Map backend fields (key/summary) to frontend fields (id/title)
        const mappedStories = rawStories.map(s => ({
          ...s,
          id: s.id || s.key,
          title: s.title || s.summary || s.name,
          description: s.description || 'No description provided'
        }));

        setStories(mappedStories);
        setSynced(new Date());
        onShowToast(`Fetched ${mappedStories.length} stories from Jira`, 'success');
      }
    } catch (error) {
      onShowToast(`Error fetching stories: ${error.message}`, 'error');
    } finally {
      setFetchingStories(false);
    }
  }, [demoMode, jiraConfig, setStories, onShowToast]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!jiraUrl || !apiToken || !email || !projectKey) {
      onShowToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await jiraAPI.testConnection(jiraUrl, email, apiToken);
      if (result.success) {
        setJiraConfig({ baseURL: jiraUrl, email, apiToken, projectKey, connected: true });
        setSynced(new Date());
        onShowToast('Successfully connected to Jira!', 'success');
      } else {
        onShowToast(`Connection failed: ${result.error}`, 'error');
      }
    } catch (error) {
      onShowToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm';
  const inputClass = darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Jira Integration</h1>
          <p className={subTextClass}>Connect to Jira and sync your requirements</p>
        </div>
        <button
          onClick={toggleDemoMode}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${demoMode ? 'bg-yellow-600 text-black' : 'bg-blue-600 text-white'}`}
        >
          {demoMode ? 'Switch to Live' : 'Try Demo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-lg border ${cardClass}`}>
            <h2 className={`text-xl font-bold mb-6 ${textClass}`}>Connection Settings</h2>
            {!isConnected && !demoMode ? (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${subTextClass}`}>Jira URL</label>
                    <input type="url" value={jiraUrl} onChange={(e) => setJiraUrl(e.target.value)} className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${inputClass}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${subTextClass}`}>Project Key</label>
                    <input type="text" value={projectKey} onChange={(e) => setProjectKey(e.target.value.toUpperCase())} className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${inputClass}`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${subTextClass}`}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${inputClass}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${subTextClass}`}>API Token</label>
                    <input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${inputClass}`} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium transition-all">
                  {loading ? 'Connecting...' : 'Connect to Jira'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg flex items-center justify-between ${darkMode ? 'bg-green-900/10 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" />
                    <div>
                      <p className={`font-bold ${textClass}`}>{demoMode ? 'Demo Mode Active' : 'Connected to Jira'}</p>
                      <p className={`text-sm ${subTextClass}`}>{demoMode ? 'Using sample data' : `${jiraConfig.baseURL} (${jiraConfig.projectKey})`}</p>
                    </div>
                  </div>
                  <button onClick={() => { setStories([]); setJiraConfig({ connected: false }); }} className="text-red-500 hover:underline text-sm font-bold">Disconnect</button>
                </div>
                <button onClick={() => handleFetchStories()} disabled={fetchingStories} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                  {fetchingStories ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                  Fetch User Stories
                </button>
              </div>
            )}
          </div>

          {stories.length > 0 && (
            <div className={`p-6 rounded-lg border ${cardClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${textClass}`}>User Stories ({stories.length})</h2>
                <span className={`text-xs ${subTextClass}`}>{selectedStories.length} Selected</span>
              </div>
              <div className="space-y-3">
                {stories.map((story) => (
                  <div 
                    key={story.id} 
                    className={`p-4 rounded-lg border flex gap-3 transition-colors ${selectedStories.includes(story.id) ? (darkMode ? 'bg-blue-900/20 border-blue-500/50' : 'bg-blue-50 border-blue-300') : (darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200')}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedStories.includes(story.id)} 
                      onChange={() => selectStory(story.id)} 
                      className="w-4 h-4 mt-1 accent-blue-600 cursor-pointer" 
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => selectStory(story.id)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-400 font-bold text-sm font-mono">{story.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${story.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {story.priority}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${darkMode ? 'bg-slate-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                          {story.status}
                        </span>
                      </div>
                      <h3 className={`font-bold ${textClass}`}>{story.title}</h3>
                      <p className={`text-sm ${subTextClass} line-clamp-2`}>{story.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedStories.length > 0 && (
                <button 
                  onClick={() => { onShowToast('Forwarding to Test Plans...', 'info'); onNavigate('test-plans'); }}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold shadow-lg shadow-green-600/20 transform transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Generate Test Plans for {selectedStories.length} Selected
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JiraConnect;
