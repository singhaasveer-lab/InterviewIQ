import React, { createContext, useContext, useEffect, useState } from 'react';
import { Question, EvaluationResult, TabType } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';

interface InterviewContextType {
  activeSessionId: string | null;
  role: string;
  difficulty: string;
  questionCount: number;
  skills: string[];
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  isGenerating: boolean;
  isEvaluating: boolean;
  lastEvaluation: EvaluationResult | null;
  startInterview: (config: {
    role: string;
    experience: string;
    interview_type: string;
    difficulty: string;
    question_count: number;
    skills: string[];
    job_description?: string;
    resume_context?: string;
  }) => Promise<boolean>;
  setAnswer: (questionId: number, answerText: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  finishInterview: () => Promise<boolean>;
  resetInterview: () => void;
  loadEvaluation: (evalResult: EvaluationResult) => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'interviewiq_active_session';

export const InterviewProvider: React.FC<{
  children: React.ReactNode;
  setActiveTab: (tab: TabType) => void;
}> = ({ children, setActiveTab }) => {
  const { showToast } = useToast();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [skills, setSkills] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);

  // Restore saved active session on reload if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.questions && parsed.questions.length > 0) {
          setActiveSessionId(parsed.activeSessionId);
          setRole(parsed.role || 'Software Engineer');
          setDifficulty(parsed.difficulty || 'Medium');
          setQuestionCount(parsed.questionCount || 5);
          setSkills(parsed.skills || []);
          setQuestions(parsed.questions || []);
          setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
          setAnswers(parsed.answers || {});
          if (parsed.lastEvaluation) {
            setLastEvaluation(parsed.lastEvaluation);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save session state to localStorage on changes
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          activeSessionId,
          role,
          difficulty,
          questionCount,
          skills,
          questions,
          currentQuestionIndex,
          answers,
          lastEvaluation,
        })
      );
    }
  }, [activeSessionId, role, difficulty, questionCount, skills, questions, currentQuestionIndex, answers, lastEvaluation]);

  const startInterview = async (config: {
    role: string;
    experience: string;
    interview_type: string;
    difficulty: string;
    question_count: number;
    skills: string[];
    job_description?: string;
    resume_context?: string;
  }): Promise<boolean> => {
    try {
      setIsGenerating(true);
      showToast(`Generating ${config.question_count} AI questions for ${config.role}...`, 'info');

      const data = await api.generateInterview(config);

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions received from AI');
      }

      setActiveSessionId(data.interview_id);
      setRole(config.role);
      setDifficulty(config.difficulty);
      setQuestionCount(config.question_count);
      setSkills(config.skills);
      setQuestions(
        data.questions.map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options ?? undefined,
          correctAnswer: q.correct_answer ?? undefined,
          topic: q.topic,
        }))
      );
      setCurrentQuestionIndex(0);
      setAnswers({});
      setLastEvaluation(null);

      showToast(`Interview ready with ${data.questions.length} questions!`, 'success');
      setActiveTab('room');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Unable to generate interview. Please retry.', 'error');
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const setAnswer = (qId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: text,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const finishInterview = async (): Promise<boolean> => {
    try {
      setIsEvaluating(true);
      showToast('AI is critically evaluating your performance...', 'info');

      const evalData = await api.evaluateInterview({
        interview_id: activeSessionId || undefined,
        questions,
        answers,
        role,
        skills,
      });

      setLastEvaluation(evalData);

      // Trigger celebratory confetti if score is high
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#06B6D4', '#EC4899', '#10B981'],
        });
      } catch {
        // ignore
      }

      showToast(`Evaluation completed! Score: ${evalData.overallScore}%`, 'success');
      setActiveTab('results');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Evaluation failed. Please try again.', 'error');
      return false;
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetInterview = () => {
    setActiveSessionId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setLastEvaluation(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    showToast('Interview session reset.', 'info');
  };

  const loadEvaluation = (evalResult: EvaluationResult) => {
    setLastEvaluation(evalResult);
    setActiveTab('results');
  };

  return (
    <InterviewContext.Provider
      value={{
        activeSessionId,
        role,
        difficulty,
        questionCount,
        skills,
        questions,
        currentQuestionIndex,
        answers,
        isGenerating,
        isEvaluating,
        lastEvaluation,
        startInterview,
        setAnswer,
        nextQuestion,
        prevQuestion,
        goToQuestion,
        finishInterview,
        resetInterview,
        loadEvaluation,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
};
