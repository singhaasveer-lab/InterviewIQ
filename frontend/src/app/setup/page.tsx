"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/theme-toggle";

const roles = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
];

const experienceLevels = [
  "Fresher",
  "1–3 Years",
  "3+ Years",
];

const interviewTypes = [
  "Technical",
  "HR / Behavioral",
  "Mixed",
];

export default function SetupPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState("");
  const [selectedExperience, setSelectedExperience] =
    useState("");
  const [selectedType, setSelectedType] = useState("");
  const [skills, setSkills] = useState("");
  const [jobDescription, setJobDescription] =
    useState("");

  const canStart = Boolean(
    selectedRole &&
      selectedExperience &&
      selectedType
  );

  const handleStartInterview = () => {
    if (!canStart) return;

    localStorage.removeItem("interviewAnswers");
    localStorage.removeItem("interviewQuestions");
    localStorage.removeItem("interviewEvaluation");

    localStorage.setItem(
      "interviewPreferences",
      JSON.stringify({
        role: selectedRole,
        experience: selectedExperience,
        interviewType: selectedType,
        skills: skills.trim(),
        jobDescription: jobDescription.trim(),
      })
    );

    router.push("/interview");
  };

  const optionClass = (active: boolean) =>
    active
      ? "border-violet-400 bg-violet-50 text-violet-800 shadow-md shadow-violet-100 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-200 dark:shadow-none"
      : "border-violet-100 bg-white/60 text-slate-600 hover:border-violet-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:bg-slate-900";

  return (
    <main className="pastel-page pastel-grid min-h-screen text-slate-900 dark:text-slate-100">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-900/20" />

      <div className="pointer-events-none absolute -right-28 top-40 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl dark:bg-pink-900/20" />

      <div className="relative mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-violet-100 pb-6 dark:border-slate-800">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-black tracking-tight"
          >
            Interview
            <span className="text-violet-600">
              IQ
            </span>
          </button>

          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <ThemeToggle />

            {/* Progress */}
            <div className="rounded-full border border-violet-100 bg-white/70 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              Step{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                1
              </span>{" "}
              of 3
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mx-auto mt-8 flex max-w-md items-center justify-center">
          <div className="flex items-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-200 dark:shadow-none">
                1
              </div>

              <span className="mt-2 text-xs font-semibold text-violet-600">
                Setup
              </span>
            </div>

            <div className="mx-3 h-px w-16 bg-violet-200 dark:bg-slate-700 sm:w-24" />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-violet-200 bg-white text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                2
              </div>

              <span className="mt-2 text-xs font-medium text-slate-400">
                Interview
              </span>
            </div>

            <div className="mx-3 h-px w-16 bg-violet-200 dark:bg-slate-700 sm:w-24" />

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-violet-200 bg-white text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                3
              </div>

              <span className="mt-2 text-xs font-medium text-slate-400">
                Results
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mx-auto max-w-4xl pb-16 pt-14">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="inline-flex rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm dark:border-violet-800 dark:bg-slate-900/70 dark:text-violet-300">
              ✨ Let&apos;s personalize your interview
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">
              Tell us what you&apos;re{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                preparing for.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
              We&apos;ll use these details to build a
              realistic interview instead of throwing
              generic questions at you.
            </p>
          </div>

          {/* Setup Card */}
          <section className="glass-card rounded-[2rem] p-6 dark:border-slate-800 dark:bg-slate-900/70 md:p-9">
            {/* Role */}
            <div className="mb-9">
              <h2 className="text-xl font-bold">
                What role are you interviewing for?
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() =>
                      setSelectedRole(role)
                    }
                    className={`rounded-2xl border p-5 text-left font-semibold transition ${optionClass(
                      selectedRole === role
                    )}`}
                  >
                    {role}

                    <span
                      className={`float-right ${
                        selectedRole === role
                          ? "text-violet-600"
                          : "text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="mb-9">
              <h2 className="text-xl font-bold">
                What&apos;s your experience level?
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {experienceLevels.map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setSelectedExperience(
                          level
                        )
                      }
                      className={`rounded-2xl border p-5 font-semibold transition ${optionClass(
                        selectedExperience ===
                          level
                      )}`}
                    >
                      {level}

                      {selectedExperience ===
                        level && (
                        <span className="ml-2 text-violet-600">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Interview Type */}
            <div className="mb-9">
              <h2 className="text-xl font-bold">
                What type of interview?
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {interviewTypes.map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setSelectedType(type)
                      }
                      className={`rounded-2xl border p-5 font-semibold transition ${optionClass(
                        selectedType === type
                      )}`}
                    >
                      {type}

                      {selectedType === type && (
                        <span className="ml-2 text-violet-600">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-9">
              <label className="text-xl font-bold">
                What skills should we focus on?
              </label>

              <input
                value={skills}
                onChange={(e) =>
                  setSkills(e.target.value)
                }
                placeholder="e.g. React, Python, SQL, Node.js"
                className="mt-5 w-full rounded-2xl border border-violet-100 bg-white/70 px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-950"
              />

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Optional. Add technologies or skills
                you want to practice.
              </p>
            </div>

            {/* Job Description */}
            <div>
              <label className="text-xl font-bold">
                Paste the target job description
              </label>

              <textarea
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(
                    e.target.value
                  )
                }
                rows={7}
                placeholder="Optional. Paste the job description and InterviewIQ will tailor questions around it."
                className="mt-5 w-full rounded-2xl border border-violet-100 bg-white/70 px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-950"
              />

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                The AI will use relevant
                responsibilities and technologies
                from this description.
              </p>
            </div>

            {/* Start button */}
            <button
              onClick={handleStartInterview}
              disabled={!canStart}
              className={`mt-9 w-full rounded-2xl py-5 text-lg font-bold transition ${
                canStart
                  ? "bg-violet-600 text-white shadow-xl shadow-violet-200 hover:-translate-y-0.5 hover:bg-violet-700 dark:shadow-none"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {canStart
                ? "Build My Interview 🚀"
                : "Choose your role, experience and interview type"}
            </button>
          </section>

          {/* Bottom reassurance */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              🔒 Your interview preferences stay
              in this browser.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}