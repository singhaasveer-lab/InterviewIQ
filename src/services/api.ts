import type { AnalyticsData } from '../types';

const API_BASE = '/api';


// ============================================================
// AUTH TOKEN
// ============================================================

export function getAuthToken(): string | null {
  return localStorage.getItem(
    'interviewiq_token'
  );
}

export function setAuthToken(
  token: string
): void {
  localStorage.setItem(
    'interviewiq_token',
    token
  );
}

export function clearAuthToken(): void {
  localStorage.removeItem(
    'interviewiq_token'
  );
}


// ============================================================
// API ERROR
// ============================================================

export class ApiError extends Error {

  status: number;

  details?: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown
  ) {

    super(message);

    this.name =
      'ApiError';

    this.status =
      status;

    this.details =
      details;
  }
}


// ============================================================
// REQUEST
// ============================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const token =
    getAuthToken();


  const headers =
    new Headers(
      options.headers
    );


  if (
    !headers.has(
      'Content-Type'
    )
  ) {

    headers.set(
      'Content-Type',
      'application/json'
    );
  }


  if (token) {

    headers.set(
      'Authorization',
      `Bearer ${token}`
    );
  }


  let response: Response;


  try {

    response =
      await fetch(
        `${API_BASE}${endpoint}`,
        {
          ...options,
          headers,
        }
      );

  } catch (error) {

    throw new ApiError(
      'Unable to connect to the InterviewIQ backend. Make sure FastAPI is running on port 8000.',
      0,
      error
    );
  }


  const isCredentialCall =
    endpoint === '/auth/login' ||
    endpoint === '/auth/register';

  if (
    response.status === 401 &&
    !isCredentialCall
  ) {

    clearAuthToken();

    window.dispatchEvent(
      new Event('interviewiq:session-expired')
    );

    throw new ApiError(
      'Your session has expired. Please log in again.',
      401
    );
  }


  if (!response.ok) {

    let errorMessage =
      `Request failed (${response.status})`;

    let details:
      unknown =
      undefined;


    try {

      const errorData =
        await response.json();

      details =
        errorData;


      if (
        typeof errorData?.detail ===
        'string'
      ) {

        errorMessage =
          errorData.detail;

      } else if (
        typeof errorData?.error ===
        'string'
      ) {

        errorMessage =
          errorData.error;

      } else if (
        typeof errorData?.message ===
        'string'
      ) {

        errorMessage =
          errorData.message;
      }

    } catch {
      // Ignore non-JSON errors.
    }


    throw new ApiError(
      errorMessage,
      response.status,
      details
    );
  }


  if (
    response.status === 204
  ) {

    return undefined as T;
  }


  const contentType =
    response.headers.get(
      'content-type'
    ) || '';


  if (
    contentType.includes(
      'application/json'
    )
  ) {

    return response.json();
  }


  return (
    response.text()
  ) as Promise<T>;
}


// ============================================================
// TYPES
// ============================================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}


export interface AuthResponse {
  token: string;
  user: AuthUser;
}


export interface InterviewQuestion {
  id: number;

  type:
    | 'mcq'
    | 'text';

  question: string;

  options?:
    | string[]
    | null;

  correct_answer?:
    | string
    | null;

  topic?: string;
}


export interface GenerateInterviewParams {

  role: string;

  experience: string;

  interview_type: string;

  difficulty: string;

  question_count: number;

  skills: string[];

  job_description?: string;

  resume_context?: string;
}


export interface GenerateInterviewResponse {

  interview_id: string;

  questions:
    InterviewQuestion[];

  total_questions: number;

  role: string;

  difficulty: string;
}


export interface EvaluateInterviewParams {

  interview_id?: string;

  questions:
    InterviewQuestion[];

  answers:
    Record<
      string | number,
      string
    >;

  role: string;

  skills: string[];

  job_description?: string;

  resume_context?: string;
}


export interface EvaluationResponse {

  overallScore: number;

  technicalScore: number;

  communicationScore: number;

  problemSolvingScore: number;

  confidenceScore: number;

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];

  questionFeedback: Array<{

    questionId: number;

    question: string;

    userAnswer: string;

    score: number;

    feedback: string;

    suggestedAnswer: string;

    topic: string;
  }>;
}


// ============================================================
// PROFILE
// ============================================================

export interface UserProfileData {
  target_role: string;
  experience: string;
  interview_type: string;
  difficulty: string;
  question_count: number | null;
  skills: string[];
}


// ============================================================
// APTITUDE
// ============================================================

export type AptitudeSection =
  | 'Quantitative'
  | 'Logical'
  | 'Verbal';

export interface AptitudeQuestion {
  id: number;
  section: AptitudeSection;
  topic: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  shortcut?: string;
}

export interface AptitudeAttempt {
  id: string;
  difficulty: string;
  total_questions: number;
  correct_count: number;
  score: number;
  time_taken_seconds: number;
  section_scores: Record<string, { correct: number; total: number }>;
  weak_topics: string[];
  created_at: string;
}


// ============================================================
// API
// ============================================================

export const api = {

  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  register: (
    data: {
      name: string;
      email: string;
      password: string;
    }
  ) =>
    request<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body:
          JSON.stringify(data),
      }
    ),


  login: (
    data: {
      email: string;
      password: string;
    }
  ) =>
    request<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body:
          JSON.stringify(data),
      }
    ),


  logout: () =>
    request<{
      success: boolean;
    }>(
      '/auth/logout',
      {
        method: 'POST',
      }
    ),


  getMe: () =>
    request<AuthUser>(
      '/auth/me'
    ),


  // ----------------------------------------------------------
  // INTERVIEW
  // ----------------------------------------------------------

  generateInterview: (
    params:
      GenerateInterviewParams
  ) =>
    request<GenerateInterviewResponse>(
      '/interview/generate',
      {
        method: 'POST',

        body:
          JSON.stringify(params),
      }
    ),


  evaluateInterview: (
    params:
      EvaluateInterviewParams
  ) =>
    request<EvaluationResponse>(
      '/interview/evaluate',
      {
        method: 'POST',

        body:
          JSON.stringify(params),
      }
    ),


  getHistory: () =>
    request<any[]>(
      '/interview/history'
    ),


  getInterviewById: (
    id: string
  ) =>
    request<any>(
      `/interview/${encodeURIComponent(id)}`
    ),


  deleteInterview: (
    id: string
  ) =>
    request<{
      success: boolean;
      message: string;
    }>(
      `/interview/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    ),


  // ----------------------------------------------------------
  // AI COACH
  // ----------------------------------------------------------

  sendMessage: (
    message: string,
    history: any[] = []
  ) =>
    request<{
      reply: string;
      timestamp: string;
    }>(
      '/chat',
      {
        method: 'POST',

        body:
          JSON.stringify({
            message,
            history,
          }),
      }
    ),


  // ----------------------------------------------------------
  // RESUME
  // ----------------------------------------------------------

  analyzeResume: (
    resume_text: string,
    target_role =
      'Software Engineer'
  ) =>
    request<any>(
      '/resume/analyze',
      {
        method: 'POST',

        body:
          JSON.stringify({
            resume_text,
            target_role,
          }),
      }
    ),


  // ----------------------------------------------------------
  // JOB
  // ----------------------------------------------------------

  analyzeJob: (
    job_description: string,
    resume_text = ''
  ) =>
    request<any>(
      '/job/analyze',
      {
        method: 'POST',

        body:
          JSON.stringify({
            job_description,
            resume_text,
          }),
      }
    ),


  // ----------------------------------------------------------
  // RAG
  // ----------------------------------------------------------

  uploadRAGDoc: (
    data: {
      title: string;
      content: string;
      category?: string;
    }
  ) =>
    request<any>(
      '/rag/upload',
      {
        method: 'POST',

        body:
          JSON.stringify(data),
      }
    ),


  searchRAG: (
    query: string,
    limit = 4
  ) =>
    request<{
      query: string;
      results: any[];
      total_matches: number;
    }>(
      '/rag/search',
      {
        method: 'POST',

        body:
          JSON.stringify({
            query,
            limit,
          }),
      }
    ),


  getRAGDocs: () =>
    request<any[]>(
      '/rag/documents'
    ),


  // ----------------------------------------------------------
  // ANALYTICS
  // ----------------------------------------------------------

  getAnalytics: () =>
    request<AnalyticsData>(
      '/analytics'
    ),


  // ----------------------------------------------------------
  // LEARNING PATH
  // ----------------------------------------------------------

  getLearningPath: (
    role =
      'Full Stack Engineer'
  ) =>
    request<{
      role: string;
      total_days: number;
      roadmap: any[];
    }>(
      `/learning-path?role=${encodeURIComponent(role)}`
    ),


  // ----------------------------------------------------------
  // CODING
  // ----------------------------------------------------------

  evaluateCode: (
    params: {
      problem_id: string;
      title: string;
      language: string;
      code: string;
      problem_statement: string;
    }
  ) =>
    request<any>(
      '/coding/evaluate',
      {
        method: 'POST',

        body:
          JSON.stringify(params),
      }
    ),


  // ----------------------------------------------------------
  // TTS
  // ----------------------------------------------------------

  getTTSAudio: (
    text: string,
    voice = 'Kore'
  ) =>
    request<{
      audio: string;
      format: string;
    }>(
      '/tts',
      {
        method: 'POST',

        body:
          JSON.stringify({
            text,
            voice,
          }),
      }
    ),


  // ----------------------------------------------------------
  // APTITUDE
  // ----------------------------------------------------------

  generateAptitude: (
    data: {
      sections: AptitudeSection[];
      difficulty: string;
      question_count: number;
      source?: 'instant' | 'ai';
      focus_topics?: string[];
    }
  ) =>
    request<{
      questions: AptitudeQuestion[];
      total_questions: number;
      difficulty: string;
      source: string;
    }>(
      '/aptitude/generate',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),


  saveAptitudeAttempt: (
    data: Omit<AptitudeAttempt, 'id' | 'score' | 'created_at'>
  ) =>
    request<AptitudeAttempt>(
      '/aptitude/attempts',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),


  getAptitudeAttempts: () =>
    request<AptitudeAttempt[]>(
      '/aptitude/attempts'
    ),


  // ----------------------------------------------------------
  // ACCOUNT & PROFILE
  // ----------------------------------------------------------

  updateMe: (
    data: {
      name?: string;
      role?: string;
    }
  ) =>
    request<AuthUser>(
      '/auth/me',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),


  deleteAccount: () =>
    request<{ success: boolean }>(
      '/auth/me',
      {
        method: 'DELETE',
      }
    ),


  getProfile: () =>
    request<UserProfileData>(
      '/profile'
    ),


  saveProfile: (
    data: UserProfileData
  ) =>
    request<UserProfileData>(
      '/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),


  resetPracticeData: () =>
    request<{
      success: boolean;
      interviews_deleted: number;
      aptitude_attempts_deleted: number;
    }>(
      '/profile/practice-data',
      {
        method: 'DELETE',
      }
    )
};


// ============================================================
// ERROR HELPER
// ============================================================

export function isApiError(
  error: unknown
): error is ApiError {

  return error instanceof ApiError;
}