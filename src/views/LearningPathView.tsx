import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Circle,
  BookOpen,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Target,
} from 'lucide-react';
import { TabType, LearningDay } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface LearningPathViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  const [role, setRole] = useState('Full Stack Engineer');
  const [roadmap, setRoadmap] = useState<LearningDay[]>([]);
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>({ 1: true, 2: true });
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoadmap = async (targetRole: string) => {
    try {
      setIsLoading(true);
      showToast(`Generating 7-day preparation roadmap for ${targetRole}...`, 'info');

      const data = await api.getLearningPath(targetRole);
      setRoadmap(data.roadmap || []);
      showToast('Roadmap generated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to load learning path.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap(role);
  }, []);

  const toggleDayCompletion = (dayNum: number) => {
    setCompletedDays((prev) => {
      const next = { ...prev, [dayNum]: !prev[dayNum] };
      const count = Object.values(next).filter(Boolean).length;
      showToast(`Roadmap Progress: ${count} of 7 days completed!`, 'info');
      return next;
    });
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / (roadmap.length || 7)) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Curated Multi-Day Preparation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          7-Day Personalized Interview Roadmap
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Structured day-by-day plan targeting core system architecture, algorithm patterns, and STAR behavioral answers.
        </p>
      </div>

      {/* Role Selector & Progress Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Target Track:
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                fetchRoadmap(e.target.value);
              }}
              className="px-3.5 py-2 rounded-xl glass-input text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Full Stack Engineer">Full Stack Engineer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="AI / ML Engineer">AI / ML Engineer</option>
              <option value="Product Manager">Product Manager</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-cyan-300">
              {completedCount} of {roadmap.length || 7} Days Complete ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {roadmap.map((item) => {
          const isDone = Boolean(completedDays[item.day]);
          return (
            <div
              key={item.day}
              className={`p-6 rounded-3xl glass-panel border transition ${
                isDone ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDayCompletion(item.day)}
                    className="text-slate-400 hover:text-emerald-400 transition"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                      Day {item.day}
                    </span>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/5'
                  }`}
                >
                  {isDone ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs sm:text-sm pl-9">
                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-slate-300 block mb-0.5">Today's Goal</span>
                    <p className="text-slate-400 leading-relaxed">{item.goal}</p>
                  </div>

                  <div>
                    <span className="font-bold text-purple-300 block mb-0.5">
                      Hands-on Practice Task
                    </span>
                    <p className="text-slate-300 leading-relaxed">{item.practice_task}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-cyan-300 block mb-1">
                      Recommended Deep-Dive Resources
                    </span>
                    <ul className="space-y-1 text-slate-400">
                      {item.resources.map((res, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="font-bold text-amber-300 block text-[11px] mb-1">
                      Target Interview Question
                    </span>
                    <p className="text-slate-200 text-xs italic font-serif">
                      "{item.sample_interview_question}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
