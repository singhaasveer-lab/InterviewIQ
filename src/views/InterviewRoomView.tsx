import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  LogOut,
  Send,
  Mic,
  MicOff,
  Lightbulb,
  Check,
} from 'lucide-react';
import { TabType } from '../types';
import { useInterview } from '../context/InterviewContext';
import { useToast } from '../context/ToastContext';

interface InterviewRoomViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const InterviewRoomView: React.FC<InterviewRoomViewProps> = ({ setActiveTab }) => {
  const {
    role,
    difficulty,
    questionCount,
    questions,
    currentQuestionIndex,
    answers,
    setAnswer,
    nextQuestion,
    prevQuestion,
    finishInterview,
    isEvaluating,
    resetInterview,
  } = useInterview();

  const { showToast } = useToast();

  const [secondsLeft, setSecondsLeft] = useState<number>(180);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showFinishEarlyConfirm, setShowFinishEarlyConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Reset timer when question changes
    setSecondsLeft(180);
    setHint(null);
    setShowHintModal(false);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech Recognition not supported in this browser. Please type your answer.', 'error');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      showToast('Microphone muted.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        showToast('Listening... Speak your answer now.', 'info');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const currentAns = answers[currentQ.id] || '';
        setAnswer(currentQ.id, currentAns ? `${currentAns} ${transcript}` : transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
      showToast('Could not access microphone.', 'error');
    }
  };

  const handleRequestHint = () => {
    const hints = [
      `For ${role}, emphasize scalability, separation of concerns, and concrete production tradeoffs.`,
      `Structure your response using STAR: Context/Problem, Action taken, and Quantitative Impact.`,
      `Consider edge cases such as network latency, concurrency, and failure recovery.`,
      `Mention relevant frameworks and industry standards relevant to ${currentQ.topic || 'the topic'}.`,
    ];
    const selectedHint = hints[currentQuestionIndex % hints.length];
    setHint(selectedHint);
    setShowHintModal(true);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-400">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">No Active Interview Session</h3>
        <p className="text-xs text-slate-400">
          You have not started an interview yet or your previous session has ended.
        </p>
        <button
          onClick={() => setActiveTab('setup')}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition"
        >
          Go to Interview Setup
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQ.id] || '';
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  const handleSelectOption = (option: string) => {
    setAnswer(currentQ.id, option);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(currentQ.id, e.target.value);
  };

  const handleSkip = () => {
    showToast(`Skipped Question ${currentQuestionIndex + 1}`, 'info');
    if (!isLastQuestion) {
      nextQuestion();
    } else {
      finishInterview();
    }
  };

  const handleNextOrFinish = () => {
    if (isLastQuestion) {
      finishInterview();
    } else {
      nextQuestion();
    }
  };

  const handleQuit = () => {
    resetInterview();
    setShowQuitConfirm(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Interview Control Bar */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel-glow border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
            {difficulty}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <p className="text-[11px] text-slate-400">{role} Mock Interview</p>
          </div>
        </div>

        {/* Timer, Finish Early & Quit */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono transition ${
              secondsLeft < 30
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-white/5 text-slate-200 border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowFinishEarlyConfirm(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 transition"
          >
            Finish Early
          </button>

          <button
            type="button"
            onClick={() => setShowQuitConfirm(true)}
            title="Quit interview"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar Strip */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 px-1">
          <span>Overall Completion</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Question Box */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
              {currentQ.topic || 'Core Knowledge'}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {currentQ.type === 'mcq' ? 'Multiple Choice Question' : 'Open-Ended Technical Answer'}
            </span>
          </div>

          {/* AI Hint / Clarify Question Button */}
          <button
            onClick={handleRequestHint}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>AI Hint / Clarify</span>
          </button>
        </div>

        {/* Question Text */}
        <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
          {currentQ.question}
        </h3>

        {/* Answer Input: MCQ or Open Text */}
        {currentQ.type === 'mcq' && currentQ.options ? (
          <div className="space-y-3 pt-2">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = currentAnswer === option;
              const optionLetters = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full p-4 rounded-2xl text-left border transition flex items-start gap-3.5 group ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/10'
                      : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-slate-900 border-white/10 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {optionLetters[optIdx] || optIdx + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-normal flex-1">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <textarea
                rows={8}
                placeholder="Structure your answer clearly. Explain your thought process, architecture trade-offs, edge cases, and industry production examples..."
                value={currentAnswer}
                onChange={handleTextChange}
                className="w-full p-4 rounded-2xl glass-input text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition leading-relaxed pr-12"
              />

              {/* Speech-to-Text Button */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                title={isRecording ? 'Stop recording voice' : 'Dictate response via microphone'}
                className={`absolute right-3.5 top-3.5 p-2 rounded-xl border transition ${
                  isRecording
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-white/5 text-slate-400 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
              <span>Tip: Use the STAR method (Situation, Task, Action, Result) for behavioral answers.</span>
              <span>{currentAnswer.length} characters</span>
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={prevQuestion}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 border border-white/5 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
            >
              Skip Question
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => showToast('Answer saved for this question.', 'success')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              disabled={isEvaluating}
              onClick={handleNextOrFinish}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2 ${
                isLastQuestion
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
              }`}
            >
              {isEvaluating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating with AI...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <span>SUBMIT & EVALUATE</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>NEXT QUESTION</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-3xl glass-panel-glow border border-amber-500/30 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-bold text-sm">Interviewer Clarification / Hint</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              {hint}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHintModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Early Modal */}
      {showFinishEarlyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl glass-panel-glow border border-purple-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Finish Interview Early?</h3>
            <p className="text-xs text-slate-400">
              You have answered {Object.keys(answers).length} of {questions.length} questions. Submit now to get your AI evaluation?
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishEarlyConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
              >
                Keep Practicing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishEarlyConfirm(false);
                  finishInterview();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quit Confirmation Dialog */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl glass-panel-glow border border-rose-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Quit Interview Session?</h3>
            <p className="text-xs text-slate-400">
              Your current progress in this mock interview will be reset.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={handleQuit}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition"
              >
                Quit Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
