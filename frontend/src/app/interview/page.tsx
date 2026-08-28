"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/theme-toggle";

type Question = {
  type: "mcq" | "text";
  question: string;
  options?: string[];
  correctAnswer?: string;
};

const TOTAL_QUESTIONS = 20;

export default function InterviewPage() {
  const router = useRouter();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * ---------------------------------------------------------
   * GENERATE / LOAD INTERVIEW
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const generateInterview = async () => {
      try {
        const savedPreferences =
          localStorage.getItem("interviewPreferences");

        if (!savedPreferences) {
          throw new Error(
            "Interview preferences were not found. Please start again from setup."
          );
        }

        const savedQuestions =
          localStorage.getItem("interviewQuestions");

        const savedQuestionsPreferences =
          localStorage.getItem("interviewQuestionsPreferences");

        if (
          savedQuestions &&
          savedQuestionsPreferences === savedPreferences
        ) {
          try {
            const cachedQuestions = JSON.parse(savedQuestions);

            if (
              Array.isArray(cachedQuestions) &&
              cachedQuestions.length === TOTAL_QUESTIONS
            ) {
              setQuestions(cachedQuestions);
              setIsGenerating(false);
              return;
            }
          } catch {
            localStorage.removeItem("interviewQuestions");
            localStorage.removeItem(
              "interviewQuestionsPreferences"
            );
          }
        }

        const response = await fetch("/api/generate-interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: savedPreferences,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Failed to generate interview."
          );
        }

        if (
          !Array.isArray(data?.questions) ||
          data.questions.length !== TOTAL_QUESTIONS
        ) {
          throw new Error(
            "The AI returned an invalid interview. Please try again."
          );
        }

        const cleanedQuestions: Question[] = data.questions
          .map((q: any) => ({
            type: q?.type === "mcq" ? "mcq" : "text",

            question:
              typeof q?.question === "string"
                ? q.question.trim()
                : "",

            options:
              Array.isArray(q?.options)
                ? q.options
                    .filter(
                      (option: any) =>
                        typeof option === "string" &&
                        option.trim()
                    )
                    .map((option: string) => option.trim())
                : undefined,

            correctAnswer:
              typeof q?.correctAnswer === "string"
                ? q.correctAnswer.trim()
                : undefined,
          }))
          .filter(
            (q: Question) => q.question.length > 0
          );

        if (cleanedQuestions.length !== TOTAL_QUESTIONS) {
          throw new Error(
            "Some generated questions were invalid. Please generate the interview again."
          );
        }

        const invalidMcq = cleanedQuestions.some(
          (q) =>
            q.type === "mcq" &&
            (!q.options || q.options.length < 2)
        );

        if (invalidMcq) {
          throw new Error(
            "The AI generated an invalid multiple-choice question. Please try again."
          );
        }

        setQuestions(cleanedQuestions);

        localStorage.removeItem("interviewAnswers");

        localStorage.setItem(
          "interviewQuestions",
          JSON.stringify(cleanedQuestions)
        );

        localStorage.setItem(
          "interviewQuestionsPreferences",
          savedPreferences
        );
      } catch (error) {
        console.error("Interview generation error:", error);

        setGenerationError(
          error instanceof Error
            ? error.message
            : "Failed to generate interview."
        );
      } finally {
        setIsGenerating(false);
      }
    };

    generateInterview();
  }, []);

  /*
   * ---------------------------------------------------------
   * SAVE PROGRESS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!questions.length) return;

    localStorage.setItem(
      "interviewProgress",
      JSON.stringify({
        currentQuestion,
        answers,
      })
    );
  }, [currentQuestion, answers, questions.length]);

  /*
   * ---------------------------------------------------------
   * LOAD CURRENT ANSWER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setSelectedAnswer(answers[currentQuestion] || "");
  }, [currentQuestion, answers]);

  /*
   * ---------------------------------------------------------
   * PROGRESS
   * ---------------------------------------------------------
   */

  const progress = useMemo(() => {
    if (!questions.length) return 0;

    return (
      ((currentQuestion + 1) / questions.length) * 100
    );
  }, [currentQuestion, questions.length]);

  /*
   * ---------------------------------------------------------
   * GENERATING SCREEN
   * ---------------------------------------------------------
   */

  if (isGenerating) {
    return (
      <main className="pastel-page pastel-grid relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* Background glow */}
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-200/60 blur-3xl dark:bg-violet-950/50" />

        <div className="pointer-events-none absolute -right-24 top-32 h-96 w-96 rounded-full bg-pink-200/60 blur-3xl dark:bg-fuchsia-950/40" />

        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-950/30" />

        {/* ALWAYS VISIBLE THEME BUTTON */}
        <div className="fixed right-5 top-5 z-[100]">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-3xl">
          <div className="overflow-hidden rounded-[2.5rem] border border-violet-200 bg-white/90 p-8 text-center shadow-2xl shadow-violet-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40 md:p-12">

            {/* Icon */}
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 text-5xl shadow-xl shadow-violet-100/70 dark:from-violet-950 dark:via-fuchsia-950 dark:to-pink-950 dark:shadow-violet-950/40">
              ✦
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
              Preparing your interview
            </p>

            <h1 className="mt-4 text-3xl font-black text-slate-950 dark:text-white md:text-5xl">
              <span className="text-violet-600 dark:text-violet-400">
                Gemini
              </span>{" "}
              is creating your interview
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400 md:text-lg">
              We&apos;re crafting personalized questions based on your
              role, experience, skills, and interview preferences.
            </p>

            {/* Progress */}
            <div className="mx-auto mt-9 max-w-xl">
              <div className="h-3 overflow-hidden rounded-full bg-violet-100 dark:bg-slate-800">
                <div className="h-full w-3/5 animate-pulse rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-300" />
              </div>

              <div className="mt-3 flex justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                <span>Analyzing your profile</span>
                <span>Almost there...</span>
              </div>
            </div>

            {/* Generation stages */}
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["📄", "Analyzing role"],
                ["🎯", "Selecting topics"],
                ["✦", "Generating questions"],
                ["🧾", "Finalizing"],
              ].map(([icon, label], index) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 transition ${
                    index === 2
                      ? "border-violet-300 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-700 dark:bg-violet-950/70 dark:text-violet-300"
                      : "border-violet-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-500"
                  }`}
                >
                  <div className="text-2xl">{icon}</div>

                  <p className="mt-2 text-xs font-bold leading-4">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400 dark:bg-slate-950 dark:text-slate-500">
              ✨ This usually takes only a few seconds.
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * GENERATION ERROR
   * ---------------------------------------------------------
   */

  if (generationError) {
    return (
      <main className="pastel-page pastel-grid relative flex min-h-screen items-center justify-center overflow-hidden px-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-violet-200/60 blur-3xl dark:bg-violet-950/40" />

        <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-pink-200/60 blur-3xl dark:bg-pink-950/30" />

        <div className="fixed right-5 top-5 z-[100]">
          <ThemeToggle />
        </div>

        <div className="relative z-10 w-full max-w-xl rounded-[2rem] border border-violet-200 bg-white/95 p-8 text-center shadow-2xl shadow-violet-200/40 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40 md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl dark:bg-rose-950/50">
            ⚠️
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-rose-500">
            Interview generation failed
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
            We couldn&apos;t create your interview
          </h1>

          <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
            {generationError}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-violet-600 px-6 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 dark:shadow-violet-950/40"
            >
              Try again
            </button>

            <button
              onClick={() => router.push("/setup")}
              className="rounded-full border border-violet-200 bg-white px-6 py-3 font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-slate-800"
            >
              Back to setup
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * SAFETY CHECK
   * ---------------------------------------------------------
   */

  const question = questions[currentQuestion];

  if (!question) {
    return (
      <main className="pastel-page pastel-grid relative flex min-h-screen items-center justify-center px-5 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="fixed right-5 top-5 z-[100]">
          <ThemeToggle />
        </div>

        <div className="rounded-[2rem] border border-violet-200 bg-white p-10 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-black">
            No interview question found.
          </h1>

          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Please start a new interview from the setup page.
          </p>

          <button
            onClick={() => router.push("/setup")}
            className="mt-6 rounded-full bg-violet-600 px-6 py-3 font-bold text-white"
          >
            Back to setup
          </button>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * SAVE ANSWER
   * ---------------------------------------------------------
   */

  const saveCurrentAnswer = () => {
    const trimmedAnswer = selectedAnswer.trim();

    if (!trimmedAnswer || isSubmitting) {
      return null;
    }

    const updatedAnswers = [...answers];

    updatedAnswers[currentQuestion] = trimmedAnswer;

    setAnswers(updatedAnswers);

    localStorage.setItem(
      "interviewAnswers",
      JSON.stringify(updatedAnswers)
    );

    localStorage.setItem(
      "interviewQuestions",
      JSON.stringify(questions)
    );

    return updatedAnswers;
  };

  /*
   * ---------------------------------------------------------
   * NEXT / FINISH
   * ---------------------------------------------------------
   */

  const submitAnswer = () => {
    const updatedAnswers = saveCurrentAnswer();

    if (!updatedAnswers) {
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((value) => value + 1);
      return;
    }

    setIsSubmitting(true);

    localStorage.setItem(
      "interviewAnswers",
      JSON.stringify(updatedAnswers)
    );

    localStorage.setItem(
      "interviewQuestions",
      JSON.stringify(questions)
    );

    localStorage.removeItem("interviewProgress");
    localStorage.removeItem("interviewEvaluation");

    router.push("/results");
  };

  /*
   * ---------------------------------------------------------
   * PREVIOUS
   * ---------------------------------------------------------
   */

  const goToPreviousQuestion = () => {
    if (currentQuestion === 0 || isSubmitting) {
      return;
    }

    const currentAnswer = selectedAnswer.trim();
    const updatedAnswers = [...answers];

    if (currentAnswer) {
      updatedAnswers[currentQuestion] = currentAnswer;
    }

    setAnswers(updatedAnswers);

    localStorage.setItem(
      "interviewAnswers",
      JSON.stringify(updatedAnswers)
    );

    setCurrentQuestion((value) => value - 1);

    setSelectedAnswer(
      updatedAnswers[currentQuestion - 1] || ""
    );
  };

  const answeredCount = answers.filter(
    (answer) =>
      typeof answer === "string" &&
      answer.trim().length > 0
  ).length;

  /*
   * ---------------------------------------------------------
   * INTERVIEW UI
   * ---------------------------------------------------------
   */

  return (
    <main className="pastel-page pastel-grid relative min-h-screen overflow-hidden px-5 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:px-8">

      {/* Background */}
      <div className="pointer-events-none absolute left-0 top-20 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-950/40" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-950/30" />

      <div className="relative z-10 mx-auto max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">

          <button
            onClick={() => router.push("/")}
            className="text-2xl font-black text-slate-950 dark:text-white"
          >
            Interview
            <span className="text-violet-600 dark:text-violet-400">
              IQ
            </span>
          </button>

          <div className="flex items-center gap-3">

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Question counter */}
            <div className="rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Question{" "}
              <span className="text-slate-900 dark:text-white">
                {currentQuestion + 1}
              </span>{" "}
              / {questions.length}
            </div>

          </div>
        </div>

        {/* Main card */}
        <div className="mt-10 rounded-[2rem] border border-violet-200 bg-white/95 p-6 shadow-2xl shadow-violet-100/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40 md:p-10">

          {/* Top section */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                Mock interview
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Take your time. Explain your thinking clearly.
              </p>
            </div>

            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {Math.round(progress)}%
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-violet-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {/* QUESTION CARD */}
          <div className="mt-10 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-6 dark:border-slate-700 dark:bg-slate-900 dark:bg-none md:p-8">

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700 shadow-sm dark:bg-violet-950 dark:text-violet-300">
                {question.type === "mcq"
                  ? "Multiple choice"
                  : "Open response"}
              </span>

              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Question {currentQuestion + 1} of{" "}
                {questions.length}
              </span>

            </div>

            {/* IMPORTANT:
                Explicit dark text + no opacity
            */}
            <h1 className="mt-5 text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">
              {question.question}
            </h1>

          </div>

          {/* Answer section */}
          <div className="mt-7">

            {question.type === "mcq" ? (
              <div className="grid gap-3">

                {question.options?.map((option, index) => {
                  const active = selectedAnswer === option;

                  return (
                    <button
                      key={`${currentQuestion}-${option}`}
                      type="button"
                      onClick={() =>
                        setSelectedAnswer(option)
                      }
                      className={`flex items-center gap-4 rounded-2xl border p-4 text-left font-medium transition ${
                        active
                          ? "border-violet-400 bg-violet-50 text-violet-950 shadow-md shadow-violet-100 dark:border-violet-600 dark:bg-violet-950/70 dark:text-violet-100 dark:shadow-violet-950/40"
                          : "border-violet-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          active
                            ? "bg-violet-600 text-white"
                            : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option}</span>
                    </button>
                  );
                })}

              </div>
            ) : (
              <textarea
                value={selectedAnswer}
                onChange={(event) =>
                  setSelectedAnswer(event.target.value)
                }
                placeholder="Type your answer here. Explain your approach, reasoning, and examples where useful…"
                className="min-h-52 w-full resize-y rounded-2xl border border-violet-200 bg-white p-5 leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-600 dark:focus:ring-violet-950"
              />
            )}

          </div>

          {/* Bottom controls */}
          <div className="mt-7 flex flex-col gap-4 border-t border-violet-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {answeredCount} of {questions.length} questions
                answered
              </p>

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Your answer is evaluated after the interview.
              </p>
            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={goToPreviousQuestion}
                disabled={
                  currentQuestion === 0 || isSubmitting
                }
                className="rounded-full border border-violet-200 bg-white px-5 py-3.5 font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-slate-800"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={submitAnswer}
                disabled={
                  !selectedAnswer.trim() || isSubmitting
                }
                className="rounded-full bg-violet-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:shadow-violet-950/40 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
              >
                {isSubmitting
                  ? "Finishing..."
                  : currentQuestion === questions.length - 1
                  ? "Finish Interview ✓"
                  : "Next Question →"}
              </button>

            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mx-auto mt-6 max-w-3xl text-center">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            💡 Tip: For open questions, focus on your reasoning
            rather than trying to give a perfect answer.
          </p>
        </div>

      </div>
    </main>
  );
}