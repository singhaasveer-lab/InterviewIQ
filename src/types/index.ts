export type TabType =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'setup'
  | 'room'
  | 'results'
  | 'coach'
  | 'resume'
  | 'job'
  | 'rag'
  | 'history'
  | 'analytics'
  | 'learning'
  | 'coding'
  | 'voice'
  | 'aptitude'
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Question {
  id: number;
  type: 'mcq' | 'text';
  question: string;
  options?: string[];
  correctAnswer?: string;
  topic?: string;
}

export interface QuestionFeedback {
  questionId: number;
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  suggestedAnswer: string;
  topic: string;
}

export interface EvaluationResult {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  questionFeedback: QuestionFeedback[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  experience: string;
  interviewType: string;
  difficulty: string;
  questionCount: number;
  skills: string[];
  jobDescription?: string;
  resumeContext?: string;
  questions: Question[];
  answers: Record<number, string>;
  evaluation?: EvaluationResult;
  createdAt: string;
  completedAt?: string;
}

export interface HistoryItem {
  id: string;
  role: string;
  experience: string;
  interviewType: string;
  difficulty: string;
  questionCount: number;
  score: number | null;
  createdAt: string;
  completedAt?: string;
  hasEvaluation: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ResumeAnalysis {
  ats_score: number;
  resume_score: number;
  skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  tailored_interview_questions: string[];
}

export interface JobAnalysis {
  role_title: string;
  seniority: string;
  match_percentage: number;
  required_skills: string[];
  preferred_skills: string[];
  core_responsibilities: string[];
  missing_skills: string[];
  strong_matches: string[];
  interview_topics: string[];
  prep_roadmap: string[];
}

export interface RAGChunk {
  id: string;
  content: string;
  keywords: string[];
}

export interface RAGDoc {
  id: string;
  title: string;
  category: string;
  chunkCount: number;
  createdAt: string;
}

export interface RAGSearchResult {
  documentId: string;
  docTitle: string;
  category: string;
  chunkId: string;
  content: string;
  score: number;
}

export interface WeakTopicDetail {
  topic: string;
  score: number | null;
  source: 'interview' | 'aptitude';
  misses?: number;
}

export interface AnalyticsData {
  hasData: boolean;
  interviewsCompleted: number;
  averageScore: number;
  questionsPracticed: number;
  currentStreak: number;
  scoreHistory: Array<{
    date: string;
    score: number;
    role: string;
    type: string;
  }>;
  categoryBreakdown: {
    technical: number;
    behavioral: number;
    problemSolving: number;
    confidence: number;
  };
  difficultyStats: {
    easy: { count: number; avgScore: number };
    medium: { count: number; avgScore: number };
    hard: { count: number; avgScore: number };
  };
  strongestTopics: string[];
  weakestTopics: string[];
  weakTopicDetails: WeakTopicDetail[];
  aptitude: {
    attempts: number;
    averageScore: number;
    bySection: Record<string, number>;
  };
  latestRecommendation: string | null;
}

export interface LearningDay {
  day: number;
  title: string;
  goal: string;
  practice_task: string;
  resources: string[];
  sample_interview_question: string;
}

export interface CodingEvaluation {
  score: number;
  passed_all_tests: boolean;
  time_complexity: string;
  space_complexity: string;
  code_quality: string;
  strengths: string[];
  edge_cases_missed: string[];
  test_cases: Array<{
    input: string;
    expected: string;
    passed: boolean;
  }>;
  improved_solution: string;
}
