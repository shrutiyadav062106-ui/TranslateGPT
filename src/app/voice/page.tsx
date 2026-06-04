'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Volume2, ArrowLeftRight, Loader2,
  ChevronDown, Search, X, Sparkles, Square
} from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode, languages, searchLanguages } from '@/lib/languages';
import { translateText, generateId } from '@/lib/translation';
import { Language } from '@/types/translation';

function MiniLangSelector({ value, onChange, label }: { value: string; onChange: (code: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const current = getLanguageByCode(value);
  const filtered = search ? searchLanguages(search) : languages;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1 block">{label}</label>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-lg glass border border-border hover:border-primary/40 transition-all text-sm">
        <span>{current.flag}</span>
        <span className="font-medium text-text-primary">{current.name}</span>
        <ChevronDown className={`w-3 h-3 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute top-full left-0 mt-1 z-50 glass-card p-2 w-56 max-h-60 overflow-y-auto">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="w-full pl-7 pr-6 py-1.5 rounded-md bg-bg-secondary text-text-primary text-xs border border-border focus:border-primary/50 focus:outline-none" />
              {search && <button onClick={() => setSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-text-tertiary" /></button>}
            </div>
            {filtered.map(lang => (
              <button key={lang.code} onClick={() => { onChange(lang.code); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${lang.code === value ? 'bg-primary/10 text-primary' : 'hover:bg-bg-secondary text-text-primary'}`}>
                <span>{lang.flag}</span><span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AudioWaveform({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-primary"
          animate={isRecording ? {
            height: [8, Math.random() * 40 + 10, 8],
          } : { height: 8 }}
          transition={{
            duration: 0.5 + Math.random() * 0.3,
            repeat: isRecording ? Infinity : 0,
            repeatType: 'reverse',
            delay: i * 0.05,
          }}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}

export default function VoicePage() {
  const { sourceLanguage, targetLanguage, setSourceLanguage, setTargetLanguage, swapLanguages } = useUserStore();
  const addTranslation = useHistoryStore(s => s.addTranslation);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [manualText, setManualText] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsSpeechSupported(!!SpeechRecognitionCtor);
    }
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || isTranslating) return;

    setTranscript(manualText);
    setTranslatedText('');
    setIsTranslating(true);
    setError('');

    try {
      const sourceLang = getLanguageByCode(sourceLanguage);
      const targetLang = getLanguageByCode(targetLanguage);
      const result = await translateText(manualText, sourceLang, targetLang, 'standard');
      setTranslatedText(result.translatedText);
      setManualText('');

      addTranslation({
        id: generateId(),
        sourceText: manualText,
        translatedText: result.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        tone: 'standard',
        timestamp: Date.now(),
        isFavorite: false,
        type: 'voice',
      });
    } catch {
      setError('Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  const startRecording = useCallback(async () => {
    setError('');

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

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    const lang = getLanguageByCode(sourceLanguage);
    recognition.lang = lang.speechCode || sourceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += (i > 0 ? ' ' : '') + event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event);
      if (event.error && event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}. Please check your browser permission settings.`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setTranscript('');
      setTranslatedText('');
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setError('Failed to start speech recognition. Please try again.');
      setIsRecording(false);
    }
  }, [sourceLanguage]);

  const stopRecording = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    if (transcript.trim()) {
      setIsTranslating(true);
      try {
        const sourceLang = getLanguageByCode(sourceLanguage);
        const targetLang = getLanguageByCode(targetLanguage);
        const result = await translateText(transcript, sourceLang, targetLang, 'standard');
        setTranslatedText(result.translatedText);

        addTranslation({
          id: generateId(),
          sourceText: transcript,
          translatedText: result.translatedText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          tone: 'standard',
          timestamp: Date.now(),
          isFavorite: false,
          type: 'voice',
        });
      } catch {
        setError('Translation failed.');
      } finally {
        setIsTranslating(false);
      }
    }
  }, [transcript, sourceLanguage, targetLanguage, addTranslation]);

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
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Voice Translation</h1>
            <p className="text-sm text-text-tertiary">Speak naturally, translate instantly</p>
          </div>
        </motion.div>

        {/* Language Selectors */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-end gap-3 mb-8">
          <MiniLangSelector value={sourceLanguage} onChange={setSourceLanguage} label="Speak in" />
          <motion.button whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} onClick={swapLanguages}
            className="w-8 h-8 rounded-full glass border border-border flex items-center justify-center mb-0.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-text-secondary" />
          </motion.button>
          <MiniLangSelector value={targetLanguage} onChange={setTargetLanguage} label="Translate to" />
        </motion.div>

        {/* Microphone Button */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                : 'gradient-primary shadow-glow hover:shadow-[0_0_50px_rgba(76,175,80,0.5)]'
            }`}
            id="voice-record-button"
          >
            {isRecording && (
              <motion.div className="absolute inset-0 rounded-full border-4 border-red-400"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
            )}
            {isRecording ? <Square className="w-8 h-8 text-white fill-white" /> : <Mic className="w-10 h-10 text-white" />}
          </motion.button>
          <p className="text-sm text-text-tertiary mt-4">
            {isRecording ? 'Listening... Tap to stop' : 'Tap to start speaking'}
          </p>
        </motion.div>

        {/* Waveform */}
        <AnimatePresence>
          {isRecording && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6">
              <AudioWaveform isRecording={isRecording} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Input Fallback */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-5 mb-8"
        >
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            {isSpeechSupported ? 'Or Type Your Input' : 'Type Your Input (Speech Recognition Unsupported)'}
          </h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type sentence here..."
              className="flex-1 px-4 py-2.5 rounded-xl glass border border-border text-text-primary text-sm focus:border-primary/50 focus:outline-none placeholder:text-text-tertiary/50"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isTranslating}
              className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              Translate
            </button>
          </form>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 mb-6 border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {(transcript || translatedText) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-4">
              {/* Source */}
              {transcript && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getLanguageByCode(sourceLanguage).flag}</span>
                    <span className="text-sm font-medium text-text-secondary">{getLanguageByCode(sourceLanguage).name}</span>
                  </div>
                  <p className="text-text-primary text-base">{transcript}</p>
                  <button onClick={() => handleSpeak(transcript, sourceLanguage)} className="mt-3 p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Translation */}
              {isTranslating ? (
                <div className="glass-card p-5 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-text-tertiary">Translating...</span>
                </div>
              ) : translatedText ? (
                <div className="glass-card p-5 gradient-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getLanguageByCode(targetLanguage).flag}</span>
                    <span className="text-sm font-medium text-text-secondary">{getLanguageByCode(targetLanguage).name}</span>
                    <Sparkles className="w-3.5 h-3.5 text-accent ml-auto" />
                  </div>
                  <p className="text-text-primary text-base font-medium">{translatedText}</p>
                  <button onClick={() => handleSpeak(translatedText, targetLanguage)}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-primary text-white text-sm font-medium">
                    <Volume2 className="w-4 h-4" /> Listen
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
