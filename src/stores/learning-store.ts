'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useHistoryStore } from './history-store';

export interface Badge {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  unlockedAt?: number;
}

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'first-step', title: 'First Steps', desc: 'Perform your first translation', emoji: '🌱' },
  { id: 'polyglot', title: 'Polyglot', desc: 'Translate between 5 different languages', emoji: '🗣️' },
  { id: 'speech-master', title: 'Speech Master', desc: 'Use voice translation 5 times', emoji: '🎙️' },
  { id: 'ocr-scanner', title: 'OCR Scanner', desc: 'Translate text using camera mode', emoji: '📷' },
  { id: 'quiz-genius', title: 'Quiz Genius', desc: 'Get a perfect score in a translation quiz', emoji: '🧠' },
  { id: 'streak-week', title: 'Weekly Warrior', desc: 'Maintain a 7-day translation streak', emoji: '🔥' },
];

interface LearningState {
  dailyGoal: number; // target translations per day
  masteredWords: string[]; // translation IDs marked as mastered
  unlockedBadges: string[]; // badge IDs unlocked
  quizzesTaken: number;
  perfectQuizzes: number;
  
  // Actions
  markWordMastered: (id: string, mastered: boolean) => void;
  unlockBadge: (id: string) => boolean;
  takeQuiz: (perfectScore: boolean) => void;
  resetLearningState: () => void;
  checkBadgeUnlocks: () => string[]; // returns newly unlocked badge titles
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      dailyGoal: 5,
      masteredWords: [],
      unlockedBadges: ['first-step'], // start with first-step unlocked for presentation
      quizzesTaken: 2,
      perfectQuizzes: 1,

      markWordMastered: (id, mastered) => set((state) => {
        const masteredWords = mastered
          ? [...state.masteredWords.filter(w => w !== id), id]
          : state.masteredWords.filter(w => w !== id);
        return { masteredWords };
      }),

      unlockBadge: (id) => {
        const state = get();
        if (state.unlockedBadges.includes(id)) return false;
        set({ unlockedBadges: [...state.unlockedBadges, id] });
        return true;
      },

      takeQuiz: (perfectScore) => set((state) => ({
        quizzesTaken: state.quizzesTaken + 1,
        perfectQuizzes: perfectScore ? state.perfectQuizzes + 1 : state.perfectQuizzes,
      })),

      resetLearningState: () => set({
        masteredWords: [],
        unlockedBadges: ['first-step'],
        quizzesTaken: 0,
        perfectQuizzes: 0,
      }),

      checkBadgeUnlocks: () => {
        const state = get();
        const historyState = useHistoryStore.getState();
        const newUnlocks: string[] = [];

        // Check Polyglot: languagesUsed >= 5
        if (historyState.stats.languagesUsed >= 5 && !state.unlockedBadges.includes('polyglot')) {
          get().unlockBadge('polyglot');
          newUnlocks.push('Polyglot');
        }

        // Check Speech Master
        const speechCount = historyState.translations.filter(t => t.type === 'voice').length;
        if (speechCount >= 5 && !state.unlockedBadges.includes('speech-master')) {
          get().unlockBadge('speech-master');
          newUnlocks.push('Speech Master');
        }

        // Check OCR Scanner
        const ocrCount = historyState.translations.filter(t => t.type === 'camera').length;
        if (ocrCount >= 1 && !state.unlockedBadges.includes('ocr-scanner')) {
          get().unlockBadge('ocr-scanner');
          newUnlocks.push('OCR Scanner');
        }

        // Check Quiz Genius
        if (state.perfectQuizzes >= 1 && !state.unlockedBadges.includes('quiz-genius')) {
          get().unlockBadge('quiz-genius');
          newUnlocks.push('Quiz Genius');
        }

        // Check Streak Week
        if (historyState.stats.streak >= 7 && !state.unlockedBadges.includes('streak-week')) {
          get().unlockBadge('streak-week');
          newUnlocks.push('Weekly Warrior');
        }

        return newUnlocks;
      }
    }),
    {
      name: 'translategpt-learning',
    }
  )
);
