import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
} from 'lucide-react';
import { TabType } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface VoiceInterviewViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const VoiceInterviewView: React.FC<VoiceInterviewViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const [currentPrompt, setCurrentPrompt] = useState(
    'Tell me about a challenging distributed systems or architectural failure you diagnosed, and what preventative guardrails you established.'
  );

  const [history, setHistory] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: 'Tell me about a challenging distributed systems or architectural failure you diagnosed, and what preventative guardrails you established.',
    },
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition support in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = 'en-US';

    recognizer.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognizer.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        showToast('Microphone access was denied. Please allow microphone permissions.', 'error');
      }
    };

    recognizer.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognizer;

    return () => {
      try {
        recognizer.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionSupported) {
      showToast('Speech recognition is not supported in this browser. You can type your answer.', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      showToast('Microphone paused.', 'info');
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        showToast('Microphone listening... Speak naturally.', 'success');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Browser Speech Synthesis is not supported.', 'error');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendSpokenAnswer = async () => {
    const fullText = (transcript + ' ' + interimTranscript).trim();
    if (!fullText) {
      showToast('No speech detected yet. Speak into the mic or type below.', 'info');
      return;
    }

    const updated = [...history, { sender: 'user' as const, text: fullText }];
    setHistory(updated);
    setTranscript('');
    setInterimTranscript('');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    try {
      setIsSynthesizing(true);
      showToast('AI interviewer is evaluating your verbal response...', 'info');

      const res = await api.sendMessage(
        `[Voice Interview Response to: "${currentPrompt}"]: "${fullText}". Provide concise 2-sentence conversational feedback and your next follow-up question.`,
        []
      );

      const aiReply = res.reply;
      setHistory([...updated, { sender: 'ai' as const, text: aiReply }]);
      setCurrentPrompt(aiReply);

      // Speak AI response automatically
      handleSpeakText(aiReply);
    } catch (err: any) {
      showToast(err.message || 'AI speech evaluation failed.', 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Speech Recognition & TTS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Voice Speech Mock Interview
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Simulate a phone screen or Zoom round. Speak your responses verbally; our speech engine
          transcribes and delivers AI audio feedback.
        </p>
      </div>

      {!recognitionSupported && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            Native speech recognition is not available in your browser. You can still use the audio
            listen feature and type your answers in the transcript box.
          </span>
        </div>
      )}

      {/* Main Voice Center Card */}
      <div className="p-8 sm:p-12 rounded-3xl glass-panel-glow border border-white/10 text-center space-y-8 relative overflow-hidden">
        {/* Animated Sound Wave Sphere */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-cyan-500/20 animate-ping'
                : isSpeaking
                ? 'bg-purple-500/20 animate-pulse'
                : 'bg-white/5'
            }`}
          />
          <div
            className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl ${
              isListening
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 border-cyan-400 shadow-cyan-500/40 scale-105'
                : isSpeaking
                ? 'bg-gradient-to-tr from-purple-600 to-pink-600 border-purple-400 shadow-purple-500/40'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
          >
            {isListening ? (
              <Mic className="w-10 h-10 text-white animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 text-white animate-pulse" />
            ) : (
              <MicOff className="w-10 h-10 text-slate-400" />
            )}
          </div>
        </div>

        {/* Live Audio Status */}
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">
            {isListening
              ? 'Listening to your speech...'
              : isSpeaking
              ? 'AI Interviewer speaking...'
              : 'Microphone is currently idle'}
          </p>
          <p className="text-xs text-slate-400">
            {isListening
              ? 'Speak clearly into your microphone. Click Pause when finished.'
              : 'Click Start Microphone to record your response.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`px-6 py-3 rounded-2xl font-bold text-xs transition flex items-center gap-2 shadow-lg active:scale-95 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30'
            }`}
          >
            {isListening ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE MICROPHONE</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>START MICROPHONE</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSpeakText(currentPrompt)}
            className="px-5 py-3 rounded-2xl font-semibold text-xs bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 transition flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span>REPLAY QUESTION AUDIO</span>
          </button>
        </div>

        {/* Live Transcript Box */}
        <div className="text-left space-y-2 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Speech Transcript</span>
            <span className="text-[11px] text-cyan-400">Real-Time Transcription</span>
          </div>

          <div className="p-4 rounded-2xl glass-input min-h-[100px] text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {transcript || interimTranscript ? (
              <>
                <span>{transcript}</span>
                <span className="text-cyan-400 italic">{interimTranscript}</span>
              </>
            ) : (
              <span className="text-slate-500 italic">
                Your spoken answer will be transcribed here live as you speak...
              </span>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isSynthesizing || (!transcript && !interimTranscript)}
              onClick={handleSendSpokenAnswer}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition disabled:opacity-40 flex items-center gap-1.5"
            >
              {isSynthesizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Verbal Delivery...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>SUBMIT VERBAL ANSWER</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verbal Dialogue History */}
      <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-4">
        <h3 className="font-bold text-base text-white">Voice Dialogue Transcript</h3>
        <div className="space-y-3">
          {history.map((turn, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm ${
                turn.sender === 'ai'
                  ? 'bg-purple-950/20 border border-purple-500/20 text-purple-200'
                  : 'bg-white/[0.03] border border-white/5 text-slate-200'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  turn.sender === 'ai' ? 'bg-purple-600/30 text-purple-300' : 'bg-cyan-600/30 text-cyan-300'
                }`}
              >
                {turn.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 leading-relaxed">
                <span className="block font-bold text-[10px] uppercase tracking-wider mb-1 text-slate-400">
                  {turn.sender === 'ai' ? 'AI Hiring Manager' : 'You (Verbal)'}
                </span>
                <p>{turn.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
