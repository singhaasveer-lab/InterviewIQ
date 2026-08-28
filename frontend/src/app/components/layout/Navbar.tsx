"use client";

import Link from "next/link";
import ThemeToggle from "../theme-toggle";

export default function Navbar() {
  return (
    <nav className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-black tracking-tight text-slate-950 transition-colors duration-300 dark:text-white"
      >
        Interview
        <span className="text-violet-600 dark:text-violet-400">
          IQ
        </span>
      </Link>

      {/* Desktop navigation */}
      <div className="hidden items-center gap-8 md:flex">
        <a
          href="#how-it-works"
          className="text-sm font-semibold text-slate-600 transition-colors hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400"
        >
          How It Works
        </a>

        <a
          href="#features"
          className="text-sm font-semibold text-slate-600 transition-colors hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400"
        >
          Features
        </a>

        <a
          href="#why"
          className="text-sm font-semibold text-slate-600 transition-colors hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400"
        >
          Why InterviewIQ
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <Link
          href="/setup"
          className="hidden rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-700 dark:shadow-violet-950/40 sm:inline-flex"
        >
          Start Practice
        </Link>
      </div>
    </nav>
  );
}