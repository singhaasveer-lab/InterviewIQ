import React, { useEffect, useState } from 'react';
import {
  Play,
  Sparkles,
  Plus,
  X,
  FileText,
  Briefcase,
  Layers,
  Sliders,
  CheckCircle2,
  Clock,
  HelpCircle,
  UploadCloud,
} from 'lucide-react';
import { TabType } from '../types';
import { useInterview } from '../context/InterviewContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface InterviewSetupViewProps {
  setActiveTab: (tab: TabType) => void;
}

const COMMON_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'AI/ML Engineer',
  'Data Analyst',
  'Cybersecurity Analyst',
  'Product Manager',
  'Cloud / DevOps Engineer',
];

const COMMON_SKILLS = [
  'React',
  'TypeScript',
  'Python',
  'SQL',
  'Node.js',
  'PostgreSQL',
  'System Design',
  'Docker',
  'FastAPI',
  'Machine Learning',
  'Tailwind CSS',
  'Git',
];

export const InterviewSetupView: React.FC<InterviewSetupViewProps> = ({ setActiveTab }) => {
  const { startInterview, isGenerating } = useInterview();
  const { showToast } = useToast();

  const [role, setRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [experience, setExperience] = useState('3-5 years');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [skillInput, setSkillInput] = useState('');

  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Prefill from the saved profile, then apply any weak-topic focus coming from the dashboard
  useEffect(() => {
    let cancelled = false;

    const takeFocus = (): string[] => {
      try {
        const raw = sessionStorage.getItem('interviewiq_interview_focus');
        sessionStorage.removeItem('interviewiq_interview_focus');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
      } catch {
        return [];
      }
    };

    const applyFocus = (base: string[]) => {
      const focus = takeFocus();
      if (focus.length === 0) return;
      setSkills([...focus, ...base.filter((sk) => !focus.includes(sk))]);
      showToast(`Practicing your weak area: ${focus.join(', ')}`, 'info');
    };

    api
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile.target_role) {
          if (COMMON_ROLES.includes(profile.target_role)) {
            setRole(profile.target_role);
          } else {
            setRole('Other');
            setCustomRole(profile.target_role);
          }
        }
        if (profile.experience) setExperience(profile.experience);
        if (profile.interview_type) setInterviewType(profile.interview_type);
        if (profile.difficulty) setDifficulty(profile.difficulty);
        if (profile.question_count) setQuestionCount(profile.question_count);
        const base = profile.skills.length > 0 ? profile.skills : ['React', 'TypeScript', 'Node.js'];
        if (profile.skills.length > 0) setSkills(profile.skills);
        applyFocus(base);
      })
      .catch(() => {
        if (!cancelled) applyFocus(['React', 'TypeScript', 'Node.js']);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResumeText(text || '');
      showToast(`Loaded ${file.name} context (${file.size} bytes)`, 'success');
    };
    reader.readAsText(file);
  };

  const handleStart = async () => {
    const finalRole = role === 'Other' ? customRole || 'Software Engineer' : role;
    const success = await startInterview({
      role: finalRole,
      experience,
      interview_type: interviewType,
      difficulty,
      question_count: questionCount,
      skills,
      job_description: jobDescription,
      resume_context: resumeText,
    });
    if (success) {
      // Remember this setup so next time the form is already filled in
      api
        .saveProfile({
          target_role: finalRole,
          experience,
          interview_type: interviewType,
          difficulty,
          question_count: questionCount,
          skills,
        })
        .catch(() => {
          /* saving preferences is best-effort */
        });
      setActiveTab('room');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tailored AI Question Generation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Configure Your Mock Interview
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select target parameters, skills, and target context. Gemini will generate questions
          calibrated strictly to your specifications.
        </p>
      </div>

      {/* Main Setup Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel-glow border border-white/10 space-y-7">
        {/* Role Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Target Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
            {COMMON_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left border transition ${
                  role === r
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm shadow-purple-500/20'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRole('Other')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left border transition ${
                role === 'Other'
                  ? 'bg-purple-600/30 border-purple-500 text-white'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              Other Role...
            </button>
          </div>

          {role === 'Other' && (
            <input
              type="text"
              placeholder="e.g. Solutions Architect, Rust Developer, iOS Engineer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          )}
        </div>

        {/* Experience & Interview Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Experience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Experience Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Beginner', 'Fresher', '1-2 years', '3-5 years', '5+ years'].map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setExperience(exp)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition ${
                    experience === exp
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Interview Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Technical', 'HR / Behavioral', 'Mixed'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInterviewType(type)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center border transition ${
                    interviewType === type
                      ? 'bg-cyan-600/30 border-cyan-500 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty & Strict Question Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Difficulty
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Easy', 'Medium', 'Hard', 'Adaptive'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-medium text-center border transition ${
                    difficulty === diff
                      ? 'bg-pink-600/30 border-pink-500 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count (NON-NEGOTIABLE STRICT REQUIREMENT) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Strict Question Count
              </label>
              <span className="text-[11px] font-bold text-purple-400">
                {questionCount} Questions Selected
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                    questionCount === count
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Tag Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
            Key Technologies & Skills
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick Skill Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAddSkill(s)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition border border-white/5 flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{s}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add another skill (e.g. GraphQL, Kubernetes, Pandas)..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(skillInput)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Job Description & Resume Context Accordions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/5">
          {/* Target Job Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Target Job Description (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Paste job description or requirements to align question prompts..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Resume Upload / Context */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Resume Context (Optional)
              </label>
              <label className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF/TXT</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {uploadedFileName && (
              <div className="p-2 mb-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center justify-between">
                <span>File attached: {uploadedFileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFileName(null);
                    setResumeText('');
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <textarea
              rows={uploadedFileName ? 2 : 4}
              placeholder="Paste resume summary or projects text to simulate questions based on your background..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>
              Estimated session duration: ~{questionCount * 2} - {questionCount * 3} mins
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-xl shadow-purple-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating {questionCount} Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START INTERVIEW</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
