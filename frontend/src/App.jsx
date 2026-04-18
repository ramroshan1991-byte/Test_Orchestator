import React, { useState } from 'react';
import { useStore } from './store/appStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import JiraConnect from './pages/JiraConnect';
import TestPlans from './pages/TestPlans';
import TestCases from './pages/TestCases';
import CodeGenerator from './pages/CodeGenerator';
import Settings from './pages/Settings';
import Toast from './components/Toast';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const demoMode = useStore((state) => state.demoMode);
  const liveUrl = 'http://localhost:3000';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onShowToast={showToast} onNavigate={setCurrentPage} darkMode={darkMode} />;
      case 'jira-connect':
        return <JiraConnect onShowToast={showToast} onNavigate={setCurrentPage} darkMode={darkMode} />;
      case 'test-plans':
        return <TestPlans onShowToast={showToast} onNavigate={setCurrentPage} darkMode={darkMode} />;
      case 'test-cases':
        return <TestCases onShowToast={showToast} onNavigate={setCurrentPage} darkMode={darkMode} />;
      case 'code-generator':
        return <CodeGenerator onShowToast={showToast} onNavigate={setCurrentPage} darkMode={darkMode} />;
      case 'settings':
        return <Settings onShowToast={showToast} onNavigate={setCurrentPage} darkMode={darkMode} />;
      default:
        return <Dashboard onShowToast={showToast} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className={`flex h-screen text-white transition-colors duration-200 ${
      darkMode 
        ? 'bg-gray-900' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Sidebar */}
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} darkMode={darkMode} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          demoMode={demoMode} 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          liveUrl={liveUrl}
        />
        <main className={`flex-1 overflow-auto transition-colors duration-200 ${
          darkMode
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50'
        }`}>
          <div className="p-8">{renderPage()}</div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} darkMode={darkMode} />}

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg flex items-center gap-2 ${
          darkMode 
            ? 'bg-yellow-600 text-white' 
            : 'bg-yellow-400 text-gray-900'
        }`}>
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: 'currentColor'}} />
          Demo Mode Active
        </div>
      )}
    </div>
  );
}

export default App;
