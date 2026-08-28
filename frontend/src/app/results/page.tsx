"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type QuestionEvaluation = {
  questionNumber?: number;
  question?: string;
  candidateAnswer?: string;
  type?: "mcq" | "text";
  score?: number;
  verdict?: string;
  evaluation?: string;
  correctAnswer?: string | null;
  explanation?: string;
};

type Evaluation = {
  overallScore?: number;
  technicalKnowledge?: number;
  problemSolving?: number;
  communication?: number;
  interviewReadiness?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  recommendedTopics?: string[];
  questionEvaluations?: QuestionEvaluation[];
};

export default function ResultsPage() {
  const router = useRouter();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [mcqAccuracy, setMcqAccuracy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedAnswers = localStorage.getItem("interviewAnswers");
    const savedQuestions = localStorage.getItem("interviewQuestions");
    const savedEvaluation = localStorage.getItem("interviewEvaluation");

    if (!savedAnswers || !savedQuestions) {
      setError(
        "Your interview session could not be found. Please start a new practice round."
      );
      setLoading(false);
      return;
    }

    try {
      const answers = JSON.parse(savedAnswers);
      const questions = JSON.parse(savedQuestions);

      if (!Array.isArray(answers) || !Array.isArray(questions)) {
        throw new Error("Invalid saved interview data.");
      }

      setTotalQuestions(questions.length);

      const answered = answers.filter(
        (answer: unknown) =>
          typeof answer === "string" && answer.trim().length > 0
      ).length;

      setAnsweredQuestions(answered);

      const mcqs = questions.filter(
        (question: any) => question?.type === "mcq"
      );

      const correct = mcqs.filter((question: any) => {
        const questionIndex = questions.indexOf(question);

        return (
          answers[questionIndex] === question.correctAnswer
        );
      }).length;

      setMcqAccuracy(
        mcqs.length > 0
          ? Math.round((correct / mcqs.length) * 100)
          : 0
      );

      /*
       * If we already evaluated this exact interview,
       * reuse the saved evaluation instead of calling Gemini again.
       */

      if (savedEvaluation) {
        try {
          const cachedEvaluation = JSON.parse(savedEvaluation);

          if (
            cachedEvaluation &&
            Array.isArray(cachedEvaluation.questionEvaluations)
          ) {
            setEvaluation(cachedEvaluation);
            setLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem("interviewEvaluation");
        }
      }

      evaluateInterview(questions, answers);
    } catch (err) {
      console.error("Results loading error:", err);

      setError(
        "Saved interview data is invalid. Please start the interview again."
      );

      setLoading(false);
    }
  }, []);

  const evaluateInterview = async (
    questions: any[],
    answers: string[]
  ) => {
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to evaluate interview."
        );
      }

      localStorage.setItem(
        "interviewEvaluation",
        JSON.stringify(data)
      );

      setEvaluation(data);
    } catch (err) {
      console.error("Interview evaluation error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate AI feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  const score = Math.min(
    Math.max(evaluation?.overallScore ?? 0, 0),
    100
  );

  const readiness = Math.min(
    Math.max(evaluation?.interviewReadiness ?? 0, 0),
    100
  );

  const performance =
    score >= 80
      ? "Excellent performance! 🚀"
      : score >= 60
      ? "You're on the right track. 💪"
      : score >= 40
      ? "Good start. Keep improving. 📈"
      : "Time to train. Every interview is another rep. 🎯";

  const metrics = [
    {
      name: "Technical Knowledge",
      value: evaluation?.technicalKnowledge ?? 0,
      description: "Concepts, fundamentals & accuracy",
    },
    {
      name: "Problem Solving",
      value: evaluation?.problemSolving ?? 0,
      description: "Logic, reasoning & approach",
    },
    {
      name: "Communication",
      value: evaluation?.communication ?? 0,
      description: "Clarity, structure & explanation",
    },
  ];

  const startNewInterview = () => {
    localStorage.removeItem("interviewAnswers");
    localStorage.removeItem("interviewQuestions");
    localStorage.removeItem("interviewEvaluation");

    router.push("/setup");
  };

  return (
    <main className="pastel-page pastel-grid min-h-screen px-5 py-10 text-slate-900 md:px-8">
      {/* Background */}
      <div className="pointer-events-none fixed -left-28 top-28 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl" />

      <div className="pointer-events-none fixed -right-20 top-48 h-80 w-80 rounded-full bg-pink-200/50 blur-3xl" />

      <div className="pointer-events-none fixed bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-black tracking-tight"
          >
            Interview
            <span className="text-violet-600">IQ</span>
          </button>

          <span className="rounded-full border border-violet-100 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm backdrop-blur">
            ✨ Interview complete
          </span>
        </div>

        {/* Hero */}
        <header className="mx-auto max-w-3xl py-14 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            Your performance report
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            You made it through. 🎉
          </h1>

          <p className="mt-4 text-lg text-slate-500">
            Here's what your mock interview tells us.
          </p>
        </header>

        {/* Overall Score */}
        <section className="glass-card relative overflow-hidden rounded-[2rem] p-7 md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-200/60 blur-3xl" />

          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-pink-200/50 blur-3xl" />

          <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
                Overall performance
              </p>

              <div className="mt-2 flex items-end justify-center gap-2 md:justify-start">
                <span className="text-7xl font-black">
                  {score}
                </span>

                <span className="mb-3 text-2xl font-bold text-violet-500">
                  /100
                </span>
              </div>

              <p className="mt-2 text-slate-500">
                Your AI-powered interview score
              </p>
            </div>

            {/* Readiness */}
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full p-2 shadow-lg shadow-violet-100"
              style={{
                background: `conic-gradient(#8b5cf6 ${readiness}%, #ede9fe 0)`,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-black">
                  {readiness}%
                </span>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ready
                </span>
              </div>
            </div>
          </div>

          <div className="relative mt-8 border-t border-violet-100 pt-6">
            <p className="text-lg font-bold">
              {performance}
            </p>
          </div>
        </section>

        {/* Metrics */}
        <div className="mt-7 grid gap-7 lg:grid-cols-[1.4fr_.8fr]">

          <section className="glass-card rounded-[2rem] p-7">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
              Performance
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Your skill breakdown
            </h2>

            <div className="mt-8 space-y-7">
              {metrics.map((metric) => {
                const value = Math.min(
                  Math.max(metric.value, 0),
                  100
                );

                return (
                  <div key={metric.name}>
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {metric.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {metric.description}
                        </p>
                      </div>

                      <span className="font-black text-violet-600">
                        {value}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700"
                        style={{
                          width: `${value}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Stats */}
          <section className="glass-card rounded-[2rem] p-7">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
              Quick stats
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="rounded-2xl bg-violet-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Questions
                </p>

                <p className="mt-2 text-2xl font-black">
                  {totalQuestions}
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Answered
                </p>

                <p className="mt-2 text-2xl font-black">
                  {answeredQuestions}
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  MCQ accuracy
                </p>

                <p className="mt-2 text-2xl font-black">
                  {mcqAccuracy}%
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50/70 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Interview score
                </p>

                <p className="mt-2 text-2xl font-black">
                  {score}%
                </p>
              </div>

            </div>
          </section>
        </div>

        {/* AI Feedback */}
        <section className="mt-7 rounded-[2rem] border border-violet-200 bg-white/75 p-7 shadow-xl shadow-violet-100/50 backdrop-blur">

          <p className="font-bold text-violet-600">
            🤖 AI Feedback
          </p>

          {loading ? (
            <div className="mt-6 animate-pulse">

              <div className="h-5 w-2/3 rounded bg-violet-100" />

              <div className="mt-4 h-4 w-full rounded bg-violet-50" />

              <div className="mt-2 h-4 w-5/6 rounded bg-violet-50" />

              <div className="mt-2 h-4 w-4/6 rounded bg-violet-50" />

            </div>
          ) : error ? (

            <div className="mt-5 rounded-2xl bg-rose-50 p-5 text-rose-700">

              <p className="font-semibold">
                We couldn't generate the report.
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
              >
                Try again
              </button>

            </div>

          ) : (

            <div className="mt-5">

              <h2 className="text-2xl font-black">
                {performance}
              </h2>

              <p className="mt-4 leading-8 text-slate-600">
                {evaluation?.feedback ||
                  "Your AI evaluation is ready. Review the breakdown below to identify your strongest areas and where you can improve."}
              </p>

              <div className="mt-7 grid gap-6 md:grid-cols-3">

                {/* Strengths */}
                <div>
                  <h3 className="font-bold">
                    💪 What you did well
                  </h3>

                  {evaluation?.strengths?.length ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {evaluation.strengths.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No specific strengths were provided.
                    </p>
                  )}
                </div>

                {/* Improvements */}
                <div>
                  <h3 className="font-bold">
                    🎯 What to improve
                  </h3>

                  {evaluation?.improvements?.length ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {evaluation.improvements.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No specific improvements were provided.
                    </p>
                  )}
                </div>

                {/* Topics */}
                <div>
                  <h3 className="font-bold">
                    📚 Recommended topics
                  </h3>

                  {evaluation?.recommendedTopics?.length ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {evaluation.recommendedTopics.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No recommended topics were provided.
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}
        </section>

        {/* Question Evaluation */}
        {!loading &&
        !error &&
        evaluation?.questionEvaluations &&
        evaluation.questionEvaluations.length > 0 ? (

          <section className="mt-7">

            <div className="mb-5">

              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
                Deep dive
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Question-by-question evaluation
              </h2>

            </div>

            <div className="space-y-4">

              {evaluation.questionEvaluations.map(
                (item, index) => (

                  <details
                    key={`${item.questionNumber ?? index}-${index}`}
                    className="group glass-card rounded-3xl p-5"
                  >

                    <summary className="cursor-pointer list-none">

                      <div className="flex items-center justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                            Question{" "}
                            {item.questionNumber ??
                              index + 1}
                          </p>

                          <p className="mt-1 font-bold">
                            {item.question ||
                              "Question unavailable"}
                          </p>

                        </div>

                        <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-700">
                          {item.score ?? 0}/100
                        </span>

                      </div>

                    </summary>

                    <div className="mt-5 grid gap-5 border-t border-violet-100 pt-5 md:grid-cols-2">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Your answer
                        </p>

                        <p className="mt-2 leading-7 text-slate-600">
                          {item.candidateAnswer ||
                            "No answer provided."}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Verdict
                        </p>

                        <p className="mt-2 font-bold text-violet-700">
                          {item.verdict ||
                            "Not evaluated"}
                        </p>

                        {item.evaluation && (
                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {item.evaluation}
                          </p>
                        )}
                      </div>

                      {item.correctAnswer && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Correct answer
                          </p>

                          <p className="mt-2 font-semibold">
                            {item.correctAnswer}
                          </p>
                        </div>
                      )}

                      {item.explanation && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Explanation
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.explanation}
                          </p>
                        </div>
                      )}

                    </div>
                  </details>
                )
              )}

            </div>
          </section>

        ) : null}

        {/* Bottom Buttons */}
        <div className="flex flex-col justify-center gap-3 py-10 sm:flex-row">

          <button
            onClick={startNewInterview}
            className="rounded-full bg-violet-600 px-7 py-3.5 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 hover:shadow-xl"
          >
            Practice Again 🚀
          </button>

          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-violet-200 bg-white px-7 py-3.5 font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50"
          >
            Back Home
          </button>

        </div>

      </div>
    </main>
  );
}