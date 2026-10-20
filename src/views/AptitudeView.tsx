import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Brain,
  BookOpen,
  Clock,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Lightbulb,
  RotateCcw,
  Loader2,
  Target,
  Trophy,
  Zap,
  Sparkles,
  X,
} from 'lucide-react';
import { TabType } from '../types';
import { api, AptitudeAttempt, AptitudeQuestion, AptitudeSection } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AptitudeViewProps {
  setActiveTab: (tab: TabType) => void;
}

type Phase = 'setup' | 'loading' | 'test' | 'results';

const SECTIONS: Array<{
  id: AptitudeSection;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'Quantitative', label: 'Quantitative', hint: 'Percentages, ratios, time & work', icon: Calculator },
  { id: 'Logical', label: 'Logical Reasoning', hint: 'Series, puzzles, blood relations', icon: Brain },
  { id: 'Verbal', label: 'Verbal Ability', hint: 'Grammar, vocabulary, comprehension', icon: BookOpen },
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [6, 9, 12, 15, 21, 30];
const LETTERS = ['A', 'B', 'C', 'D'];

const formatTime = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const AptitudeView: React.FC<AptitudeViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  // Setup state
  const [selectedSections, setSelectedSections] = useState<AptitudeSection[]>([
    'Quantitative',
    'Logical',
    'Verbal',
  ]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(9);
  const [timed, setTimed] = useState(true);
  const [minutes, setMinutes] = useState(9);
  const [minutesEdited, setMinutesEdited] = useState(false);
  const [attempts, setAttempts] = useState<AptitudeAttempt[]>([]);
  const [source, setSource] = useState<'instant' | 'ai'>('instant');
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [loadingSource, setLoadingSource] = useState<'instant' | 'ai'>('instant');

  // Test state
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<AptitudeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    api.getAptitudeAttempts().then(setAttempts).catch(() => {
      /* history is optional; ignore failures */
    });

    // Weak-topic practice sent from the dashboard or analytics page
    try {
      const raw = sessionStorage.getItem('interviewiq_aptitude_focus');
      sessionStorage.removeItem('interviewiq_aptitude_focus');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setFocusTopics(parsed.filter((t) => typeof t === 'string'));
        setSource('ai'); // only the AI generator can target arbitrary topics
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Default time limit: one minute per question, until the user edits it
  useEffect(() => {
    if (!minutesEdited) setMinutes(questionCount);
  }, [questionCount, minutesEdited]);

  const toggleSection = (id: AptitudeSection) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const startTest = async (override?: { source: 'instant' | 'ai'; focus: string[] }) => {
    if (selectedSections.length === 0) {
      showToast('Pick at least one section.', 'error');
      return;
    }
    const useSource = override?.source ?? source;
    const useFocus = override?.focus ?? focusTopics;

    setLoadingSource(useSource);
    setPhase('loading');
    try {
      const orderedSections = SECTIONS.map((s) => s.id).filter((id) => selectedSections.includes(id));
      const res = await api.generateAptitude({
        sections: orderedSections,
        difficulty,
        question_count: questionCount,
        source: useSource,
        focus_topics: useFocus,
      });
      if (res.questions.length === 0) {
        showToast('Could not generate any questions. Please try again.', 'error');
        setPhase('setup');
        return;
      }
      if (res.questions.length < questionCount) {
        showToast(`Only ${res.questions.length} valid questions were generated. Starting with those.`, 'info');
      }
      setQuestions(res.questions);
      setAnswers({});
      setCurrent(0);
      setReviewFilter('all');
      finishedRef.current = false;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setSecondsLeft(minutes * 60);
      setPhase('test');
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate the aptitude test.', 'error');
      setPhase('setup');
    }
  };

  const finishTest = useCallback(
    async (qs: AptitudeQuestion[]) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const spent = Math.round((Date.now() - startedAtRef.current) / 1000);
      setElapsed(spent);
      setPhase('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const given = answersRef.current;
      const sectionScores: Record<string, { correct: number; total: number }> = {};
      const weak = new Set<string>();
      let correct = 0;

      qs.forEach((q) => {
        const entry = (sectionScores[q.section] ||= { correct: 0, total: 0 });
        entry.total += 1;
        if (given[q.id] === q.correct_index) {
          entry.correct += 1;
          correct += 1;
        } else {
          weak.add(q.topic);
        }
      });

      try {
        const saved = await api.saveAptitudeAttempt({
          difficulty,
          total_questions: qs.length,
          correct_count: correct,
          time_taken_seconds: spent,
          section_scores: sectionScores,
          weak_topics: Array.from(weak).slice(0, 50),
        });
        setAttempts((prev) => [saved, ...prev].slice(0, 20));
      } catch {
        showToast('Result shown, but it could not be saved to your history.', 'info');
      }
    },
    [difficulty, showToast]
  );

  // Countdown + elapsed ticker while the test is running
  useEffect(() => {
    if (phase !== 'test') return;
    const id = window.setInterval(() => {
      const spent = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsed(spent);
      if (timed) {
        const left = minutes * 60 - spent;
        setSecondsLeft(left);
        if (left <= 0) {
          showToast("Time's up! Submitting your answers.", 'info');
          finishTest(questions);
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [phase, timed, minutes, questions, finishTest, showToast]);

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = () => {
    const unanswered = questions.length - answeredCount;
    if (
      unanswered > 0 &&
      !window.confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`)
    ) {
      return;
    }
    finishTest(questions);
  };

  const resetToSetup = () => {
    setPhase('setup');
    setQuestions([]);
    setAnswers({});
  };

  // ------------------------------------------------------------
  // Derived results
  // ------------------------------------------------------------
  const results = useMemo(() => {
    if (phase !== 'results') return null;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const bySection: Record<string, { correct: number; total: number }> = {};
    const weakTopics: Record<string, number> = {};

    questions.forEach((q) => {
      const section = (bySection[q.section] ||= { correct: 0, total: 0 });
      section.total += 1;
      const picked = answers[q.id];
      if (picked === undefined) {
        skipped += 1;
        weakTopics[q.topic] = (weakTopics[q.topic] || 0) + 1;
      } else if (picked === q.correct_index) {
        correct += 1;
        section.correct += 1;
      } else {
        wrong += 1;
        weakTopics[q.topic] = (weakTopics[q.topic] || 0) + 1;
      }
    });

    const total = questions.length;
    return {
      correct,
      wrong,
      skipped,
      total,
      percent: total ? Math.round((correct / total) * 100) : 0,
      avgSeconds: total ? Math.round(elapsed / total) : 0,
      bySection,
      weakTopics: Object.entries(weakTopics).sort((a, b) => b[1] - a[1]).map(([topic]) => topic),
    };
  }, [phase, questions, answers, elapsed]);

  // ------------------------------------------------------------
  // RENDER: loading
  // ------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <Loader2 className="w-10 h-10 mx-auto animate-spin text-purple-400" />
        <h2 className="mt-5 text-xl font-bold text-white">Building your aptitude test...</h2>
        <p className="mt-1 text-sm text-slate-400">
          {loadingSource === 'ai'
            ? `Gemini is writing ${questionCount} ${difficulty.toLowerCase()} questions with worked solutions. This can take up to a minute, so please keep this tab open.`
            : 'Picking your questions...'}
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // RENDER: test
  // ------------------------------------------------------------
  if (phase === 'test') {
    const q = questions[current];
    const lowTime = timed && secondsLeft <= 30;
    const progress = ((current + 1) / questions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            Question <span className="font-bold text-white">{current + 1}</span> of {questions.length}
            <span className="ml-3 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {q.section}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel font-mono text-sm font-bold ${
              lowTime ? 'text-rose-400' : 'text-white'
            }`}
            aria-live="off"
          >
            <Clock className="w-4 h-4" />
            {timed ? formatTime(secondsLeft) : formatTime(elapsed)}
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-slate-500/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">{q.topic}</p>
          <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed whitespace-pre-line">
            {q.question}
          </h2>

          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left text-sm transition ${
                    selected
                      ? 'border-purple-500 bg-purple-500/15 text-white shadow-md shadow-purple-500/10'
                      : 'border-white/10 glass-input hover:border-purple-400/60'
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      selected ? 'bg-purple-600 text-white' : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="pt-1">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question navigator */}
        <div className="flex flex-wrap gap-2">
          {questions.map((item, i) => {
            const isAnswered = answers[item.id] !== undefined;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to question ${i + 1}`}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${
                  i === current
                    ? 'border-purple-500 bg-purple-600 text-white'
                    : isAnswered
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/10 glass-input text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold glass-panel text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {current < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((c) => c + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-600/30"
            >
              Submit test ({answeredCount}/{questions.length})
            </button>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // RENDER: results
  // ------------------------------------------------------------
  if (phase === 'results' && results) {
    const grade =
      results.percent >= 80 ? 'Excellent' : results.percent >= 60 ? 'Good' : results.percent >= 40 ? 'Needs practice' : 'Keep going';
    const reviewList = questions.filter(
      (q) => reviewFilter === 'all' || answers[q.id] !== q.correct_index
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-500/20" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#aptGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - results.percent / 100)}
              />
              <defs>
                <linearGradient id="aptGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white">{results.percent}%</span>
              <span className="text-[11px] text-slate-400">{grade}</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Correct', value: results.correct, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Wrong', value: results.wrong, icon: XCircle, color: 'text-rose-400' },
              { label: 'Skipped', value: results.skipped, icon: MinusCircle, color: 'text-amber-400' },
              { label: 'Avg / question', value: `${results.avgSeconds}s`, icon: Clock, color: 'text-cyan-400' },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-2xl glass-panel text-center">
                <stat.icon className={`w-5 h-5 mx-auto ${stat.color}`} />
                <div className="mt-1 text-xl font-bold text-white">{stat.value}</div>
                <div className="text-[11px] text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section breakdown */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Target className="w-4 h-4 text-purple-400" /> Section performance
          </h3>
          {Object.entries(results.bySection).map(([name, s]) => {
            const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">{name}</span>
                  <span className="text-slate-400">
                    {s.correct}/{s.total} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-500/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* What to study */}
        {results.weakTopics.length > 0 && (
          <div className="p-6 rounded-3xl glass-panel">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" /> What to study next
            </h3>
            <div className="flex flex-wrap gap-2">
              {results.weakTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Answer review</h3>
            <div className="flex p-1 rounded-xl glass-panel text-xs font-semibold">
              {(['all', 'wrong'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    reviewFilter === f ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {f === 'all' ? 'All' : 'Wrong & skipped'}
                </button>
              ))}
            </div>
          </div>

          {reviewList.length === 0 && (
            <div className="p-6 rounded-2xl glass-panel text-center text-sm text-emerald-400">
              <Trophy className="w-6 h-6 mx-auto mb-2" /> Perfect score. Nothing to review.
            </div>
          )}

          {reviewList.map((q) => {
            const picked = answers[q.id];
            const isCorrect = picked === q.correct_index;
            return (
              <div key={q.id} className="p-5 rounded-2xl glass-panel space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white whitespace-pre-line">
                    {q.id}. {q.question}
                  </p>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      picked === undefined
                        ? 'bg-amber-500/15 text-amber-400'
                        : isCorrect
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {picked === undefined ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.correct_index;
                    const isPicked = i === picked;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
                          isAnswer
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : isPicked
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                            : 'border-white/5 text-slate-400'
                        }`}
                      >
                        <span className="font-bold">{LETTERS[i]}.</span>
                        <span className="flex-1">{opt}</span>
                        {isAnswer && <span className="font-semibold">Correct answer</span>}
                        {isPicked && !isAnswer && <span className="font-semibold">Your answer</span>}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <p className="text-xs leading-relaxed text-slate-300">
                    <span className="font-bold text-purple-400">Solution: </span>
                    {q.explanation}
                  </p>
                )}
                {q.shortcut && (
                  <p className="text-xs leading-relaxed text-slate-300">
                    <span className="font-bold text-cyan-400">Shortcut: </span>
                    {q.shortcut}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {results.weakTopics.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const focus = results.weakTopics.slice(0, 5);
                setFocusTopics(focus);
                setSource('ai');
                startTest({ source: 'ai', focus });
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg shadow-amber-500/20"
            >
              <Target className="w-4 h-4" /> Practice my weak topics (AI)
            </button>
          )}
          <button
            type="button"
            onClick={resetToSetup}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
          >
            <RotateCcw className="w-4 h-4" /> Take another test
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold glass-panel text-slate-300"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // RENDER: setup
  // ------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Aptitude Test</h1>
        <p className="mt-1 text-sm text-slate-400">
          Practice the quantitative, logical and verbal rounds that most hiring tests use. Every answer comes with a
          worked solution.
        </p>
      </div>

      <div className="p-6 rounded-3xl glass-panel-glow space-y-6">
        {focusTopics.length > 0 && (
          <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-300">
              <span className="font-bold">Focus mode:</span> this test will target {focusTopics.join(', ')}.
            </p>
            <button
              type="button"
              onClick={() => setFocusTopics([])}
              aria-label="Clear focus topics"
              className="text-amber-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Questions from</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { id: 'instant', label: 'Instant', hint: 'Built-in question bank. Starts immediately, no AI wait.', icon: Zap },
              { id: 'ai', label: 'AI-generated', hint: 'Gemini writes fresh questions. Takes longer and uses your AI quota.', icon: Sparkles },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSource(opt.id)}
                aria-pressed={source === opt.id}
                className={`p-4 rounded-2xl border text-left transition ${
                  source === opt.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 glass-input hover:border-purple-400/50'
                }`}
              >
                <opt.icon className={`w-5 h-5 ${source === opt.id ? 'text-purple-400' : 'text-slate-500'}`} />
                <div className="mt-2 text-sm font-bold text-white">{opt.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Sections</label>
          <div className="grid sm:grid-cols-3 gap-3">
            {SECTIONS.map((s) => {
              const on = selectedSections.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSection(s.id)}
                  aria-pressed={on}
                  className={`p-4 rounded-2xl border text-left transition ${
                    on ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 glass-input hover:border-purple-400/50'
                  }`}
                >
                  <s.icon className={`w-5 h-5 ${on ? 'text-purple-400' : 'text-slate-500'}`} />
                  <div className="mt-2 text-sm font-bold text-white">{s.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Difficulty</label>
            <div className="flex p-1 rounded-xl glass-input">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    difficulty === d ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Number of questions</label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition ${
                    questionCount === n
                      ? 'border-purple-500 bg-purple-600 text-white'
                      : 'border-white/10 glass-input text-slate-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-input">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="w-4 h-4 accent-purple-600"
            />
            <span className="text-sm font-semibold text-white">Timed test</span>
            <span className="text-xs text-slate-400">Auto-submits when time runs out</span>
          </label>
          {timed && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="number"
                min={1}
                max={90}
                value={minutes}
                onChange={(e) => {
                  setMinutesEdited(true);
                  setMinutes(Math.min(90, Math.max(1, Number(e.target.value) || 1)));
                }}
                className="w-16 px-2 py-1.5 rounded-lg glass-input text-center text-sm font-bold"
              />
              minutes
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => startTest()}
          disabled={selectedSections.length === 0}
          className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> Generate &amp; start test
        </button>
      </div>

      {attempts.length > 0 && (
        <div className="p-6 rounded-3xl glass-panel">
          <h3 className="text-sm font-bold text-white mb-3">Recent attempts</h3>
          <div className="space-y-2">
            {attempts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs p-3 rounded-xl glass-input">
                <span className="text-slate-300">
                  {new Date(a.created_at + (a.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString()} · {a.difficulty}{' '}
                  · {a.total_questions} questions
                </span>
                <span
                  className={`font-bold ${
                    a.score >= 70 ? 'text-emerald-400' : a.score >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {a.correct_count}/{a.total_questions} · {a.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
