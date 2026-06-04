'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Key, Eye, EyeOff, ShieldCheck, User, Award, Sliders,
  Trash2, RotateCcw, Download, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { useHistoryStore } from '@/stores/history-store';
import { useLearningStore, AVAILABLE_BADGES } from '@/stores/learning-store';

export default function SettingsPage() {
  const stats = useHistoryStore((s) => s.stats);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const { unlockedBadges, resetLearningState } = useLearningStore();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [exported, setExported] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('translategpt_openai_key') || '');
      const rate = localStorage.getItem('translategpt_tts_rate');
      if (rate) setTtsRate(parseFloat(rate));
    }
  }, []);

  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('translategpt_openai_key', apiKey.trim());
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  const handleTtsChange = (val: number) => {
    setTtsRate(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('translategpt_tts_rate', val.toString());
    }
  };

  const handleExportData = () => {
    const data = {
      history: useHistoryStore.getState().translations,
      stats: useHistoryStore.getState().stats,
      learning: {
        masteredWords: useLearningStore.getState().masteredWords,
        unlockedBadges: useLearningStore.getState().unlockedBadges,
        quizzesTaken: useLearningStore.getState().quizzesTaken,
        perfectQuizzes: useLearningStore.getState().perfectQuizzes,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translategpt_profile_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowConfirmClear(false);
  };

  const handleResetStats = () => {
    resetLearningState();
    useHistoryStore.setState({
      stats: {
        totalTranslations: 0,
        languagesUsed: 0,
        wordsTranslated: 0,
        dailyUsage: 0,
        streak: 0,
        xp: 0,
        level: 1,
        favoriteCount: 0,
      }
    });
    setShowConfirmReset(false);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-accent-cyan/5 blur-[120px]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Settings & Profile</h1>
          <p className="text-sm text-text-tertiary">Configure translations, manage API keys, and review stats</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-xl" />
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-white">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">TranslateGPT Explorer</h2>
            <p className="text-xs text-text-tertiary mb-4">Level {stats.level} Student</p>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Day Streak</span>
                <span className="font-bold text-amber-500">🔥 {stats.streak} Days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Total XP</span>
                <span className="font-bold text-primary">✨ {stats.xp} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Translations</span>
                <span className="font-bold text-text-primary">{stats.totalTranslations}</span>
              </div>
            </div>
          </div>

          {/* Badges Earned */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Achievements</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_BADGES.map((b) => {
                const isUnlocked = unlockedBadges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                      isUnlocked
                        ? 'glass border-primary/20 bg-primary/5 text-text-primary'
                        : 'border-border/50 opacity-40 grayscale text-text-tertiary bg-transparent'
                    }`}
                    title={b.desc}
                  >
                    <div className="text-2xl mb-1">{b.emoji}</div>
                    <p className="text-[10px] font-bold truncate">{b.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* OpenAI API Key configuration */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">OpenAI API Key</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Client-Side Stored
              </span>
            </div>

            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              TranslateGPT performs translations locally by default. Connect your own **OpenAI API Key**
              to activate real-time translation with GPT-4o-mini and unlock context-aware explanations.
            </p>

            <div className="relative flex items-center mb-4">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-4 pr-10 py-3 rounded-xl glass border border-border text-text-primary text-sm focus:border-primary/50 focus:outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 p-1.5 rounded text-text-tertiary hover:text-text-primary"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveKey}
                className="btn-primary py-2 px-6 rounded-lg text-xs flex items-center gap-2"
              >
                {keySaved ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                {keySaved ? 'Saved API Key!' : 'Save API Key'}
              </button>
            </div>
          </div>

          {/* Audio/TTS speed controls */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-text-primary">Audio Playback Speed</h3>
            </div>
            <p className="text-xs text-text-secondary mb-4">
              Adjust speech speed for translating audio and conversation voice outputs.
            </p>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={ttsRate}
                onChange={(e) => handleTtsChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-bold text-text-primary w-12 text-right">{ttsRate.toFixed(1)}x</span>
            </div>
          </div>

          {/* Danger zone and data utilities */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Data & Management</h3>

            <div className="space-y-4">
              {/* Export */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-bg-glass/50 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Export Learning Progress</h4>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Download your translation history, stats, and achievements as JSON</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="btn-ghost py-1.5 px-4 rounded-lg text-xs flex items-center gap-1.5 border-border hover:text-primary hover:border-primary/30"
                >
                  {exported ? <Check className="w-3.5 h-3.5 text-accent" /> : <Download className="w-3.5 h-3.5" />}
                  {exported ? 'Exported!' : 'Export JSON'}
                </button>
              </div>

              {/* Clear History */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-bg-glass/50 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Clear Translation History</h4>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Wipes your saved translations but preserves your streak and XP level</p>
                </div>
                {showConfirmClear ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-primary text-xs font-semibold hover:bg-bg-tertiary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="py-1.5 px-4 rounded-lg text-xs flex items-center gap-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Wipe History
                  </button>
                )}
              </div>

              {/* Reset Stats */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/40 hover:bg-bg-glass/50 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Reset Statistics & XP</h4>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Reset your level, streak, XP points, and unlocked achievements back to default</p>
                </div>
                {showConfirmReset ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetStats}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-primary text-xs font-semibold hover:bg-bg-tertiary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="py-1.5 px-4 rounded-lg text-xs flex items-center gap-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
