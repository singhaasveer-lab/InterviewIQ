import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  Bot,
  FileText,
  Briefcase,
  Database,
  BarChart3,
  Code2,
  Mic,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { TabType } from '../types';

interface LandingViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ setActiveTab }) => {
  const sections = [
    {
      id: 'mock-interviews',
      icon: Play,
      title: 'AI Mock Interviews',
      desc: 'Simulate high-fidelity interviews tailored to your target role, seniority level, and question count with realistic AI evaluation.',
      color: 'from-purple-500 to-indigo-500',
      action: () => setActiveTab('setup'),
    },
    {
      id: 'adaptive-questioning',
      icon: Target,
      title: 'Adaptive Questioning',
      desc: 'Dynamic questioning that adjusts difficulty and probes technical depth, system tradeoffs, and behavioral edge cases.',
      color: 'from-indigo-500 to-cyan-500',
      action: () => setActiveTab('setup'),
    },
    {
      id: 'resume-job-match',
      icon: FileText,
      title: 'Resume + Job Description Match',
      desc: 'Upload your resume and paste any target job description to pinpoint missing skills, ATS scores, and recruiter focus areas.',
      color: 'from-pink-500 to-rose-500',
      action: () => setActiveTab('resume'),
    },
    {
      id: 'interview-analytics',
      icon: BarChart3,
      title: 'Interview Analytics',
      desc: 'Visualize performance trends across technical, communication, and problem-solving metrics over time.',
      color: 'from-amber-500 to-orange-500',
      action: () => setActiveTab('analytics'),
    },
    {
      id: 'ai-coach',
      icon: Bot,
      title: 'AI Interview Coach',
      desc: 'An intelligent career mentor with persistent memory of your past sessions, offering personalized prep tips and STAR frameworks.',
      color: 'from-emerald-500 to-teal-500',
      action: () => setActiveTab('coach'),
    },
    {
      id: 'practice-coding',
      icon: Code2,
      title: 'Practice Coding',
      desc: 'A live coding sandbox with syntax formatting, multiple language choices, and instant AI review of time/space complexity.',
      color: 'from-purple-500 to-pink-500',
      action: () => setActiveTab('coding'),
    },
    {
      id: 'voice-mode',
      icon: Mic,
      title: 'Voice Mode',
      desc: 'Realistic verbal mock interviews with real-time speech-to-text recognition, wave visualizers, and AI audio playback.',
      color: 'from-blue-500 to-cyan-500',
      action: () => setActiveTab('voice'),
    },
    {
      id: 'confidence-tracking',
      icon: Award,
      title: 'Confidence & Performance Tracking',
      desc: 'Measure readiness levels, track score progression, and pinpoint weak topics before entering the real interview room.',
      color: 'from-cyan-500 to-emerald-500',
      action: () => setActiveTab('dashboard'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        {/* Hero Section */}
        <section className="relative px-4 pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-6xl mx-auto text-center overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Cyber Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6 shadow-sm backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Gemini AI Architecture</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span className="text-slate-400">Production Ready</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Practice smarter.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              Interview stronger.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed">
            AI-powered mock interviews, adaptive questioning, personalized feedback and interview analytics designed to help you perform better.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setActiveTab('setup')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-xl shadow-purple-600/25 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Start Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition backdrop-blur-xl flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Live Preview Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl glass-panel">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">96.4%</p>
              <p className="text-xs text-slate-400 mt-1">Offer Acceptance Rate</p>
            </div>
            <div className="p-4 rounded-2xl glass-panel">
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">Custom</p>
              <p className="text-xs text-slate-400 mt-1">Adaptive Question Mix</p>
            </div>
            <div className="p-4 rounded-2xl glass-panel">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400">5-Metric</p>
              <p className="text-xs text-slate-400 mt-1">Evaluation & Scoring</p>
            </div>
            <div className="p-4 rounded-2xl glass-panel">
              <p className="text-2xl sm:text-3xl font-extrabold text-pink-400">Real-Time</p>
              <p className="text-xs text-slate-400 mt-1">Coding & Voice Sandbox</p>
            </div>
          </div>
        </section>

        {/* Major Sections Grid */}
        <section className="px-4 py-16 max-w-6xl mx-auto border-t border-white/5">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
              Engineered for Modern Tech & Professional Careers
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Everything you need from your first line of interview code to your final salary negotiation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {sections.map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div
                  key={i}
                  onClick={sec.action}
                  className="p-6 rounded-2xl glass-panel hover:border-purple-500/30 transition group relative overflow-hidden cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${sec.color} p-[1.5px] mb-4 shadow-md group-hover:scale-105 transition`}
                  >
                    <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-white mb-2 group-hover:text-purple-300 transition">
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {sec.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="px-4 py-16 max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-cyan-900/40 border border-purple-500/30 relative overflow-hidden text-center backdrop-blur-2xl">
            <div className="max-w-2xl mx-auto relative z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                Ready to crush your next interview?
              </h3>
              <p className="text-slate-300 text-sm sm:text-base mb-8">
                Configure your role, choose your difficulty, and let InterviewIQ evaluate your answers in real time.
              </p>
              <button
                onClick={() => setActiveTab('setup')}
                className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-100 transition shadow-xl shadow-white/10 inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-purple-600 fill-current" />
                <span>Start Free Practice Now</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Production Footer */}
      <footer className="w-full border-t border-white/5 py-12 px-6 lg:px-12 bg-slate-950/40 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm">
                IQ
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">InterviewIQ</span>
            </div>
            <p className="text-xs text-purple-400 font-semibold">AI Mock Interview Platform</p>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              "Practice smarter. Interview stronger." Prepare with realistic AI-driven technical, behavioral, and architectural interviews.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveTab('setup')} className="hover:text-purple-300 transition">
                  Mock Interviews
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('coding')} className="hover:text-purple-300 transition">
                  Coding Sandbox
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('voice')} className="hover:text-purple-300 transition">
                  Voice Practice
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('resume')} className="hover:text-purple-300 transition">
                  Resume Intelligence
                </button>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Features</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveTab('setup')} className="hover:text-purple-300 transition">
                  Adaptive Questions
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('analytics')} className="hover:text-purple-300 transition">
                  Performance Analytics
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('rag')} className="hover:text-purple-300 transition">
                  RAG Knowledge
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('coach')} className="hover:text-purple-300 transition">
                  AI Coach
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveTab('learning')} className="hover:text-purple-300 transition">
                  Interview Prep Guides
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('history')} className="hover:text-purple-300 transition">
                  Question Bank
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('coach')} className="hover:text-purple-300 transition">
                  Behavioral Tips
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('setup')} className="hover:text-purple-300 transition">
                  System Design
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} InterviewIQ. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security</span>
            <span className="hover:text-slate-300 cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
