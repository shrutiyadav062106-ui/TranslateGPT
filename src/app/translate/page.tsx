'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight, Copy, Check, Volume2, Star, Share2,
  Sparkles, Loader2, ChevronDown, Search, X, Wand2, Info
} from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { useHistoryStore } from '@/stores/history-store';
import { languages, getLanguageByCode, searchLanguages, getPopularLanguages } from '@/lib/languages';
import { translateText, generateId, detectLanguage } from '@/lib/translation';
import { ToneType, Language } from '@/types/translation';

function LanguageSelector({
  value,
  onChange,
  label,
  recentCodes,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
  recentCodes: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search ? searchLanguages(search) : languages;
  const current = getLanguageByCode(value);
  const recentLangs = recentCodes.map(getLanguageByCode).filter(l => l.code !== value);
  const popular = getPopularLanguages().filter(l => l.code !== value && !recentCodes.includes(l.code));

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1.5 block">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass border border-border hover:border-primary/40 transition-all duration-200"
      >
        <span className="text-xl">{current.flag}</span>
        <span className="flex-1 text-left font-medium text-text-primary">{current.name}</span>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 glass-card p-3 max-h-80 overflow-y-auto"
          >
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-bg-secondary text-text-primary text-sm border border-border focus:border-primary/50 focus:outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              )}
            </div>

            {!search && recentLangs.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">Recent</p>
                {recentLangs.slice(0, 3).map((lang) => (
                  <LangButton key={lang.code} lang={lang} isSelected={false} onSelect={() => { onChange(lang.code); setOpen(false); setSearch(''); }} />
                ))}
              </div>
            )}

            {!search && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">Popular</p>
                {popular.slice(0, 6).map((lang) => (
                  <LangButton key={lang.code} lang={lang} isSelected={false} onSelect={() => { onChange(lang.code); setOpen(false); setSearch(''); }} />
                ))}
              </div>
            )}

            <div>
              {search && <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">Results</p>}
              {!search && <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-2 mb-1">All Languages</p>}
              {filtered.map((lang) => (
                <LangButton
                  key={lang.code}
                  lang={lang}
                  isSelected={lang.code === value}
                  onSelect={() => { onChange(lang.code); setOpen(false); setSearch(''); }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LangButton({ lang, isSelected, onSelect }: { lang: Language; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-bg-secondary text-text-primary'
      }`}
    >
      <span className="text-lg">{lang.flag}</span>
      <span className="text-sm font-medium">{lang.name}</span>
      <span className="text-xs text-text-tertiary ml-auto">{lang.nativeName}</span>
    </button>
  );
}

const tones: { value: ToneType; label: string; emoji: string }[] = [
  { value: 'standard', label: 'Standard', emoji: '📝' },
  { value: 'formal', label: 'Formal', emoji: '👔' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'slang', label: 'Slang', emoji: '🔥' },
];

export default function TranslatePage() {
  const {
    sourceLanguage, targetLanguage, tone,
    setSourceLanguage, setTargetLanguage, setTone,
    swapLanguages, recentSourceLanguages, recentTargetLanguages,
  } = useUserStore();
  const addTranslation = useHistoryStore((s) => s.addTranslation);

  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pronunciation, setPronunciation] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasApiKey(!!localStorage.getItem('translategpt_openai_key'));
    }
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslatedText('');

    try {
      const sourceLang = getLanguageByCode(sourceLanguage);
      const targetLang = getLanguageByCode(targetLanguage);

      // Auto-detect
      const detected = detectLanguage(sourceText);
      if (detected !== sourceLanguage) {
        setDetectedLang(detected);
      }

      const result = await translateText(sourceText, sourceLang, targetLang, tone as ToneType);
      setTranslatedText(result.translatedText);
      setPronunciation(result.pronunciation || '');

      addTranslation({
        id: generateId(),
        sourceText,
        translatedText: result.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        tone: tone as ToneType,
        timestamp: Date.now(),
        isFavorite: false,
        type: 'text',
        alternatives: result.alternatives,
        pronunciation: result.pronunciation,
        grammarNotes: result.grammarNotes,
      });
    } catch {
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLanguage, targetLanguage, tone, isTranslating, addTranslation]);

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const handleSwap = () => {
    swapLanguages();
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [sourceText]);

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleTranslate();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTranslate]);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent-cyan/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Text Translation</h1>
            <p className="text-sm text-text-tertiary">AI-powered, context-aware translations</p>
          </div>
        </motion.div>

        {/* Language Selectors + Swap */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-end gap-3 mb-6"
        >
          <div className="flex-1">
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              label="From"
              recentCodes={recentSourceLanguages}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSwap}
            className="w-10 h-10 rounded-full glass border border-border flex items-center justify-center mb-0.5 hover:border-primary/40 transition-colors"
            id="swap-languages"
          >
            <ArrowLeftRight className="w-4 h-4 text-text-secondary" />
          </motion.button>

          <div className="flex-1">
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              label="To"
              recentCodes={recentTargetLanguages}
            />
          </div>
        </motion.div>

        {/* Tone Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1"
        >
          {tones.map((t) => (
            <button
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                tone === t.value
                  ? 'bg-primary text-white shadow-md'
                  : 'glass text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Translation Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getLanguageByCode(sourceLanguage).flag}</span>
                <span className="text-sm font-medium text-text-secondary">{getLanguageByCode(sourceLanguage).name}</span>
                {detectedLang && detectedLang !== sourceLanguage && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                    Detected: {getLanguageByCode(detectedLang).name}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-tertiary">{sourceText.length} chars</span>
            </div>

            <textarea
              ref={textareaRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="w-full min-h-[120px] bg-transparent text-text-primary text-base leading-relaxed resize-none focus:outline-none placeholder:text-text-tertiary/50"
              id="source-text"
            />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(sourceText, sourceLanguage)}
                  className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                  title="Listen"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {sourceText && (
                  <button
                    onClick={() => { setSourceText(''); setTranslatedText(''); setDetectedLang(''); }}
                    className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-xs text-text-tertiary hidden sm:block">Ctrl + Enter to translate</span>
            </div>
          </motion.div>

          {/* Target */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getLanguageByCode(targetLanguage).flag}</span>
                <span className="text-sm font-medium text-text-secondary">{getLanguageByCode(targetLanguage).name}</span>
              </div>
            </div>

            <div className="min-h-[120px] text-base leading-relaxed">
              {isTranslating ? (
                <div className="flex items-center gap-3 text-text-tertiary">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm">Translating...</span>
                </div>
              ) : translatedText ? (
                <p className="text-text-primary whitespace-pre-wrap">{translatedText}</p>
              ) : (
                <p className="text-text-tertiary/50">Translation will appear here...</p>
              )}
            </div>

            {pronunciation && translatedText && (
              <p className="text-xs text-text-tertiary font-mono mt-2">{pronunciation}</p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeak(translatedText, targetLanguage)}
                  className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                  title="Listen"
                  disabled={!translatedText}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                  title="Copy"
                  disabled={!translatedText}
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary"
                  title="Share"
                  disabled={!translatedText}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-yellow-400"
                  title="Favorite"
                  disabled={!translatedText}
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Translate Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating}
            className="btn-primary flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
            id="translate-button"
          >
            {isTranslating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
            {isTranslating ? 'Translating...' : 'Translate'}
          </motion.button>
        </motion.div>

        {/* Demo Warning Banner */}
        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="relative mt-6 p-4 rounded-xl glass border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500/80 flex items-start gap-2.5"
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Demo Mode Active</span>
              To get real-time custom translations for any text, paste your OpenAI API key in the <span className="underline font-semibold cursor-pointer" onClick={() => window.location.href = '/settings'}>Settings page</span>. Try translating common traveler phrases for a demonstration!
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
