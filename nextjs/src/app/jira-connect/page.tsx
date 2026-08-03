'use client';

import React, { useState } from 'react';
import { Link2, CheckCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { StoryDetailModal } from '@/components/StoryDetailModal';
import type { JiraStory } from '@/store/appStore';
import Sidebar from '@/components/Sidebar';
import { ToastContainer, useToast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

export default function JiraConnectPage() {
  const [jiraUrl, setJiraUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [email, setEmail] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStories, setFetchingStories] = useState(false);
  const [forceDeepFetch, setForceDeepFetch] = useState(false);
  const [synced, setSynced] = useState<Date | null>(null);
  const [selectedStoryDetail, setSelectedStoryDetail] = useState<JiraStory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { jiraStories, setJiraStories } = useAppStore();
  const { showToast } = useToast();

  const isConnected = jiraUrl && apiToken && email;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraUrl || !apiToken || !email || !projectKey) {
      showToast('Please fill in all fields', 'error');
      console.warn('Missing fields:', { jiraUrl, apiToken, email, projectKey });
      return;
    }

    setLoading(true);
    try {
      console.log('Connecting to Jira:', { jiraUrl, email, projectKey });
      // Test connection to Jira by validating credentials
      const response = await apiClient.fetchStories(
        jiraUrl.trim(), 
        email.trim(), 
        apiToken.trim(), 
        projectKey.trim(), 
        { forceDeepFetch }
      );
      
      if (response) {
        setSynced(new Date());
        showToast('Successfully connected to Jira!', 'success');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Connection error:', errorMsg);
      showToast(
        `Connection failed: ${errorMsg}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStories = async () => {
    if (!isConnected) {
      showToast('Please connect to Jira first', 'error');
      return;
    }

    setFetchingStories(true);
    try {
      console.log('Fetching stories with:', { jiraUrl: jiraUrl.trim(), email: email.trim(), projectKey: projectKey.trim() });
      // Fetch actual stories from Jira API
      const response = await apiClient.fetchStories(
        jiraUrl.trim(), 
        email.trim(), 
        apiToken.trim(), 
        projectKey.trim()
      );
      
      console.log('Stories response:', response);
      
      if (response && response.stories && Array.isArray(response.stories)) {
        const stories = response.stories.map((story: any) => ({
          key: story.key,
          summary: story.summary,
          description: story.description || '',
          priority: story.priority || 'Medium',
          status: story.status || 'To Do',
          assignee: story.assignee || 'Unassigned',
          dueDate: story.dueDate || '',
          acceptanceCriteria: story.acceptanceCriteria || [],
          created: story.additionalDetails?.Created || '',
          updated: story.additionalDetails?.Updated || '',
        }));

        console.log('Processed stories:', stories);
        setJiraStories(stories);
        setSynced(new Date());
        showToast(`Successfully fetched ${stories.length} stories from Jira!`, 'success');
      } else {
        console.warn('Unexpected response structure:', response);
        showToast('No stories found in Jira project', 'warning');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching stories:', errorMsg, error);
      showToast(
        `Error fetching stories: ${errorMsg}`,
        'error'
      );
    } finally {
      setFetchingStories(false);
    }
  };



  const handleViewStory = (story: JiraStory) => {
    setSelectedStoryDetail(story);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'closed':
        return 'status-pass';
      case 'in progress':
      case 'in_progress':
        return 'status-idle';
      case 'to do':
      case 'todo':
        return 'status-idle';
      default:
        return 'status-idle';
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const abs = d.toLocaleDateString();
      const diff = Date.now() - d.getTime();
      const minutes = Math.round(diff / 60000);
      if (minutes < 1) return `${abs} (just now)`;
      if (minutes < 60) return `${abs} (${minutes}m ago)`;
      const hours = Math.round(minutes / 60);
      if (hours < 24) return `${abs} (${hours}h ago)`;
      const days = Math.round(hours / 24);
      return `${abs} (${days}d ago)`;
    } catch (e) {
      return iso;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'highest':
        return 'status-fail';
      case 'high':
        return 'status-block';
      case 'medium':
        return 'status-run';
      case 'low':
      case 'lowest':
        return 'status-idle';
      default:
        return 'status-idle';
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 pt-14 lg:pt-0">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link2 className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-slate-100">Jira Connect</h1>
          </div>
          <p className="text-slate-400">
            Connect to your Jira instance and import stories for test generation
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
          {/* Connection Form */}
          <div className="card p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Jira Configuration</h2>
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Jira Base URL
                </label>
                <input
                  type="url"
                  value={jiraUrl}
                  onChange={(e) => setJiraUrl(e.target.value)}
                  placeholder="https://your-domain.atlassian.net"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  API Token
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Key
                </label>
                <input
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value)}
                  placeholder="e.g., PROJ"
                  className="input"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect to Jira'}
                </button>
                {synced && (
                  <span className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected at {synced.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Fetch Stories */}
          {isConnected && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-100">Import Stories</h2>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={forceDeepFetch} onChange={(e) => setForceDeepFetch(e.target.checked)} className="mr-2" />
                      Force deep fetch
                    </label>
                  
                  {jiraStories.length > 0 && (
                    <button
                      onClick={() => {
                        setJiraStories([]);
                        showToast('Stories cleared', 'info');
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-sm font-medium"
                      title="Clear cached stories"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleFetchStories}
                    disabled={fetchingStories}
                    className="flex items-center gap-2 btn-primary disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {fetchingStories ? 'Fetching...' : 'Fetch Stories'}
                  </button>
                </div>
              </div>

              {jiraStories.length > 0 && (
                <div className="space-y-3">
                  {jiraStories.map((story: any) => (
                    <div
                      key={story.key}
                      className="card-hover p-4 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-blue-400 font-bold">{story.key}</span>
                          <span className={getPriorityColor(story.priority)}>
                            {story.priority}
                          </span>
                          <span className={getStatusColor(story.status)}>
                            {story.status}
                          </span>
                        </div>
                        <p className="text-slate-200 font-medium">{story.summary}</p>
                        <p className="text-slate-400 text-sm mt-2">{story.description}</p>
                        <div className="text-slate-500 text-xs mt-2">
                          {story.additionalDetails?.Type && (
                            <span className="mr-3">Type: {story.additionalDetails.Type}</span>
                          )}
                          {typeof story.points !== 'undefined' && (
                            <span className="mr-3">Points: {story.points}</span>
                          )}
                          {story.created && (
                            <span className="mr-3">Created: {formatDate(story.created)}</span>
                          )}
                          {story.updated && (
                            <span>Updated: {formatDate(story.updated)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewStory(story)}
                        className="ml-4 px-3 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {jiraStories.length === 0 && !fetchingStories && (
                <div className="text-center py-8 text-slate-400">
                  <p className="mb-4">No stories loaded yet. Click "Fetch Stories" to import from Jira.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <StoryDetailModal
        story={selectedStoryDetail}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        baseUrl={jiraUrl}
        email={email}
        apiToken={apiToken}
      />
      <ToastContainer />
    </div>
  );
}
