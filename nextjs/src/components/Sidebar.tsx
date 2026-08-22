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
  Moon,
  Menu,
  X,
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

/**
 * Fixed-width on desktop, off-canvas drawer under lg. Previously this was
 * always `w-64` with no responsive behaviour, so on a 390px phone the content
 * column was squeezed to ~130px and wrapped one word per line.
 */
export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Close the drawer whenever navigation happens.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  const panel = (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-100 truncate">Test Orchestrator</h1>
            <p className="text-xs text-slate-400">AI-Powered QA</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 shrink-0"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => onNavigate?.(item.id)}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 space-y-3">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-3 py-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="text-sm font-medium">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          {isDark ? <Sun className="w-4 h-4 text-amber-700 dark:text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </button>
        <p className="text-xs text-slate-500">v2.0.0 · Next.js + React 19</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar — the only nav affordance under lg */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-3 px-4 h-14 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700"
          aria-label="Open navigation"
          aria-expanded={open}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-100 truncate">Test Orchestrator</span>
      </div>

      {/* Scrim */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`bg-slate-800 border-r border-slate-700 flex flex-col w-72 max-w-[85vw] shrink-0
          fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out
          lg:static lg:w-64 lg:max-w-none lg:translate-x-0
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        {panel}
      </aside>
    </>
  );
}
