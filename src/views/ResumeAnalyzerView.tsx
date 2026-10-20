import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { TabType, ResumeAnalysis } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ResumeAnalyzerViewProps {
  setActiveTab: (tab: TabType) => void;
}

const SAMPLE_RESUME = `Alex Mercer
Senior Software Engineer | San Francisco, CA | alex.mercer@example.com

SUMMARY:
Results-driven Full Stack Engineer with 5+ years of experience specializing in React, TypeScript, Node.js, and high-throughput cloud architectures. Proven track record optimizing web performance and leading micro-frontend migrations for 2M+ active users.

SKILLS:
- Languages: TypeScript, JavaScript (ESNext), Python, SQL
- Frameworks & Libs: React 19, Next.js, Node.js, Express, Tailwind CSS, Redux Toolkit, Zustand
- Databases & Infrastructure: PostgreSQL, Redis, Docker, AWS (S3, CloudFront), Git, CI/CD

EXPERIENCE:
Senior Frontend Engineer | TechCorp Inc. (2022 - Present)
- Architected modular micro-frontends reducing bundle size by 42% and decreasing page load time (LCP) from 3.2s to 1.1s.
- Led a team of 5 engineers to deliver multi-tenant dashboard features generating $1.4M ARR.
- Integrated automated end-to-end testing with Playwright, improving release stability to 99.8%.

Software Engineer | Innovate Labs (2020 - 2022)
- Built high-traffic analytics views processing 15M daily event pings using React and WebSockets.
- Optimized PostgreSQL queries and cache eviction policies in Redis, lowering p99 API latency by 35%.`;

export const ResumeAnalyzerView: React.FC<ResumeAnalyzerViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  const [resumeText, setResumeText] = useState(SAMPLE_RESUME);
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResumeText(text || '');
      showToast(`Loaded ${file.name}`, 'success');
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      showToast('Please provide resume text or upload a file.', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      showToast('Scanning resume with ATS intelligence and Gemini AI...', 'info');

      const data = await api.analyzeResume(resumeText, targetRole);
      setAnalysis(data);
      showToast('Resume analysis completed!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze resume.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>ATS Intelligence & Question Predictor</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Resume Analyzer & ATS Scanner
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Evaluate keyword match rates, ATS formatting barriers, missing skills, and questions
          interviewers will ask from your exact resume achievements.
        </p>
      </div>

      {/* Input Section */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Target Role to Benchmark Against
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm focus:outline-none focus:border-cyan-500 transition"
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition cursor-pointer flex items-center justify-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Upload Document (.txt, .pdf, .docx)</span>
              <input
                type="file"
                accept=".txt,.pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Resume Content
          </label>
          <textarea
            rows={10}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume text here..."
            className="w-full p-4 rounded-2xl glass-input text-xs sm:text-sm font-mono leading-relaxed placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleAnalyze}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-xl shadow-cyan-600/25 transition disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning ATS Compatibility...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ANALYZE RESUME</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  ATS Compatibility Score
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                  {analysis.ats_score}%
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {analysis.ats_score >= 80 ? 'High ATS pass probability' : 'Requires keyword optimization'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-extrabold text-xl">
                {analysis.ats_score}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Overall Impact Score
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                  {analysis.resume_score}%
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Benchmarked against {targetRole} tier
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-extrabold text-xl">
                {analysis.resume_score}
              </div>
            </div>
          </div>

          {/* Extracted vs Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-emerald-500/20 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Extracted & Indexed Skills ({analysis.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Critical Missing Skills for {targetRole}</span>
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
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Resume Strengths</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {analysis.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Improvement Opportunities</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {analysis.weaknesses.map((wk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Predicted Tailored Interview Questions */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-purple-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Predicted Questions Based on Your Resume</span>
              </h4>
              <button
                onClick={() => setActiveTab('setup')}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Practice These Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {analysis.tailored_interview_questions.map((q, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {q}
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
