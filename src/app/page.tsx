'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Languages, Mic, Camera, MessageSquare, ArrowRight,
  Globe, Sparkles, TrendingUp, Star, Clock, Zap,
  BookOpen, BarChart3
} from 'lucide-react';
import { useHistoryStore } from '@/stores/history-store';

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

function AnimatedCounter({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
  return (
    <div className="glass-card p-5 text-center group cursor-default">
      <div className="w-10 h-10 mx-auto mb-3 rounded-xl gradient-primary flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-text-primary mb-1">
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-text-tertiary font-medium uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const stats = useHistoryStore((s) => s.stats);
  const translations = useHistoryStore((s) => s.translations);
  const recent = translations.slice(0, 5);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8"
      >
        {/* Hero Section */}
        <motion.div variants={item} className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-text-secondary">AI-Powered Translation</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="text-text-primary">Break Language</span>
            <br />
            <span className="gradient-text">Barriers Instantly</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
            Translate text, voice, and images across 100+ languages with
            AI-powered accuracy. Context-aware, natural, and blazing fast.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/translate"
              className="btn-primary flex items-center gap-2 text-base px-8 py-3.5 rounded-xl"
            >
              <Languages className="w-5 h-5" />
              Start Translating
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/voice"
              className="btn-ghost flex items-center gap-2 px-8 py-3.5 rounded-xl"
            >
              <Mic className="w-5 h-5" />
              Try Voice
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
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
                  <p className="text-sm text-text-tertiary leading-relaxed">
                    {action.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Open <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div variants={item} className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Your Statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AnimatedCounter value={stats.totalTranslations} label="Translations" icon={Globe} />
            <AnimatedCounter value={stats.languagesUsed} label="Languages" icon={Languages} />
            <AnimatedCounter value={stats.wordsTranslated} label="Words" icon={BookOpen} />
            <AnimatedCounter value={stats.streak} label="Day Streak" icon={Zap} />
          </div>
        </motion.div>

        {/* Recent History */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Recent Translations</h2>
            </div>
            {recent.length > 0 && (
              <Link
                href="/history"
                className="text-sm text-primary hover:text-primary-light transition-colors flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {recent.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary/50 flex items-center justify-center">
                <Languages className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No translations yet</h3>
              <p className="text-sm text-text-tertiary mb-6">Start translating to see your history here</p>
              <Link
                href="/translate"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
              >
                <Languages className="w-4 h-4" />
                Translate Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center gap-4"
                >
                  <div className="text-2xl">{t.sourceLanguage.flag}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{t.sourceText}</p>
                    <p className="text-sm text-text-secondary truncate">{t.translatedText}</p>
                  </div>
                  <div className="text-2xl">{t.targetLanguage.flag}</div>
                  <button
                    onClick={() => useHistoryStore.getState().toggleFavorite(t.id)}
                    className="text-text-tertiary hover:text-yellow-400 transition-colors"
                  >
                    <Star className={`w-4 h-4 ${t.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={item} className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Powered by AI</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: '🧠',
                title: 'Context-Aware',
                desc: 'Understands idioms, slang, and cultural nuances',
              },
              {
                icon: '⚡',
                title: 'Blazing Fast',
                desc: 'Instant translations with real-time streaming',
              },
              {
                icon: '🎯',
                title: 'Tone Control',
                desc: 'Switch between formal, casual, and slang registers',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-5"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{feature.title}</h3>
                <p className="text-xs text-text-tertiary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
