'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  FileText,
  CheckSquare,
  Code,
  Settings,
  Briefcase,
  Home,
  Sun,
  Moon
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, href: '/' },
  { id: 'jiraConnect', label: 'Jira Connect', icon: <Briefcase className="w-5 h-5" />, href: '/jira-connect' },
  { id: 'testPlans', label: 'Test Plans', icon: <FileText className="w-5 h-5" />, href: '/test-plans' },
  { id: 'testCases', label: 'Test Cases', icon: <CheckSquare className="w-5 h-5" />, href: '/test-cases' },
  { id: 'codeGenerator', label: 'Code Generator', icon: <Code className="w-5 h-5" />, href: '/code-generator' },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/settings' },
];

interface SidebarProps {
  onNavigate?: (tabId: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100">Test Orchestrator</h1>
            <p className="text-xs text-slate-400">AI-Powered QA</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => onNavigate?.(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 space-y-4">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-3 py-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
        >
          <span className="text-sm font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
        <div className="space-y-1">
          <p className="text-xs text-slate-500">v2.0.0</p>
          <p className="text-xs text-slate-500">Next.js + React 19</p>
        </div>
      </div>
    </aside>
  );
}
