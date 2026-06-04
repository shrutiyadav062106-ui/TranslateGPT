'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Volume2, Mic, MicOff, RefreshCw, Copy, Check, Info, Award, BookOpen
} from 'lucide-react';
import { askAIAssistant } from '@/lib/openai';
import { useAuthStore, TutorMessage } from '@/stores/auth-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode } from '@/lib/languages';

export default function AssistantPage() {
  const router = useRouter();
  const { currentUser, addTutorMessage, clearTutorHistory } = useAuthStore();
  const stats = useHistoryStore((s) => s.stats);
  const translations = useHistoryStore((s) => s.translations);

  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const targetLang = currentUser ? getLanguageByCode(currentUser.targetLanguages[0]) : null;

  // Check for OpenAI API key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('translategpt_openai_key');
      setHasApiKey(!!key);
    }
  }, []);

  // Initialize tutor message memory from profile
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.tutorMemory && currentUser.tutorMemory.length > 0) {
      setMessages(currentUser.tutorMemory);
    } else {
      const targetName = targetLang ? targetLang.name : 'Spanish';
      const goalStr = currentUser.learningGoals.join(' & ');
      const welcomeMsg: TutorMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${currentUser.name}! I am your AI Language Tutor. 🎓\n\nI see you are a **${currentUser.skillLevel}** learning **${targetName}** for **${goalStr}**.\n\nI can explain grammar, suggest better phrasings, help you practice pronunciation, or give you customized practice exercises. Tap a suggestion below or tell me what you want to study today!`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
      addTutorMessage(welcomeMsg);
    }
  }, [currentUser, targetLang]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const rec = new SpeechRecognitionCtor();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + text);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Request mic permission explicitly
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // release mic immediately
        } catch (err: any) {
          console.error('Microphone access error:', err);
          alert('Microphone access denied or no microphone found. Please click the lock/microphone icon next to the URL in your browser address bar and set Microphone to "Allow".');
          return;
        }
      } else {
        alert('Microphone access is not supported by your browser in this context. Ensure you are using HTTPS or localhost.');
        return;
      }

      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang?.speechCode || targetLang?.code || 'es-ES';
      utterance.rate = 0.95;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for typing animation
  const typeMessage = (text: string, messageId: string) => {
    let currentText = '';
    const words = text.split(' ');
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, content: currentText } : m))
        );
        i++;
      } else {
        clearInterval(interval);
        
        // Save the finished assistant message to tutor memory store
        const finalMsg: TutorMessage = {
          id: messageId,
          role: 'assistant',
          content: text,
          timestamp: Date.now()
        };
        addTutorMessage(finalMsg);
        setIsSending(false);
      }
    }, 45);
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending || !currentUser) return;

    const userMsgId = `${Date.now()}-user`;
    const botMsgId = `${Date.now()}-bot`;

    const userMsg: TutorMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    addTutorMessage(userMsg);
    setInput('');
    setIsSending(true);

    // Placeholder message
    setMessages(prev => [
      ...prev,
      { id: botMsgId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    const apiKey = localStorage.getItem('translategpt_openai_key') || '';
    
    // Prefix prompts with system context
    const targetName = targetLang ? targetLang.name : 'Spanish';
    const goalsStr = currentUser.learningGoals.join(', ');
    const systemPrompt = `You are a helpful language learning tutor. The student is ${currentUser.name}, a ${currentUser.skillLevel} learning ${targetName} for ${goalsStr}. Keep answers educational and encouraging.`;

    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      if (apiKey) {
        // Query real OpenAI API
        const answer = await askAIAssistant(`${systemPrompt}\n\nUser Question: ${trimmed}`, history, apiKey);
        typeMessage(answer, botMsgId);
      } else {
        // Offline / Demo Smart Mock responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        let mockReply = '';
        const lower = trimmed.toLowerCase();

        if (lower.includes('conjug') || lower.includes('verb')) {
          mockReply = `**Verb Conjugation Practice**
Here is how you conjugate the essential verb **ser** (to be) in ${targetName} present tense:
* **Yo soy** (I am)
* **Tú eres** (You are)
* **Él/Ella es** (He/She is)
* **Nosotros somos** (We are)
* **Ellos/Ellas son** (They are)

*Tutor Tip*: Use "ser" for identity, origin, and time. Use "estar" for location and feelings!`;
        } else if (lower.includes('exercise') || lower.includes('practice') || lower.includes('test')) {
          mockReply = `**Practice Exercise** 📝

Translate this sentence into ${targetName}:
*"Where is the train station?"*

Type your translation here and I will correct your grammar!`;
        } else if (lower.includes('station') || lower.includes('estación') || lower.includes('gare')) {
          mockReply = `**Excellent Job!** 🎉 
Your translation is completely correct. 
* Spanish: *¿Dónde está la estación de tren?*
* French: *Où est la gare?*

I've awarded you **+20 XP** for this correct translation practice. Keep it up!`;
          // Award XP
          const addXp = stats.xp + 20;
          const nextLvl = Math.floor(addXp / 500) + 1;
          useHistoryStore.getState().setStoreState(translations, { ...stats, xp: addXp, level: nextLvl });
        } else if (lower.includes('grammar') || lower.includes('structure')) {
          mockReply = `**Grammar Breakdown** 💡
In ${targetName}, adjectives usually come *after* the noun.
For example:
* English: "The *green* book"
* ${targetName}: "${targetName === 'Spanish' ? 'El libro *verde*' : 'Le livre *vert*'}"
This is different from English, so keep it in mind when translating!`;
        } else {
          mockReply = `Hi! I'm here as your ${targetName} tutor. 
Since you are studying for **${goalsStr}**, try asking me:
1. "Give me a practice exercise"
2. "Explain verb conjugation"
3. "Give me grammar tips"

*(To get full customized AI responses, you can set your OpenAI API key in Settings)*`;
        }
        typeMessage(mockReply, botMsgId);
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === botMsgId
            ? { ...m, content: `Error: ${err?.message || 'Failed to contact AI. Please check your connection.'}` }
            : m
        )
      );
      setIsSending(false);
    }
  };

  const handleClear = () => {
    clearTutorHistory();
    const targetName = targetLang ? targetLang.name : 'Spanish';
    const welcomeMsg: TutorMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${currentUser?.name}! I am your AI Language Tutor. 🎓\n\nI see you are a **${currentUser?.skillLevel}** learning **${targetName}**.\n\nI can explain grammar, suggest better phrasings, help you practice pronunciation, or give you customized practice exercises. Tap a suggestion below or tell me what you want to study today!`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    addTutorMessage(welcomeMsg);
  };

  const SUGGESTIONS = [
    { text: `Give me a ${targetLang?.name || 'Spanish'} practice exercise`, icon: '✍️' },
    { text: `Explain ${targetLang?.name || 'Spanish'} verb conjugations`, icon: '📝' },
    { text: `How do I structure questions in ${targetLang?.name || 'Spanish'}?`, icon: '❓' },
  ];

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-sm">
          <BookOpen className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-bold text-text-primary mb-2">AI Language Tutor</h3>
          <p className="text-xs text-text-tertiary mb-6">
            Sign in to start chatting with your personalized AI language tutor, save conversation logs, and practice custom exercises.
          </p>
          <button onClick={() => router.push('/auth/login')} className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-md">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col justify-between max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">AI Language Tutor</h1>
            <p className="text-xs text-text-tertiary">Conversational grammar coach & exercise builder</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border-border hover:text-red-500 hover:border-red-500/30"
          title="Clear Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Chat
        </button>
      </div>

      {!hasApiKey && (
        <div className="relative mb-4 p-3.5 rounded-xl glass border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500/80 flex items-start gap-2.5">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Demo Mode Active</span>
            To get real-time custom grammar analysis, paste your OpenAI API key in the <span className="underline font-semibold cursor-pointer" onClick={() => router.push('/settings')}>Settings page</span>. Try the suggestions below to practice!
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="relative flex-1 min-h-[350px] glass-card p-4 md:p-6 mb-6 overflow-y-auto max-h-[500px] flex flex-col gap-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm relative group ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'glass border border-border text-text-primary rounded-tl-none'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                  {m.content || (
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-200" />
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-300" />
                    </div>
                  )}
                </div>

                {m.content && !isUser && (
                  <div className="absolute right-2 bottom-[-24px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-bg-primary/95 px-2 py-0.5 rounded-md border border-border text-[10px] text-text-tertiary shadow-sm z-10">
                    <button
                      onClick={() => handleSpeak(m.content)}
                      className="hover:text-text-primary"
                      title="Speak"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-text-primary"
                      title="Copy"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="relative mb-6">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2.5 px-1">Tutor Topics</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SUGGESTIONS.map((s, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSend(s.text)}
                className="flex items-center gap-2.5 text-left p-3 rounded-xl glass border border-border hover:border-primary/40 transition-colors"
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-medium text-text-secondary line-clamp-2 leading-snug">{s.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="relative flex items-center gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : `Ask your ${targetLang?.name || 'Spanish'} tutor anything...`}
            disabled={isSending}
            className="w-full pl-4 pr-12 py-3.5 rounded-xl glass border border-border text-text-primary text-sm focus:border-primary/50 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3 p-2 rounded-lg transition-colors ${
              isListening ? 'text-red-500 bg-red-500/10' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-secondary'
            }`}
            title="Speech Input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!input.trim() || isSending}
          className="btn-primary p-3.5 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
}
