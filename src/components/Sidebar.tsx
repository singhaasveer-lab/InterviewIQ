import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  Bot,
  FileText,
  Briefcase,
  Database,
  History,
  BarChart3,
  Compass,
  Code2,
  Mic,
  Calculator,
  Settings,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useInterview } from '../context/InterviewContext';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { questions, currentQuestionIndex } = useInterview();

  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'setup',
      label: 'Interview',
      icon: PlayCircle,
      badge: questions.length > 0 ? `${currentQuestionIndex + 1}/${questions.length}` : undefined,
    },
    { id: 'aptitude', label: 'Aptitude Test', icon: Calculator, badge: 'New' },
    { id: 'coach', label: 'AI Coach', icon: Bot, badge: 'Live' },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'job', label: 'Job Description', icon: Briefcase },
    { id: 'rag', label: 'RAG Knowledge', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    { id: 'learning', label: 'Learning Path', icon: Compass },
    { id: 'coding', label: 'Coding Interview', icon: Code2, badge: 'Sandbox' },
    { id: 'voice', label: 'Voice Interview', icon: Mic, badge: 'Audio' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          theme === 'light'
            ? 'bg-white/90 border-slate-200 text-slate-800'
            : 'bg-slate-950/80 border-white/5 text-slate-200'
        } backdrop-blur-2xl`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  INTERVIEW<span className="text-white">IQ</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">AI Mock Interview Platform</p>
            </div>
          </button>
        </div>

        {/* Active Interview Notice */}
        {questions.length > 0 && activeTab !== 'room' && (
          <div className="px-3 pt-3">
            <button
              onClick={() => handleNavClick('room')}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-cyan-950/60 border border-purple-500/30 text-left hover:border-purple-400 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-semibold text-cyan-200">Session in Progress</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Q {currentQuestionIndex + 1}/{questions.length}
              </span>
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-white border border-purple-500/30 shadow-sm shadow-purple-500/10'
                    : theme === 'light'
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-purple-400'
                        : theme === 'light'
                        ? 'text-slate-400 group-hover:text-slate-700'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Controls Footer */}
        <div className="p-3 border-t border-white/5 space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{theme === 'dark' ? 'Dark Futuristic' : 'Light Professional'}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {theme}
            </span>
          </button>

          {/* User profile item */}
          <div
            className={`flex items-center justify-between p-2 rounded-xl ${
              theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/60'
            } border border-white/5`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-slate-200">
                  {user ? user.name : 'Guest User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user ? user.email : 'Click to log in'}
                </p>
              </div>
            </div>
            {user ? (
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 px-2 py-1 rounded bg-purple-500/10"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
