import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  ListOrdered,
} from 'lucide-react';
import { TabType, JobAnalysis } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface JobAnalyzerViewProps {
  setActiveTab: (tab: TabType) => void;
}

const SAMPLE_JOB_DESC = `Staff Frontend Engineer - Design Systems & Web Performance
Company: HyperScale Cloud Inc. | Remote / San Francisco

About the Role:
We are seeking a Staff Frontend Engineer to lead the technical vision for our core web application suite serving over 10M developers worldwide. You will partner with Product, UX, and Platform Infrastructure teams to deliver blazing-fast, accessible user interfaces.

Key Responsibilities:
- Architect, build, and maintain our enterprise design system and micro-frontends architecture.
- Drive Core Web Vitals optimization, targeting sub-second LCP and near-zero INP across web clients.
- Mentor senior engineers, conduct deep code reviews, and author foundational architectural RFCs.
- Champion frontend security best practices, CSP enforcement, and accessibility (WCAG 2.1 AAA).

Requirements:
- 5+ years of production experience with modern TypeScript, React (v18/19), and Next.js.
- Deep expertise in browser rendering pipeline (DOM, CSSOM, Layout, Paint, Compositing) and performance profiling.
- Strong experience with state machines, atomic state architectures (Zustand, Jotai), and client-side caching.
- Familiarity with CI/CD automation, Playwright/Cypress end-to-end testing, and Docker containerization.

Preferred Qualifications:
- Experience with WebAssembly (Wasm) or Rust for client performance optimization.
- Contributions to open-source design systems or web performance developer tooling.`;

export const JobAnalyzerView: React.FC<JobAnalyzerViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_DESC);
  const [candidateContext, setCandidateContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      showToast('Please provide a job description.', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      showToast('Extracting competencies and skill gap matrix with AI...', 'info');

      const data = await api.analyzeJob(jobDescription, candidateContext);
      setAnalysis(data);
      showToast('Job description analysis complete!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze job description.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Job Requisition Intelligence</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Job Description Analyzer & Gap Finder
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Deconstruct target job posts into required technologies, match percentages, interview focus
          areas, and a tailored preparation roadmap.
        </p>
      </div>

      {/* Input Form */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Target Job Description
          </label>
          <textarea
            rows={9}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste complete job post, responsibilities, and requirements here..."
            className="w-full p-4 rounded-2xl glass-input text-xs sm:text-sm font-mono leading-relaxed placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Your Background / Resume Highlights (Optional for Match %)
          </label>
          <input
            type="text"
            value={candidateContext}
            onChange={(e) => setCandidateContext(e.target.value)}
            placeholder="e.g. 4 years React, TypeScript, Node.js, Zustand, Docker, PostgreSQL"
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleAnalyze}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-xl shadow-pink-600/25 transition disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deconstructing Job Specs...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4" />
                <span>ANALYZE JOB SPECIFICATION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Match & Seniority Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl glass-panel border border-pink-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                Calculated Match %
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                {analysis.match_percentage}%
              </h3>
              <p className="text-xs text-slate-400 mt-1">Based on provided skill criteria</p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Role Title
              </span>
              <h3 className="text-lg font-bold text-white mt-1 truncate">
                {analysis.role_title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Seniority: {analysis.seniority}</p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Ready to Practice?
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Launch a mock interview with questions directly generated from this role spec.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('setup')}
                className="mt-3 py-2 px-3 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-1.5"
              >
                <span>Generate Questions for this Role</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Required vs Preferred Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Required Hard Skills</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.required_skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Preferred & Bonus Skills</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.preferred_skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Skills vs Core Interview Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 space-y-3">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Candidate Skill Gaps to Close</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-purple-500/20 space-y-3">
              <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Primary Interview Topics Tested</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.interview_topics.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Preparation Roadmap */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-cyan-500/20 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-cyan-400" />
              <span>Recommended Target Preparation Roadmap</span>
            </h4>
            <div className="space-y-2.5">
              {analysis.prep_roadmap.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
