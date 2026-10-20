import React, { useState, useEffect } from 'react';
import { TabType } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InterviewProvider } from './context/InterviewContext';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';

// Views
import { LandingView } from './views/LandingView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { InterviewSetupView } from './views/InterviewSetupView';
import { InterviewRoomView } from './views/InterviewRoomView';
import { InterviewResultsView } from './views/InterviewResultsView';
import { AICoachView } from './views/AICoachView';
import { ResumeAnalyzerView } from './views/ResumeAnalyzerView';
import { JobAnalyzerView } from './views/JobAnalyzerView';
import { RAGKnowledgeView } from './views/RAGKnowledgeView';
import { AnalyticsView } from './views/AnalyticsView';
import { HistoryView } from './views/HistoryView';
import { LearningPathView } from './views/LearningPathView';
import { CodingInterviewView } from './views/CodingInterviewView';
import { VoiceInterviewView } from './views/VoiceInterviewView';
import { SettingsView } from './views/SettingsView';
import { AptitudeView } from './views/AptitudeView';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Tab state synced with URL pathname
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const path = window.location.pathname.replace(/^\//, '');
    const validTabs: TabType[] = [
      'landing',
      'login',
      'register',
      'dashboard',
      'setup',
      'room',
      'results',
      'coach',
      'resume',
      'job',
      'rag',
      'history',
      'analytics',
      'learning',
      'coding',
      'voice',
      'aptitude',
      'settings',
    ];
    if (validTabs.includes(path as TabType)) {
      return path as TabType;
    }
    return 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync tab changes with Browser History API
  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const targetUrl = tab === 'dashboard' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ tab }, '', targetUrl);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTabState(e.state.tab);
      } else {
        const path = window.location.pathname.replace(/^\//, '');
        if (path) {
          setActiveTabState(path as TabType);
        } else {
          setActiveTabState('dashboard');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const publicTabs: TabType[] = ['landing', 'login', 'register'];
  const isPublicTab = publicTabs.includes(activeTab);

  // Route guard: private pages need a session, auth pages are skipped once signed in
  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublicTab) {
      setActiveTab('login');
    } else if (user && (activeTab === 'login' || activeTab === 'register')) {
      setActiveTab('dashboard');
    }
  }, [user, isLoading, activeTab]);

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingView setActiveTab={setActiveTab} />;
      case 'login':
        return <AuthView initialMode="login" setActiveTab={setActiveTab} />;
      case 'register':
        return <AuthView initialMode="register" setActiveTab={setActiveTab} />;
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'setup':
        return <InterviewSetupView setActiveTab={setActiveTab} />;
      case 'room':
        return <InterviewRoomView setActiveTab={setActiveTab} />;
      case 'results':
        return <InterviewResultsView setActiveTab={setActiveTab} />;
      case 'coach':
        return <AICoachView setActiveTab={setActiveTab} />;
      case 'resume':
        return <ResumeAnalyzerView setActiveTab={setActiveTab} />;
      case 'job':
        return <JobAnalyzerView setActiveTab={setActiveTab} />;
      case 'rag':
        return <RAGKnowledgeView setActiveTab={setActiveTab} />;
      case 'analytics':
        return <AnalyticsView setActiveTab={setActiveTab} />;
      case 'history':
        return <HistoryView setActiveTab={setActiveTab} />;
      case 'learning':
        return <LearningPathView setActiveTab={setActiveTab} />;
      case 'coding':
        return <CodingInterviewView setActiveTab={setActiveTab} />;
      case 'voice':
        return <VoiceInterviewView setActiveTab={setActiveTab} />;
      case 'aptitude':
        return <AptitudeView setActiveTab={setActiveTab} />;
      case 'settings':
        return <SettingsView setActiveTab={setActiveTab} />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)] text-sm">
        Loading InterviewIQ...
      </div>
    );
  }

  // Signed-out visitors get chrome-free pages (no sidebar/header)
  const isFullScreenView = !user || activeTab === 'landing';

  return (
    <InterviewProvider setActiveTab={setActiveTab}>
      <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
        {/* Persistent Left Sidebar */}
        {!isFullScreenView && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
          />
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen ${!isFullScreenView ? 'lg:pl-64' : ''}`}>
          {/* Top Header */}
          {!isFullScreenView && (
            <TopHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          )}

          {/* View Container with Smooth Transition */}
          <main className={`flex-1 ${!isFullScreenView ? 'p-4 sm:p-6 lg:p-8' : ''}`}>
            <div key={activeTab} className="transition-all duration-300 ease-out animate-fadeIn">
              {!user && !isPublicTab ? (
                <AuthView initialMode="login" setActiveTab={setActiveTab} />
              ) : (
                renderCurrentView()
              )}
            </div>
          </main>
        </div>
      </div>
    </InterviewProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
