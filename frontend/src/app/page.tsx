import Link from "next/link";
import Navbar from "./components/layout/Navbar";

const features = [
  [
    "🎯",
    "Personalized questions",
    "Questions adapt to your role, experience, skills and target job.",
  ],
  [
    "🤖",
    "AI-powered feedback",
    "Get practical feedback on technical knowledge, reasoning and communication.",
  ],
  [
    "📊",
    "Performance insights",
    "See your score, strengths, weaknesses and what to practice next.",
  ],
];

export default function Home() {
  return (
    <main className="pastel-page pastel-grid min-h-screen text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-28 top-28 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-900/20" />

      <div className="pointer-events-none absolute -right-20 top-48 h-80 w-80 rounded-full bg-pink-200/50 blur-3xl dark:bg-pink-900/20" />

      <Navbar />

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-20 md:px-8 md:pt-28">
        {/* Hero */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur transition-colors duration-300 dark:border-violet-800 dark:bg-slate-900/70 dark:text-violet-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />

            Your AI-powered interview companion
          </div>

          <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-slate-950 transition-colors duration-300 dark:text-white md:text-7xl">
            Practice smarter.
            <br />

            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
              Interview better.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600 transition-colors duration-300 dark:text-slate-300 md:text-xl">
            InterviewIQ creates realistic mock interviews, lets you practice
            in your own words, and turns every attempt into a clear improvement
            plan.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/setup"
              className="rounded-full bg-violet-600 px-8 py-4 font-semibold text-white shadow-xl shadow-violet-200 transition duration-300 hover:-translate-y-1 hover:bg-violet-700 hover:shadow-violet-300 dark:shadow-violet-950/40 dark:hover:shadow-violet-950/60"
            >
              Start Your Practice ✨
            </Link>

            <a
              href="#how-it-works"
              className="rounded-full border border-violet-200 bg-white/70 px-8 py-4 font-semibold text-slate-700 backdrop-blur transition duration-300 hover:border-violet-300 hover:bg-white dark:border-violet-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-slate-800"
            >
              See How It Works →
            </a>
          </div>
        </div>

        {/* Statistics */}
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 overflow-hidden rounded-3xl border border-violet-100 bg-white/70 shadow-xl shadow-violet-100/50 backdrop-blur transition-colors duration-300 dark:border-violet-900 dark:bg-slate-900/70 dark:shadow-none">
          {[
            ["AI", "Powered feedback"],
            ["20", "Questions per session"],
            ["∞", "Practice rounds"],
          ].map(([value, label], index) => (
            <div
              key={label}
              className={`px-4 py-6 text-center ${
                index
                  ? "border-l border-violet-100 dark:border-violet-900"
                  : ""
              }`}
            >
              <p className="text-2xl font-black text-slate-900 transition-colors duration-300 dark:text-white md:text-3xl">
                {value}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 transition-colors duration-300 dark:text-slate-400 md:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div
          id="how-it-works"
          className="mx-auto mt-16 max-w-5xl rounded-[2rem] border border-violet-100 bg-white/80 p-5 shadow-2xl shadow-violet-100/60 backdrop-blur transition-colors duration-300 dark:border-violet-900 dark:bg-slate-900/80 dark:shadow-none md:p-8"
        >
          <div className="flex items-center justify-between border-b border-violet-100 pb-5 transition-colors duration-300 dark:border-violet-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-xl transition-colors duration-300 dark:bg-violet-950">
                ✦
              </div>

              <div>
                <p className="font-bold text-slate-900 transition-colors duration-300 dark:text-white">
                  AI Mock Interview
                </p>

                <p className="text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400">
                  Personalized • Adaptive • Practical
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors duration-300 dark:bg-emerald-950/50 dark:text-emerald-400">
              Ready
            </span>
          </div>

          <div className="mt-7 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-pink-50 p-6 transition-colors duration-300 dark:from-violet-950/40 dark:via-slate-900 dark:to-pink-950/30 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  Question 04 of 20
                </p>

                <h2 className="mt-2 max-w-2xl text-2xl font-bold leading-tight text-slate-900 transition-colors duration-300 dark:text-white md:text-3xl">
                  How would you design an API that stays reliable under heavy
                  traffic?
                </h2>
              </div>

              <div className="rounded-2xl bg-white/80 px-5 py-4 text-center shadow-sm transition-colors duration-300 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Progress
                </p>

                <p className="mt-1 text-2xl font-black text-violet-600 dark:text-violet-400">
                  20%
                </p>
              </div>
            </div>

            <div className="mt-7 h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-950">
              <div className="h-full w-1/5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
            </div>
          </div>
        </div>

        {/* Features */}
        <div
          id="features"
          className="mx-auto mt-20 max-w-6xl"
        >
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
              Built for better practice
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900 transition-colors duration-300 dark:text-white md:text-4xl">
              Everything you need to turn practice into progress.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map(([icon, title, text]) => (
              <div
                key={title}
                className="glass-card rounded-3xl p-7 transition duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl transition-colors duration-300 dark:bg-violet-950">
                  {icon}
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900 transition-colors duration-300 dark:text-white">
                  {title}
                </h3>

                <p className="mt-2 leading-7 text-slate-500 transition-colors duration-300 dark:text-slate-400">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why InterviewIQ */}
        <div
          id="why"
          className="mx-auto mt-16 max-w-4xl rounded-[2rem] border border-violet-100 bg-gradient-to-r from-violet-100/70 via-white to-pink-100/60 p-8 text-center shadow-xl shadow-violet-100/40 transition-colors duration-300 dark:border-violet-900 dark:from-violet-950/60 dark:via-slate-900 dark:to-pink-950/40 dark:shadow-none md:p-12"
        >
          <p className="text-3xl">✨</p>

          <h2 className="mt-3 text-3xl font-black text-slate-900 transition-colors duration-300 dark:text-white">
            Your next interview should feel familiar.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600 transition-colors duration-300 dark:text-slate-300">
            Do the hard part before the real interview: think out loud, make
            mistakes, learn from them, and try again.
          </p>

          <Link
            href="/setup"
            className="mt-7 inline-flex rounded-full bg-slate-950 px-7 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Build My Interview →
          </Link>
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </section>
    </main>
  );
}