import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  TrendingUp,
  Download,
  RotateCcw,
  Bot,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileCheck,
  Zap,
} from 'lucide-react';
import { TabType, EvaluationResult } from '../types';
import { useInterview } from '../context/InterviewContext';
import { useToast } from '../context/ToastContext';

interface InterviewResultsViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const InterviewResultsView: React.FC<InterviewResultsViewProps> = ({ setActiveTab }) => {
  const { lastEvaluation, role, difficulty, resetInterview } = useInterview();
  const { showToast } = useToast();

  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  const toggleExpand = (qId: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleDownloadReport = () => {
    if (!lastEvaluation) return;
    const reportContent = `INTERVIEWIQ PERFORMANCE EVALUATION REPORT
==================================================
Role: ${role}
Difficulty: ${difficulty}
Overall Score: ${lastEvaluation.overallScore}/100
Technical Score: ${lastEvaluation.technicalScore}/100
Communication Score: ${lastEvaluation.communicationScore}/100
Problem Solving Score: ${lastEvaluation.problemSolvingScore}/100
Confidence Score: ${lastEvaluation.confidenceScore}/100

STRENGTHS:
${lastEvaluation.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

AREAS TO IMPROVE:
${lastEvaluation.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

ACTIONABLE RECOMMENDATIONS:
${lastEvaluation.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

QUESTION-BY-QUESTION BREAKDOWN:
==================================================
${lastEvaluation.questionFeedback
  .map(
    (q, i) => `
[Question ${i + 1} - Score: ${q.score}/100]
Topic: ${q.topic}
Question: ${q.question}
Candidate Answer: ${q.userAnswer}
AI Evaluation: ${q.feedback}
Suggested Exemplar Answer: ${q.suggestedAnswer}
`
  )
  .join('\n--------------------------------------------------\n')}
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InterviewIQ_Report_${role.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Interview report downloaded successfully!', 'success');
  };

  const handleRetry = () => {
    resetInterview();
    setActiveTab('setup');
  };

  const handleAskCoach = () => {
    setActiveTab('coach');
  };

  if (!lastEvaluation) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">No Evaluation Available</h3>
        <p className="text-xs text-slate-400">
          Complete a mock interview round to unlock your detailed AI evaluation report.
        </p>
        <button
          onClick={() => setActiveTab('setup')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition"
        >
          Start an Interview
        </button>
      </div>
    );
  }

  const scores = [
    { label: 'Overall Score', val: lastEvaluation.overallScore, color: 'text-purple-400', border: 'border-purple-500/30' },
    { label: 'Technical Depth', val: lastEvaluation.technicalScore, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { label: 'Communication', val: lastEvaluation.communicationScore, color: 'text-pink-400', border: 'border-pink-500/30' },
    { label: 'Problem Solving', val: lastEvaluation.problemSolvingScore, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { label: 'Confidence', val: lastEvaluation.confidenceScore, color: 'text-amber-400', border: 'border-amber-500/30' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Evaluation Complete</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Interview Performance Report
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Target Role: <strong className="text-white">{role}</strong> • Difficulty:{' '}
            <strong className="text-white">{difficulty}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
          >
            <span>DASHBOARD</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>DOWNLOAD REPORT</span>
          </button>
          <button
            onClick={handleAskCoach}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 transition flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-purple-300" />
            <span>ASK AI COACH</span>
          </button>
          <button
            onClick={handleRetry}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETRY INTERVIEW</span>
          </button>
        </div>
      </div>

      {/* 5-Score Gauge Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {scores.map((sc, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl glass-panel border ${sc.border} text-center flex flex-col items-center justify-center`}
          >
            <span className="text-xs font-semibold text-slate-400 mb-2">{sc.label}</span>
            <div className="relative w-16 h-16 flex items-center justify-center mb-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-current"
                  strokeDasharray={`${sc.val}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute text-base font-extrabold ${sc.color}`}>
                {sc.val}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Demonstrated Strengths</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {lastEvaluation.strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <XCircle className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Areas to Strengthen</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {lastEvaluation.weaknesses.map((wk, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{wk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Recommendations */}
        <div className="p-6 rounded-3xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Actionable Steps</h3>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {lastEvaluation.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question-by-Question Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-purple-400" />
          <span>Question-by-Question Granular Review</span>
        </h3>

        <div className="space-y-3">
          {lastEvaluation.questionFeedback.map((q, idx) => {
            const isExpanded = expandedQuestions[q.questionId] ?? true;
            const scoreColor =
              q.score >= 85
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : q.score >= 70
                ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

            return (
              <div
                key={q.questionId}
                className="rounded-2xl glass-panel border border-white/5 overflow-hidden transition"
              >
                <div
                  onClick={() => toggleExpand(q.questionId)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3.5 pr-4">
                    <span className="text-xs font-bold text-slate-500 shrink-0">
                      Q{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{q.question}</h4>
                      <span className="text-[11px] text-purple-400 font-medium">
                        {q.topic}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${scoreColor}`}
                    >
                      {q.score}/100
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-4 text-xs sm:text-sm bg-black/20">
                    {/* User Answer */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Your Submitted Answer
                      </span>
                      <p className="p-3.5 rounded-xl bg-white/[0.03] text-slate-200 border border-white/5 whitespace-pre-wrap leading-relaxed">
                        {q.userAnswer}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-1">
                        AI Critical Evaluation
                      </span>
                      <p className="text-slate-300 leading-relaxed">{q.feedback}</p>
                    </div>

                    {/* Suggested Answer */}
                    <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
                        Exemplar Model Answer
                      </span>
                      <p className="text-cyan-100/90 leading-relaxed font-mono text-xs">
                        {q.suggestedAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
