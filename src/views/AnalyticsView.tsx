import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Flame,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { TabType, AnalyticsData } from '../types';
import { api } from '../services/api';

interface AnalyticsViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ setActiveTab }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const history = data?.scoreHistory ?? [];
  const hasInterviews = (data?.interviewsCompleted ?? 0) > 0;
  const trend = history.length >= 2 ? history[history.length - 1].score - history[0].score : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Progress & Competency Velocity</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Performance Analytics & Mastery
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Historical score trends across rounds, competency breakdown, difficulty resilience, and topic mastery.
        </p>
      </div>

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/5">
          <span className="text-xs text-slate-400 font-medium">Interviews Completed</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {data?.interviewsCompleted ?? 0}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            Evaluated mock interviews
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5">
          <span className="text-xs text-slate-400 font-medium">Average Total Score</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
            {hasInterviews ? `${data?.averageScore}%` : '--'}
          </p>
          <span className="text-[11px] text-cyan-300/80 font-medium mt-1 block">
            Average of your overall scores
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5">
          <span className="text-xs text-slate-400 font-medium">Questions Practiced</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
            {data?.questionsPracticed ?? 0}
          </p>
          <span className="text-[11px] text-purple-300/80 font-medium mt-1 block">
            Interviews and aptitude tests
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5">
          <span className="text-xs text-slate-400 font-medium">Consistency Streak</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
            {data?.currentStreak ?? 0} {(data?.currentStreak ?? 0) === 1 ? 'Day' : 'Days'}
          </p>
          <span className="text-[11px] text-amber-300/80 font-medium mt-1 block">
            Consecutive days practicing
          </span>
        </div>
      </div>

      {/* Score Progression Trend (SVG Interactive Chart) */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Score Progression Over Time</span>
            </h3>
            <p className="text-xs text-slate-400">Progression from earliest to most recent round</p>
          </div>
          {trend !== null && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                trend >= 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {trend >= 0 ? '+' : ''}
              {trend} points since your first round
            </span>
          )}
        </div>

        {/* Visual SVG Chart */}
        {history.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No evaluated interviews yet.</p>
            <button
              onClick={() => setActiveTab('setup')}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
            >
              Start your first interview
            </button>
          </div>
        )}
        <div className={history.length === 0 ? 'hidden' : 'pt-4'}>
          <div className="h-56 w-full flex items-end justify-between gap-3 sm:gap-6 px-2 sm:px-6 border-b border-white/10 pb-4">
            {history.map((item, idx) => {
              const heightPercent = Math.max(20, item.score);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-xs font-bold text-purple-300 opacity-0 group-hover:opacity-100 transition">
                    {item.score}%
                  </span>
                  <div className="w-full max-w-[50px] bg-slate-900 rounded-t-xl overflow-hidden h-40 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 via-indigo-500 to-cyan-400 rounded-t-xl transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-200">{item.date}</span>
                    <span className="block text-[10px] text-slate-500 truncate max-w-[70px]">
                      {item.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Competency Radar Breakdown & Difficulty Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Category Performance Index</span>
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Technical Depth', val: data?.categoryBreakdown.technical ?? 0, color: 'from-purple-500 to-indigo-500' },
              { label: 'Communication Clarity', val: data?.categoryBreakdown.behavioral ?? 0, color: 'from-pink-500 to-rose-500' },
              { label: 'Problem Solving', val: data?.categoryBreakdown.problemSolving ?? 0, color: 'from-cyan-500 to-blue-500' },
              { label: 'Executive Confidence', val: data?.categoryBreakdown.confidence ?? 0, color: 'from-emerald-500 to-teal-500' },
            ].map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">{cat.label}</span>
                  <span className="text-white">{cat.val}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className={`bg-gradient-to-r ${cat.color} h-2 rounded-full`}
                    style={{ width: `${cat.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Performance by Difficulty</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Easy
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {(data?.difficultyStats.easy.count ?? 0) > 0 ? `${data?.difficultyStats.easy.avgScore}%` : '--'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {data?.difficultyStats.easy.count ?? 0} {(data?.difficultyStats.easy.count ?? 0) === 1 ? 'round' : 'rounds'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Medium
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {(data?.difficultyStats.medium.count ?? 0) > 0 ? `${data?.difficultyStats.medium.avgScore}%` : '--'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {data?.difficultyStats.medium.count ?? 0} {(data?.difficultyStats.medium.count ?? 0) === 1 ? 'round' : 'rounds'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                Hard
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {(data?.difficultyStats.hard.count ?? 0) > 0 ? `${data?.difficultyStats.hard.avgScore}%` : '--'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {data?.difficultyStats.hard.count ?? 0} {(data?.difficultyStats.hard.count ?? 0) === 1 ? 'round' : 'rounds'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strongest & Weakest Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-3">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Your Strongest Technical Concepts</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {(data?.strongestTopics ?? []).length === 0 && (
              <span className="text-xs text-slate-400">Topics you score 75% or higher on will appear here.</span>
            )}
            {(data?.strongestTopics ?? []).map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl glass-panel border border-amber-500/20 space-y-3">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Target Weak Concepts for Practice</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {(data?.weakTopicDetails ?? []).length === 0 && (
              <span className="text-xs text-slate-400">No weak topics detected yet. Nice and clean.</span>
            )}
            {(data?.weakTopicDetails ?? []).map((w) => (
              <button
                key={`${w.source}-${w.topic}`}
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem(
                      w.source === 'aptitude' ? 'interviewiq_aptitude_focus' : 'interviewiq_interview_focus',
                      JSON.stringify([w.topic])
                    );
                  } catch {
                    /* storage unavailable */
                  }
                  setActiveTab(w.source === 'aptitude' ? 'aptitude' : 'setup');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition"
                title="Practice this topic"
              >
                <span>{w.topic}</span>
                <span className="text-[10px] text-amber-400/80">
                  {w.score !== null ? `${w.score}%` : `missed ${w.misses ?? 1}x`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
