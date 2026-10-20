import React, { useState } from 'react';
import { Menu, Sparkles, Play, Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemePreference } from '../context/ThemeContext';

interface TopHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
}) => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Command Center';
      case 'setup':
        return 'Interview Setup';
      case 'room':
        return 'Live Interview Room';
      case 'results':
        return 'Performance Intelligence & Evaluation';
      case 'coach':
        return 'AI Interview Coach';
      case 'resume':
        return 'Resume Intelligence & ATS Scanner';
      case 'job':
        return 'Job Description Analyzer';
      case 'rag':
        return 'RAG Knowledge Vault';
      case 'analytics':
        return 'Analytics & Mastery Trends';
      case 'history':
        return 'Interview History';
      case 'learning':
        return '7-Day Personalized Roadmap';
      case 'coding':
        return 'Technical Coding Sandbox';
      case 'voice':
        return 'Voice Speech Interview';
      case 'aptitude':
        return 'Aptitude Test';
      case 'settings':
        return 'System & Profile Settings';
      default:
        return 'InterviewIQ';
    }
  };

  const themeOptions: Array<{ id: ThemePreference; label: string; icon: React.ReactNode }> = [
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'system', label: 'System', icon: <Laptop className="w-3.5 h-3.5 text-cyan-400" /> },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 border-b border-white/5 backdrop-blur-xl bg-slate-950/40">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 lg:hidden transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {getTitle()}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Gemini AI Connected
            </span>
          </div>
          <p className="hidden md:block text-xs text-slate-400">
            Realistic mock interviews, multi-category scoring, and adaptive preparation.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {activeTab !== 'setup' && activeTab !== 'room' && (
          <button
            onClick={() => setActiveTab('setup')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Start Interview</span>
            <span className="sm:hidden">Start</span>
          </button>
        )}

        {/* Theme Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu((prev) => !prev)}
            title={`Current theme: ${theme} (${resolvedTheme})`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-purple-400" />
            ) : theme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="capitalize hidden sm:inline">{theme}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-32 py-1.5 rounded-2xl glass-panel shadow-2xl border border-white/10 z-50">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition ${
                    theme === opt.id
                      ? 'bg-purple-600/20 text-purple-300 font-bold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1.5px] cursor-pointer"
            onClick={() => setActiveTab('settings')}
            title="Settings & Profile"
          >
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-xs text-purple-300">
              {user ? user.name.slice(0, 2).toUpperCase() : 'IQ'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
