import React, { useEffect, useState } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Laptop,
  Shield,
  Trash2,
  LogOut,
  Save,
  Key,
  Download,
  RotateCcw,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api, UserProfileData } from '../services/api';

interface SettingsViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ setActiveTab }) => {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [preferredRole, setPreferredRole] = useState('');
  const [defaultDifficulty, setDefaultDifficulty] = useState('Medium');
  const [defaultQuestions, setDefaultQuestions] = useState(5);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setPreferredRole(p.target_role || '');
        if (p.difficulty) setDefaultDifficulty(p.difficulty);
        if (p.question_count) setDefaultQuestions(p.question_count);
      })
      .catch(() => {
        /* profile is optional */
      });

    fetch('/backend-health')
      .then((r) => r.json())
      .then((h) => setGeminiConfigured(Boolean(h?.gemini_configured)))
      .catch(() => setGeminiConfigured(false));
  }, []);
  const [voiceSpeed, setVoiceSpeed] = useState('1.0');
  const [voicePitch, setVoicePitch] = useState('1.0');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your name.', 'error');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.updateMe({ name: name.trim(), role: preferredRole.trim() || undefined });
      updateUser({ name: updated.name, role: updated.role });
      await api.saveProfile({
        target_role: preferredRole.trim(),
        experience: profile?.experience ?? '',
        interview_type: profile?.interview_type ?? '',
        difficulty: defaultDifficulty,
        question_count: defaultQuestions,
        skills: profile?.skills ?? [],
      });
      showToast('Profile and interview preferences saved.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not save your profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    const [analytics, history, aptitudeAttempts] = await Promise.all([
      api.getAnalytics().catch(() => null),
      api.getHistory().catch(() => []),
      api.getAptitudeAttempts().catch(() => []),
    ]);
    const exportData = {
      user: { name, email, preferredRole },
      settings: { defaultDifficulty, defaultQuestions, voiceSpeed, theme },
      analytics,
      interviews: history,
      aptitudeAttempts,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviewiq-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('User data exported successfully!', 'success');
  };

  const handleResetData = async () => {
    if (!window.confirm('Delete all of your interviews and aptitude results? Your account and profile stay.')) return;
    try {
      const res = await api.resetPracticeData();
      showToast(
        `Deleted ${res.interviews_deleted} interview(s) and ${res.aptitude_attempts_deleted} aptitude test(s).`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Could not reset your practice data.', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account and all of its data? This cannot be undone.')) return;
    try {
      await api.deleteAccount();
      logout();
      showToast('Your account and data were deleted.', 'info');
      setActiveTab('landing');
    } catch (err: any) {
      showToast(err?.message || 'Could not delete your account.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <Settings className="w-3.5 h-3.5 text-purple-400" />
          <span>System & Preferences</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings & Account Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your candidate profile, default question parameters, interface theme, and sessions.
        </p>
      </div>

      <div className="space-y-6">
        {/* Candidate Profile */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 space-y-5">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            <span>Candidate Profile Information</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  title="Your email is your sign-in and can't be changed here"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm opacity-70 cursor-not-allowed focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Target Role
                </label>
                <input
                  type="text"
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Difficulty
                </label>
                <select
                  value={defaultDifficulty}
                  onChange={(e) => setDefaultDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Adaptive">Adaptive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Question Count
                </label>
                <select
                  value={defaultQuestions}
                  onChange={(e) => setDefaultQuestions(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Theme Settings (Dark, Light, System) */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-cyan-400" />
            <span>Theme & Visual Identity</span>
          </h3>
          <p className="text-xs text-slate-400">
            Choose your interface preference. Changes are instantly saved and applied without page reload.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20 ring-1 ring-purple-500/50'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-bold">Dark Theme</span>
              <span className="text-[10px] text-slate-400">Cyber dark-first aesthetic</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'light'
                  ? 'bg-purple-600/20 border-purple-500 text-slate-900 shadow-md ring-1 ring-purple-500/50'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span className="text-xs font-bold">Light Theme</span>
              <span className="text-[10px] text-slate-400">Clean daylight contrast</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                theme === 'system'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md ring-1 ring-purple-500/50'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-6 h-6 text-cyan-400" />
              <span className="text-xs font-bold">System Sync</span>
              <span className="text-[10px] text-slate-400">Match OS dark/light mode</span>
            </button>
          </div>
        </div>

        {/* Audio & Voice Mode Settings */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Voice Interview Preferences</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configure default speech rate, pitch, and playback behavior for voice interview mode.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                AI Voice Speed: {voiceSpeed}x
              </label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(e.target.value)}
                className="w-full accent-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Voice Pitch: {voicePitch}x
              </label>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={voicePitch}
                onChange={(e) => setVoicePitch(e.target.value)}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* API & Backend Status */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>AI Architecture & Cloud Connection</span>
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  geminiConfigured === null ? 'bg-slate-500' : geminiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              ></div>
              <div>
                <p className="text-xs font-bold text-white">Google Gemini GenAI SDK</p>
                <p className="text-[11px] text-slate-400">Backend Proxy: Secure Server-Side Execution</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                geminiConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {geminiConfigured === null ? 'Checking...' : geminiConfigured ? 'API Key Active' : 'API Key Missing'}
            </span>
          </div>
        </div>

        {/* Data Management & Export */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-pink-400" />
            <span>Data Management</span>
          </h3>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleExportData}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Export My Data (.json)</span>
            </button>
            <button
              onClick={handleResetData}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Practice Data</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-rose-500/20 space-y-4">
          <h3 className="font-bold text-base text-rose-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Account Security & Session Control</span>
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs font-semibold text-white">Sign Out from Session</p>
              <p className="text-[11px] text-slate-400">Clear JWT access tokens on this device</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs font-semibold text-rose-300">Delete Account & Data</p>
              <p className="text-[11px] text-slate-400">Permanently delete interviews, RAG documents, and history</p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
