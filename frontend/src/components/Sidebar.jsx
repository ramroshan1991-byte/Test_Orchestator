import React from 'react';
import {
  Home,
  Link2,
  FileText,
  CheckSquare,
  Code2,
  Settings,
  LogOut,
} from 'lucide-react';

function Sidebar({ onNavigate, currentPage, darkMode }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'jira-connect', icon: Link2, label: 'Jira Connect' },
    { id: 'test-plans', icon: FileText, label: 'Test Plans' },
    { id: 'test-cases', icon: CheckSquare, label: 'Test Cases' },
    { id: 'code-generator', icon: Code2, label: 'Code Generator' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`w-64 border-r flex flex-col h-screen transition-colors duration-200 ${
      darkMode
        ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700'
        : 'bg-gradient-to-b from-gray-100 to-gray-50 border-gray-200'
    }`}>
      {/* Logo */}
      <div className={`p-6 border-b transition-colors duration-200 ${
        darkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Code2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Test Orchestrator</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>QA Automation Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : darkMode
                  ? 'text-gray-300 hover:bg-slate-800'
                  : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t transition-colors duration-200 space-y-2 ${
        darkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          darkMode
            ? 'text-gray-300 hover:bg-slate-800'
            : 'text-gray-600 hover:bg-gray-200'
        }`}>
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
        <p className={`text-xs px-4 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>v1.0.0 • AI Powered QA</p>
      </div>
    </div>
  );
}

export default Sidebar;
