import React, { useEffect, useState } from 'react';
import {
  Play,
  Bot,
  FileText,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  Code2,
  Mic,
  ChevronRight,
  Star,
} from 'lucide-react';
import { TabType, AnalyticsData, HistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useInterview } from '../context/InterviewContext';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { loadEvaluation } = useInterview();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentInterviews, setRecentInterviews] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [anData, histData] = await Promise.all([
          api.getAnalytics(),
          api.getHistory(),
        ]);
        setAnalytics(anData);
        setRecentInterviews(histData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const hasInterviews = (analytics?.interviewsCompleted ?? 0) > 0;
  const aptitude = analytics?.aptitude;
  const weakTopics = analytics?.weakTopicDetails ?? [];

  const handlePracticeTopic = (topic: string, source: 'interview' | 'aptitude') => {
    try {
      sessionStorage.setItem(
        source === 'aptitude' ? 'interviewiq_aptitude_focus' : 'interviewiq_interview_focus',
        JSON.stringify([topic])
      );
    } catch {
      /* storage unavailable; the page still opens */
    }
    setActiveTab(source === 'aptitude' ? 'aptitude' : 'setup');
  };

  const handleViewInterview = async (id: string) => {
    try {
      const session = await api.getInterviewById(id);
      if (session && session.evaluation) {
        loadEvaluation(session.evaluation);
      } else {
        setActiveTab('history');
      }
    } catch {
      setActiveTab('history');
    }
  };

  const candidateName = user?.name || 'Candidate';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-600/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Command Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">{candidateName}</span>! Ready to practice your next interview?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
              Target high-impact weak areas, refine your answers with the STAR method, and elevate your readiness rating.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('setup')}
              className="px-6 py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 transition active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START MOCK INTERVIEW</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-purple-500/30 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Interviews Completed</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {analytics?.interviewsCompleted ?? 0}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">
            {analytics?.questionsPracticed ?? 0} questions practiced in total
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-cyan-500/30 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Average Score</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
            {hasInterviews ? `${analytics?.averageScore}%` : '--'}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">
            {hasInterviews ? 'Across all evaluated interviews' : 'Finish an interview to see this'}
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-pink-500/30 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Day Streak</span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-white">
            {analytics?.currentStreak ?? 0}
            <span className="text-base font-bold text-slate-400"> {(analytics?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-2">Practice every day to keep it going</p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-amber-500/30 transition group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Aptitude Average</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {aptitude && aptitude.attempts > 0 ? `${aptitude.averageScore}%` : '--'}
          </span>
          <p className="text-[11px] text-slate-500 mt-2">
            {aptitude && aptitude.attempts > 0
              ? `${aptitude.attempts} test${aptitude.attempts > 1 ? 's' : ''} taken`
              : 'Take an aptitude test to see this'}
          </p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('setup')}
            className="p-5 rounded-2xl glass-panel hover:border-purple-500/40 transition cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                Start Mock Interview
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Custom role & difficulty</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('coding')}
            className="p-5 rounded-2xl glass-panel hover:border-pink-500/40 transition cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-110 transition">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-pink-300 transition">
                Practice Coding
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Algorithm & syntax sandbox</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('voice')}
            className="p-5 rounded-2xl glass-panel hover:border-cyan-500/40 transition cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                Voice Interview
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Verbal speech recognition</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('resume')}
            className="p-5 rounded-2xl glass-panel hover:border-amber-500/40 transition cursor-pointer group flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                Analyze Resume
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">ATS scan & gap detector</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Performance Overview & Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Interviews & Performance Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Overview (Technical, Communication, Problem Solving, Confidence) */}
          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Performance Overview</h3>
              </div>
              <span className="text-xs text-slate-400">Averages across your interviews</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {hasInterviews ? (
                [
                  { label: 'Technical Depth', val: analytics?.categoryBreakdown.technical ?? 0, text: 'text-purple-400', bar: 'bg-purple-500' },
                  { label: 'Communication', val: analytics?.categoryBreakdown.behavioral ?? 0, text: 'text-cyan-400', bar: 'bg-cyan-500' },
                  { label: 'Problem Solving', val: analytics?.categoryBreakdown.problemSolving ?? 0, text: 'text-pink-400', bar: 'bg-pink-500' },
                  { label: 'Confidence', val: analytics?.categoryBreakdown.confidence ?? 0, text: 'text-emerald-400', bar: 'bg-emerald-500' },
                ].map((m) => (
                  <div key={m.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                    <p className={`text-2xl font-extrabold ${m.text}`}>{m.val}%</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className={`${m.bar} h-full rounded-full`} style={{ width: `${m.val}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-2 sm:col-span-4 text-xs text-slate-400 py-4 text-center">
                  Your scores will appear here after your first evaluated interview.
                </p>
              )}
            </div>
          </div>

          {/* Recent Practice Interviews Card */}
          <div className="p-6 rounded-3xl glass-panel border border-white/5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-base text-white">Recent Practice Interviews</h3>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
              >
                <span>View All History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentInterviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">No mock sessions completed yet.</p>
                  <button
                    onClick={() => setActiveTab('setup')}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
                  >
                    Start Your First Interview
                  </button>
                </div>
              ) : (
                recentInterviews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleViewInterview(item.id)}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-purple-500/20 transition cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                          {item.role}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/5">
                          {item.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{item.questionCount} Questions</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-cyan-400">
                          {item.score === null ? '--' : `${item.score}%`}
                        </span>
                        <p
                          className={`text-[10px] font-semibold ${
                            item.score === null ? 'text-slate-500' : item.score >= 60 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {item.score === null ? 'Not evaluated' : item.score >= 60 ? 'Passed' : 'Needs work'}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Weak Areas Alert & AI Coach Recommendation */}
        <div className="space-y-6">
          {/* Weak Areas Section */}
          <div className="p-6 rounded-3xl glass-panel border border-amber-500/20 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="font-bold text-sm">Target Weak Areas</h3>
            </div>

            {weakTopics.length === 0 ? (
              <p className="text-xs text-slate-400">
                No weak areas yet. Finish an interview or an aptitude test and the topics you struggled with will show up here.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Topics you scored low on recently. Tap one to practice it.
                </p>
                <div className="space-y-2.5">
                  {weakTopics.map((w) => (
                    <button
                      key={`${w.source}-${w.topic}`}
                      type="button"
                      onClick={() => handlePracticeTopic(w.topic, w.source)}
                      className="w-full text-left p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-xs transition"
                    >
                      <div className="flex justify-between font-semibold text-slate-200 mb-1">
                        <span>{w.topic}</span>
                        <span className="text-amber-400">
                          {w.source === 'interview' && w.score !== null ? `${w.score}%` : `missed ${w.misses ?? 1}x`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {w.source === 'interview' ? 'From your interviews' : 'From your aptitude tests'} &middot; Practice now
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setActiveTab('learning')}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
            >
              <span>View 7-Day Recovery Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Coach Suggestion Card */}
          <div className="p-6 rounded-3xl glass-panel border border-purple-500/20 space-y-4">
            <div className="flex items-center gap-2 text-purple-300">
              <Bot className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm">AI Coach Insight</h3>
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              {analytics?.latestRecommendation
                ? `"${analytics.latestRecommendation}"`
                : 'Complete an interview and your coach will highlight the single most useful thing to work on next.'}
            </p>
            <button
              onClick={() => setActiveTab('coach')}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center justify-center gap-1.5"
            >
              <span>Chat with Coach</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
