import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safe initial default to prevent hydration / SSR mismatch
  const [theme, setThemeState] = useState<ThemePreference>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Client-only initialization
  useEffect(() => {
    try {
      const saved = localStorage.getItem('interviewiq_theme') as ThemePreference | null;
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
        setThemeState(saved);
      }
    } catch {
      // In restricted iframe environments, localStorage might throw
    }
  }, []);

  // Sync DOM classes whenever theme changes or system preference shifts
  useEffect(() => {
    const updateResolvedTheme = () => {
      let active: ResolvedTheme = 'dark';
      if (theme === 'system') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = prefersDark ? 'dark' : 'light';
      } else {
        active = theme;
      }

      setResolvedTheme(active);

      const root = document.documentElement;
      if (active === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        document.body.classList.remove('light');
        document.body.classList.add('dark');
      }
    };

    updateResolvedTheme();

    try {
      localStorage.setItem('interviewiq_theme', theme);
    } catch {}

    if (theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateResolvedTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  const setTheme = (t: ThemePreference) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
