"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDark(false);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      document.documentElement.classList.toggle(
        "dark",
        prefersDark
      );

      setDark(prefersDark);
    }

    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !dark;

    document.documentElement.classList.toggle(
      "dark",
      nextTheme
    );

    localStorage.setItem(
      "theme",
      nextTheme ? "dark" : "light"
    );

    setDark(nextTheme);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="h-10 w-10 rounded-full border border-violet-200 bg-white/70 opacity-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="group flex h-10 w-10 items-center justify-center rounded-full border border-violet-200 bg-white/70 text-lg shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-violet-700 dark:hover:bg-slate-800"
    >
      <span
        className="transition-transform duration-300 group-hover:rotate-12"
        aria-hidden="true"
      >
        {dark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}