import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Calendar,
  Layers,
  Code2,
  User,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, TabType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AICoachViewProps {
  setActiveTab: (tab: TabType) => void;
}

const QUICK_PROMPTS = [
  'Why did I score low on my last interview?',
  'Create a 7-day interview preparation plan for me.',
  'How should I answer: "Tell me about a time you had a conflict with an engineer"?',
  'Give me 3 tough React and TypeScript interview questions.',
  'Explain database indexing and when B-Trees outperform Hash indexes.',
  'How do I negotiate a higher base salary for a Senior role?',
];

export const AICoachView: React.FC<AICoachViewProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'coach-welcome',
      sender: 'assistant',
      text: `Welcome! I am your InterviewIQ Master Coach. I analyze your past mock performances, weak topics, and target roles to give you calibrated, highly actionable advice. How can I accelerate your preparation today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await api.sendMessage(text, historyPayload);

      const coachMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: res.reply,
        timestamp: res.timestamp,
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      showToast(err.message || 'AI Coach service temporarily busy. Please retry.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col glass-panel-glow rounded-3xl border border-white/10 overflow-hidden">
      {/* Coach Header Bar */}
      <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">InterviewIQ AI Career Coach</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Context-aware coaching calibrated to your mock interview history
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'coach-welcome',
                sender: 'assistant',
                text: `Session refreshed. What topic or interview scenario would you like to drill?`,
                timestamp: new Date().toISOString(),
              },
            ])
          }
          title="Clear Chat History"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-md shadow-purple-600/20 font-medium'
                    : 'bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-sm backdrop-blur-xl'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 rounded-tl-sm flex items-center gap-2 text-xs text-purple-300">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>AI Coach is synthesizing tactical advice...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-slate-950/30 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Suggested:
          </span>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(p)}
              className="px-3 py-1 rounded-full text-xs bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/5 transition shrink-0"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 border-t border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask your coach anything about technical questions, weak areas, or negotiation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 disabled:opacity-40 transition active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
