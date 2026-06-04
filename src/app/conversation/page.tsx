'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, MessageSquare, ArrowDown,
  ChevronDown, Search, X, User, Users
} from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode, languages, searchLanguages } from '@/lib/languages';
import { translateText, generateId } from '@/lib/translation';
import { ConversationMessage } from '@/types/translation';

function LangDropdown({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const current = getLanguageByCode(value);
  const filtered = search ? searchLanguages(search) : languages.slice(0, 30);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-xs font-medium">
        <span>{current.flag}</span><span className="text-text-primary">{current.name}</span>
        <ChevronDown className={`w-3 h-3 text-text-tertiary ${open ? 'rotate-180' : ''} transition-transform`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-1 z-50 glass-card p-2 w-48 max-h-52 overflow-y-auto">
            <div className="relative mb-1.5">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="w-full pl-6 pr-5 py-1 rounded text-xs bg-bg-secondary text-text-primary border border-border focus:outline-none focus:border-primary/50" />
              {search && <button onClick={() => setSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2"><X className="w-2.5 h-2.5" /></button>}
            </div>
            {filtered.map(l => (
              <button key={l.code} onClick={() => { onChange(l.code); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs ${l.code === value ? 'bg-primary/10 text-primary' : 'hover:bg-bg-secondary text-text-primary'}`}>
                <span>{l.flag}</span><span>{l.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConversationPage() {
  const { sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage } = useUserStore();
  const addTranslation = useHistoryStore(s => s.addTranslation);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [langA, setLangA] = useState(sourceLanguage);
  const [langB, setLangB] = useState(targetLanguage);
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  const handleManualSubmit = async (e: React.FormEvent, speaker: 'A' | 'B') => {
    e.preventDefault();
    const text = speaker === 'A' ? inputA : inputB;
    if (!text.trim() || isTranslating) return;

    if (speaker === 'A') setInputA('');
    else setInputB('');

    setIsTranslating(true);
    setError('');

    const sourceLang = getLanguageByCode(speaker === 'A' ? langA : langB);
    const targetLang = getLanguageByCode(speaker === 'A' ? langB : langA);

    try {
      const result = await translateText(text, sourceLang, targetLang, 'standard');

      const message: ConversationMessage = {
        id: generateId(),
        speaker,
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, message]);

      addTranslation({
        id: message.id,
        sourceText: text,
        translatedText: result.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        tone: 'standard',
        timestamp: Date.now(),
        isFavorite: false,
        type: 'conversation',
      });

      // Auto-play translation
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(result.translatedText);
        utterance.lang = targetLang.speechCode || targetLang.code;
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }
    } catch {
      setError('Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = useCallback(async (speaker: 'A' | 'B') => {
    setError('');

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    // Request microphone permission explicitly to trigger browser dialog and catch permission errors
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // release mic immediately
      } catch (err: any) {
        console.error('Microphone access error:', err);
        setError('Microphone access denied or no microphone found. Please click the lock/microphone icon next to the URL in your browser address bar and set Microphone to "Allow".');
        return;
      }
    } else {
      setError('Microphone access is not supported by your browser in this context. Ensure you are using HTTPS or localhost.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    const langCode = speaker === 'A' ? langA : langB;
    const lang = getLanguageByCode(langCode);
    recognition.lang = lang.speechCode || langCode;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setActiveSpeaker(null);
      if (!text.trim()) return;

      setIsTranslating(true);

      const sourceLang = getLanguageByCode(speaker === 'A' ? langA : langB);
      const targetLang = getLanguageByCode(speaker === 'A' ? langB : langA);

      try {
        const result = await translateText(text, sourceLang, targetLang, 'standard');

        const message: ConversationMessage = {
          id: generateId(),
          speaker,
          originalText: text,
          translatedText: result.translatedText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, message]);

        addTranslation({
          id: message.id,
          sourceText: text,
          translatedText: result.translatedText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          tone: 'standard',
          timestamp: Date.now(),
          isFavorite: false,
          type: 'conversation',
        });

        // Auto-play translation
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(result.translatedText);
          utterance.lang = targetLang.speechCode || targetLang.code;
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        }
      } catch {
        setError('Translation failed.');
      } finally {
        setIsTranslating(false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event);
      if (event.error && event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}. Please check your microphone settings.`);
      }
      setActiveSpeaker(null);
    };

    recognition.onend = () => {
      setActiveSpeaker(null);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setActiveSpeaker(speaker);
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setError('Failed to start speech recognition. Please try again.');
      setActiveSpeaker(null);
    }
  }, [langA, langB, addTranslation]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setActiveSpeaker(null);
  };

  const handleSpeak = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = getLanguageByCode(langCode);
      utterance.lang = lang.speechCode || langCode;
      utterance.rate = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[50%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[50%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Conversation Mode</h1>
            <p className="text-sm text-text-tertiary">Real-time two-person translation</p>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6 border-red-500/30 flex items-center justify-between gap-3 bg-red-500/5">
            <p className="text-sm text-red-400 font-medium">{error}</p>
            <button onClick={() => setError('')} className="p-1 hover:bg-bg-secondary rounded-lg text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Speaker Panels */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6">
          {/* Person A */}
          <div className={`glass-card p-4 text-center transition-all duration-300 ${activeSpeaker === 'A' ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : ''}`}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Person A</h3>
            <LangDropdown value={langA} onChange={setLangA} label="Language" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => activeSpeaker === 'A' ? stopListening() : startListening('A')}
              disabled={activeSpeaker === 'B' || isTranslating}
              className={`mt-4 w-14 h-14 mx-auto rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 ${
                activeSpeaker === 'A'
                  ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg hover:shadow-xl'
              }`}
            >
              {activeSpeaker === 'A' ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </motion.button>
            {activeSpeaker === 'A' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-blue-400 mt-2 font-medium">
                Listening...
              </motion.p>
            )}

            <form onSubmit={(e) => handleManualSubmit(e, 'A')} className="mt-4 flex gap-1">
              <input
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                placeholder="Type..."
                disabled={activeSpeaker === 'B' || isTranslating}
                className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-text-primary border border-border text-xs focus:outline-none focus:border-primary/50 placeholder:text-text-tertiary/50"
              />
              <button
                type="submit"
                disabled={!inputA.trim() || activeSpeaker === 'B' || isTranslating}
                className="btn-primary px-2.5 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>

          {/* Person B */}
          <div className={`glass-card p-4 text-center transition-all duration-300 ${activeSpeaker === 'B' ? 'ring-2 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : ''}`}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Person B</h3>
            <LangDropdown value={langB} onChange={setLangB} label="Language" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => activeSpeaker === 'B' ? stopListening() : startListening('B')}
              disabled={activeSpeaker === 'A' || isTranslating}
              className={`mt-4 w-14 h-14 mx-auto rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 ${
                activeSpeaker === 'B'
                  ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                  : 'bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg hover:shadow-xl'
              }`}
            >
              {activeSpeaker === 'B' ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </motion.button>
            {activeSpeaker === 'B' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-orange-400 mt-2 font-medium">
                Listening...
              </motion.p>
            )}

            <form onSubmit={(e) => handleManualSubmit(e, 'B')} className="mt-4 flex gap-1">
              <input
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                placeholder="Type..."
                disabled={activeSpeaker === 'A' || isTranslating}
                className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-text-primary border border-border text-xs focus:outline-none focus:border-primary/50 placeholder:text-text-tertiary/50"
              />
              <button
                type="submit"
                disabled={!inputB.trim() || activeSpeaker === 'A' || isTranslating}
                className="btn-primary px-2.5 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </motion.div>

        {/* Translating indicator */}
        <AnimatePresence>
          {isTranslating && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
                <span className="text-text-secondary font-medium">Translating...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Messages */}
        <div className="space-y-3 mb-4">
          {messages.length === 0 && !isTranslating && (
            <div className="glass-card p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary/50 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Start a Conversation</h3>
              <p className="text-sm text-text-tertiary max-w-sm mx-auto">
                Choose languages for each person and tap the microphone button to start speaking.
                Translations will appear here in real-time.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, x: msg.speaker === 'A' ? -20 : 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 0.05 }}
              className={`flex ${msg.speaker === 'B' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.speaker === 'A'
                  ? 'bg-blue-500/10 border border-blue-500/20 rounded-bl-md'
                  : 'bg-orange-500/10 border border-orange-500/20 rounded-br-md'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-text-tertiary">
                    {msg.speaker === 'A' ? 'Person A' : 'Person B'}
                  </span>
                  <span className="text-sm">{msg.sourceLanguage.flag}</span>
                </div>
                <p className="text-sm text-text-primary mb-2">{msg.originalText}</p>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{msg.targetLanguage.flag}</span>
                    <span className="text-[10px] font-semibold text-accent uppercase">Translation</span>
                  </div>
                  <p className="text-sm text-text-secondary">{msg.translatedText}</p>
                </div>
                <button
                  onClick={() => handleSpeak(msg.translatedText, msg.targetLanguage.code)}
                  className="mt-2 p-1.5 rounded-md hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </motion.div>
    </div>
  );
}
