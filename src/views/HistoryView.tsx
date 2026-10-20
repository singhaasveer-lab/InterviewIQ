import React, { useEffect, useState } from 'react';
import {
  History,
  Sparkles,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  RotateCcw,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { TabType, HistoryItem } from '../types';
import { api } from '../services/api';
import { useInterview } from '../context/InterviewContext';
import { useToast } from '../context/ToastContext';

interface HistoryViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ setActiveTab }) => {
  const { loadEvaluation, startInterview } = useInterview();
  const { showToast } = useToast();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setHistory(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleViewResults = async (id: string) => {
    try {
      const session = await api.getInterviewById(id);
      if (session && session.evaluation) {
        loadEvaluation(session.evaluation);
      } else {
        showToast('No completed evaluation found for this session.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not load interview.', 'error');
    }
  };

  const handleRetry = async (item: HistoryItem) => {
    const success = await startInterview({
      role: item.role,
      experience: item.experience || '1-2 years',
      interview_type: item.interviewType,
      difficulty: item.difficulty,
      question_count: item.questionCount || 5,
      skills: [],
    });
    if (success) {
      setActiveTab('room');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteInterview(id);
      showToast('Interview deleted from history.', 'info');
      loadHistory();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete interview.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>Past Sessions & Archives</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Interview History & Archives
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review previous mock interviews, view past feedback, and retry with freshly generated questions.
        </p>
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        {history.length > 0 ? (
          history.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-3xl glass-panel border border-white/5 hover:border-purple-500/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center font-extrabold text-base text-purple-300 shrink-0">
                  {item.score !== null ? `${item.score}%` : '—'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                      {item.role}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      {item.difficulty}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                      {item.interviewType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{item.questionCount} Questions</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {item.hasEvaluation && (
                  <button
                    onClick={() => handleViewResults(item.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5"
                  >
                    <span>VIEW RESULTS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleRetry(item)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RETRY</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Delete interview record"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-3xl glass-panel border border-dashed border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Interview History Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your completed mock interviews and evaluation scores will appear here.
            </p>
            <button
              onClick={() => setActiveTab('setup')}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition"
            >
              Start an Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
