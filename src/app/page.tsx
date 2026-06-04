'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Languages, Mic, Camera, MessageSquare, ArrowRight,
  Globe, Sparkles, Star, Clock, Zap, BookOpen, BarChart3,
  ShieldAlert, Award, Compass, Search, LogOut, ArrowLeftRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useHistoryStore } from '@/stores/history-store';
import { useLearningStore } from '@/stores/learning-store';
import { getLanguageByCode } from '@/lib/languages';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 } as const,
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const quickActions = [
  {
    href: '/translate',
    icon: Languages,
    title: 'Text Translation',
    desc: 'Translate text instantly across 100+ languages',
    gradient: 'from-emerald-500 to-green-400',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  {
    href: '/voice',
    icon: Mic,
    title: 'Voice Translation',
    desc: 'Speak naturally and get instant translations',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  {
    href: '/camera',
    icon: Camera,
    title: 'Camera Translation',
    desc: 'Scan text from photos, signs, and documents',
    gradient: 'from-purple-500 to-pink-400',
    glow: 'rgba(168, 85, 247, 0.3)',
  },
  {
    href: '/conversation',
    icon: MessageSquare,
    title: 'Conversation Mode',
    desc: 'Real-time two-person multilingual chat',
    gradient: 'from-orange-500 to-amber-400',
    glow: 'rgba(249, 115, 22, 0.3)',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { currentUser, logout, setGuestMode } = useAuthStore();
  const stats = useHistoryStore((s) => s.stats);
  const translations = useHistoryStore((s) => s.translations);
  const dailyGoal = useLearningStore((s) => s.dailyGoal);

  // Active languages flags
  const nativeLang = currentUser ? getLanguageByCode(currentUser.nativeLanguage) : null;
  const targetLangs = currentUser ? currentUser.targetLanguages.map(getLanguageByCode) : [];

  // Weekly activity metrics
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([4, 2, 5, 1, 3, 0, 0]);

  useEffect(() => {
    if (currentUser) {
      // Calculate translations per day of current week (Mon-Sun)
      const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon=0, Tue=1 ... Sun=6
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      const dayIndex = today.getDay(); // Sun=0, Mon=1 ... Sat=6
      const diff = today.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1); // Adjust for Monday starting
      firstDayOfWeek.setDate(diff);
      firstDayOfWeek.setHours(0, 0, 0, 0);

      translations.forEach(t => {
        const date = new Date(t.timestamp);
        if (date >= firstDayOfWeek) {
          const day = date.getDay(); // Sun=0, Mon=1 ... Sat=6
          const monIndexed = day === 0 ? 6 : day - 1; // Mon=0, Sun=6
          counts[monIndexed] += 1;
        }
      });
      // Inject fallback mock data if they just logged in and have 0 translations to keep design premium
      const totalThisWeek = counts.reduce((a, b) => a + b, 0);
      if (totalThisWeek === 0) {
        setWeeklyActivity([3, 1, 4, 0, stats.dailyUsage || 1, 0, 0]);
      } else {
        setWeeklyActivity(counts);
      }
    }
  }, [translations, currentUser, stats.dailyUsage]);

  const progressPercent = Math.min(100, Math.round(((stats.dailyUsage || 0) / (dailyGoal || 5)) * 100));

  if (!currentUser) {
    /* ---------------- LANDING HERO PAGE (LOGGED OUT) ---------------- */
    return (
      <div className="min-h-screen pb-24 md:pb-8 flex flex-col justify-between">
        {/* Ambient Blur Backgrounds */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1"
        >
          {/* Main Hero Title */}
          <motion.div variants={item} className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-medium text-text-secondary">AI-Powered Fluent Onboarding</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 leading-tight">
              <span className="text-text-primary">Break Language</span>
              <br />
              <span className="gradient-text">Barriers Instantly</span>
            </h1>

            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
              Translate text, voice, and camera photos across 100+ languages. Build a personalized learning path with smart vocabulary tracking and an interactive AI tutor.
            </p>

            {/* Core Sign In / Sign Up CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 text-sm px-8 py-3.5 rounded-xl font-bold shadow-glow"
              >
                Get Started (Sign Up)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => { setGuestMode(); }}
                className="w-full sm:w-auto btn-ghost flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border-border hover:bg-bg-glass"
              >
                Try Guest Mode
              </button>
            </div>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href="/auth/login">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="glass-card p-6 cursor-pointer group h-full"
                    style={{ '--glow': action.glow } as React.CSSProperties}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-1.5">
                      {action.title}
                    </h3>
                    <p className="text-xs text-text-tertiary leading-relaxed">
                      {action.desc}
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>

          {/* Info Panels */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: '🧠',
                title: 'Duolingo-style Learning Path',
                desc: 'Tailored units and interactive multiple-choice quizzes that award XP and streaks based on goals.',
              },
              {
                icon: '🤖',
                title: 'Personalized AI Language Tutor',
                desc: 'An AI-powered grammar and expression coach that generates exercises and reviews from history.',
              },
              {
                icon: '📁',
                title: 'Private Library Folders',
                desc: 'Securely manage saved translations, voice records, and camera snaps in structured custom directories.',
              },
            ].map((f, idx) => (
              <div key={idx} className="glass-card p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h4 className="text-sm font-semibold text-text-primary mb-1.5">{f.title}</h4>
                <p className="text-xs text-text-tertiary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ---------------- PERSONALIZED DASHBOARD (LOGGED IN / GUEST) ---------------- */
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8"
      >
        {/* Guest Warning Banner */}
        {currentUser.role === 'guest' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl glass border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-500"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-semibold block mb-0.5">Guest Mode Active</span>
                Your translation history, streak stats, and learning progress are stored temporarily. Register an account to save them!
              </div>
            </div>
            <Link href="/auth/login" className="btn-primary py-1.5 px-4 rounded-lg font-bold text-[10px] bg-amber-500 text-slate-900 border-none hover:bg-amber-600">
              Create Free Account
            </Link>
          </motion.div>
        )}

        {/* Dashboard Welcome Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Welcome back, {currentUser.name}!
              </h1>
              {currentUser.role !== 'guest' && <Award className="w-6 h-6 text-accent" />}
            </div>
            <p className="text-sm text-text-tertiary flex items-center gap-1.5">
              <span>Learning:</span>
              <span className="flex items-center gap-1">
                {targetLangs.map((lang, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-bg-secondary px-2 py-0.5 rounded text-xs text-text-secondary border border-border">
                    <span>{lang?.flag}</span>
                    <span>{lang?.name}</span>
                  </span>
                ))}
              </span>
              <span className="text-text-tertiary/40">|</span>
              <span>Native: {nativeLang?.flag} {nativeLang?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/learn/path" className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Learning Path
            </Link>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="btn-ghost py-2 px-3 rounded-xl text-xs font-semibold text-red-400 hover:text-red-500 hover:bg-red-500/10 border-border"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Top Stats Overview Row */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* XP & Level Progress */}
          <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-1">XP Level Status</p>
                <h3 className="text-xl font-bold text-text-primary">Level {stats.level}</h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-md">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>{stats.xp} XP total</span>
                <span>Next level: {stats.level * 500} XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(((stats.xp % 500) / 500) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Goal Ring (Interactive progress) */}
          <div className="glass-card p-5 flex items-center gap-5">
            {/* SVG Progress Circle */}
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-border fill-transparent" strokeWidth="6" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="stroke-primary fill-transparent"
                  strokeWidth="6"
                  strokeDasharray={175.9}
                  strokeDashoffset={175.9 - (175.9 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-bold text-text-primary block leading-none">{stats.dailyUsage}</span>
                <span className="text-[8px] text-text-tertiary uppercase tracking-wider block mt-0.5">/{dailyGoal}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-0.5">Daily Goal Progress</p>
              <h4 className="text-sm font-bold text-text-primary">{progressPercent}% Completed</h4>
              <p className="text-xs text-text-secondary mt-1">Translate {dailyGoal} items daily to keep streaking</p>
            </div>
          </div>

          {/* Streak details */}
          <div className="glass-card p-5 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary mb-1">Current Study Streak</p>
              <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                {stats.streak || 0} Days
                <Zap className="w-6 h-6 text-orange-500 fill-orange-500 animate-bounce" />
              </h3>
              <p className="text-xs text-text-secondary mt-1">Goal: {currentUser.learningGoals.join(', ')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </motion.div>

        {/* Middle Row: Weekly activity chart and quick features */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly activity Bar Chart */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Weekly Translation Volume</h3>
              </div>
              <span className="text-[10px] text-text-tertiary font-semibold uppercase bg-bg-secondary px-2.5 py-1 rounded-md border border-border">This Week</span>
            </div>

            <div className="flex items-end justify-between h-40 pt-4 px-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const count = weeklyActivity[idx] || 0;
                // Scale height: max count scaled to 100% height (or base height)
                const maxVal = Math.max(...weeklyActivity, 1);
                const heightPct = Math.max(10, Math.round((count / maxVal) * 100));
                return (
                  <div key={day} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="relative w-full flex items-end justify-center h-28">
                      {/* Count tooltip on hover */}
                      <span className="absolute bottom-full mb-1 bg-primary text-white text-[10px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg pointer-events-none z-10">
                        {count}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.05 }}
                        className={`w-4 sm:w-6 rounded-t-md bg-gradient-to-t ${count >= dailyGoal ? 'from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'from-primary/70 to-primary'}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-text-tertiary group-hover:text-text-primary transition-colors">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">Translation Features</h3>
            <div className="grid grid-cols-2 gap-3 h-full">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href} className="h-full">
                    <div className="glass-card p-4 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between h-full group cursor-pointer">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="mt-4">
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">{action.title}</h4>
                        <span className="text-[9px] text-text-tertiary block mt-0.5 line-clamp-1">{action.desc}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Bottom Row: Recent translations and private folders */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent History log */}
          <div className="glass-card p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Recent Activity</h3>
              </div>
              {translations.length > 0 && (
                <Link href="/history" className="text-xs text-primary font-bold hover:underline">
                  View All
                </Link>
              )}
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {translations.slice(0, 3).map((t, idx) => (
                <div key={t.id} className="p-3 rounded-xl glass border border-border flex items-center gap-3.5">
                  <span className="text-xl flex-shrink-0">{t.sourceLanguage.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{t.sourceText}</p>
                    <p className="text-[10px] text-text-secondary truncate mt-0.5">{t.translatedText}</p>
                  </div>
                  <span className="text-xl flex-shrink-0">{t.targetLanguage.flag}</span>
                </div>
              ))}

              {translations.length === 0 && (
                <div className="py-8 text-center">
                  <Languages className="w-8 h-8 mx-auto text-text-tertiary mb-2 opacity-40" />
                  <p className="text-xs text-text-secondary">No translations logged yet.</p>
                  <Link href="/translate" className="text-xs text-primary font-semibold hover:underline block mt-2">
                    Translate your first word!
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Library Folders Shortcut */}
          <div className="glass-card p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Library Folders</h3>
              </div>
              <Link href="/library" className="text-xs text-primary font-bold hover:underline">
                Open Library
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {currentUser.libraryFolders.slice(0, 4).map(folder => (
                <Link key={folder.id} href={`/library?folder=${folder.id}`}>
                  <div className="p-3.5 rounded-xl glass border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
                    <span className="text-xs font-bold text-text-primary block truncate">{folder.name}</span>
                    <span className="text-[9px] text-text-tertiary block mt-1">Open Folder</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
