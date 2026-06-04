'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Sparkles, BookOpen, Star, Compass, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { languages } from '@/lib/languages';

const GOAL_OPTIONS = [
  { id: 'Travel', label: '✈️ Travel & Vacation', desc: 'Hotel booking, ordering food, navigation' },
  { id: 'Business', label: '💼 Business & Work', desc: 'Meetings, professional emails, networking' },
  { id: 'School', label: '🎓 School & Academics', desc: 'Grammar review, vocab building, exams' },
  { id: 'Fluency', label: '🚀 Fluency & Immersion', desc: 'Daily speaking practice, accent reduction' },
  { id: 'Casual', label: '💬 Casual Conversations', desc: 'Chatting with friends, reading novels, movies' }
];

const LEVEL_OPTIONS: ('Beginner' | 'Intermediate' | 'Advanced' | 'Fluent')[] = [
  'Beginner', 'Intermediate', 'Advanced', 'Fluent'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, saveUserData } = useAuthStore();

  const [step, setStep] = useState(1);
  const [nativeLang, setNativeLang] = useState('en');
  const [targetLangs, setTargetLangs] = useState<string[]>(['es']);
  const [skillLevel, setSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent'>('Beginner');
  const [goals, setGoals] = useState<string[]>(['Travel']);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleTargetLang = (code: string) => {
    if (targetLangs.includes(code)) {
      if (targetLangs.length > 1) {
        setTargetLangs(targetLangs.filter(c => c !== code));
      }
    } else {
      setTargetLangs([...targetLangs, code]);
    }
  };

  const toggleGoal = (goalId: string) => {
    if (goals.includes(goalId)) {
      if (goals.length > 1) {
        setGoals(goals.filter(g => g !== goalId));
      }
    } else {
      setGoals([...goals, goalId]);
    }
  };

  const handleComplete = () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    saveUserData(currentUser.id, {
      nativeLanguage: nativeLang,
      targetLanguages: targetLangs,
      learningGoals: goals,
      skillLevel: skillLevel
    });

    router.push('/');
  };

  // Lang labels
  const nativeLabel = languages.find(l => l.code === nativeLang)?.name || 'English';
  const targetLabels = targetLangs.map(code => languages.find(l => l.code === code)?.name || code).join(', ');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-bg-primary">
      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Onboarding progress bar */}
        <div className="flex justify-between items-center mb-8 px-2">
          <span className="text-xs font-semibold text-text-tertiary">STEP {step} OF 4</span>
          <div className="flex gap-1.5 flex-1 max-w-[200px] ml-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>

        {/* Wizard card */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              /* Step 1: Native Language Selection */
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">What is your native language?</h3>
                </div>
                <p className="text-xs text-text-tertiary mb-6">
                  We will optimize explanations, translations, and learning contexts to align with your mother tongue.
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {languages.slice(0, 30).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setNativeLang(lang.code)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl glass border text-left transition-all ${
                        nativeLang === lang.code
                          ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                          : 'border-border text-text-secondary hover:border-text-secondary'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              /* Step 2: Target Languages Selection */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">Which languages do you want to learn?</h3>
                </div>
                <p className="text-xs text-text-tertiary mb-6">
                  Select one or more target languages. You can switch between them anytime.
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1">
                  {languages.slice(0, 30).map((lang) => {
                    const isSelected = targetLangs.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        onClick={() => toggleTargetLang(lang.code)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl glass border text-left transition-all ${
                          isSelected
                            ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                            : 'border-border text-text-secondary hover:border-text-secondary'
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-xs flex-1">{lang.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              /* Step 3: Skill Level */
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">What is your current level?</h3>
                </div>
                <p className="text-xs text-text-tertiary mb-6">
                  Rate your level for your target languages. Your learning path units will start here.
                </p>

                <div className="space-y-2">
                  {LEVEL_OPTIONS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSkillLevel(lvl)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl glass border text-left transition-all ${
                        skillLevel === lvl
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-border text-text-secondary hover:border-text-secondary'
                      }`}
                    >
                      <div>
                        <span className="text-sm block">{lvl}</span>
                        <span className="text-[10px] text-text-tertiary block font-normal mt-0.5">
                          {lvl === 'Beginner' && 'Start from zero. Learn basic vocabulary and alphabet.'}
                          {lvl === 'Intermediate' && 'Can handle daily conversations and short paragraphs.'}
                          {lvl === 'Advanced' && 'Can express complex thoughts, translate idioms smoothly.'}
                          {lvl === 'Fluent' && 'Near-native speed. Polish grammar nuances and custom tones.'}
                        </span>
                      </div>
                      {skillLevel === lvl && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              /* Step 4: Goals */
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Compass className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">What are your learning goals?</h3>
                </div>
                <p className="text-xs text-text-tertiary mb-6">
                  Select your primary use cases. We use this to adapt lesson lists and assistant suggestions.
                </p>

                <div className="space-y-2">
                  {GOAL_OPTIONS.map((g) => {
                    const isSelected = goals.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl glass border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary font-semibold'
                            : 'border-border text-text-secondary hover:border-text-secondary'
                        }`}
                      >
                        <div>
                          <span className="text-sm block">{g.label}</span>
                          <span className="text-[10px] text-text-tertiary block font-normal mt-0.5">{g.desc}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="btn-ghost flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              className="btn-primary flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold shadow-md"
            >
              {step === 4 ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
