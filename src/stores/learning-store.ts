'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useHistoryStore } from './history-store';
import { useAuthStore } from './auth-store';

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
  setStoreState: (state: { dailyGoal: number; masteredWords: string[]; unlockedBadges: string[]; quizzesTaken: number; perfectQuizzes: number }) => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      dailyGoal: 5,
      masteredWords: [],
      unlockedBadges: ['first-step'], // start with first-step unlocked for presentation
      quizzesTaken: 0,
      perfectQuizzes: 0,

      markWordMastered: (id, mastered) => set((state) => {
        const masteredWords = mastered
          ? [...state.masteredWords.filter(w => w !== id), id]
          : state.masteredWords.filter(w => w !== id);
        
        // Sync to Auth database
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            unlockedBadges: state.unlockedBadges,
            quizzesTaken: state.quizzesTaken,
            perfectQuizzes: state.perfectQuizzes
          });
        }

        return { masteredWords };
      }),

      unlockBadge: (id) => {
        const state = get();
        if (state.unlockedBadges.includes(id)) return false;
        const nextBadges = [...state.unlockedBadges, id];
        set({ unlockedBadges: nextBadges });

        // Sync to Auth database
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            unlockedBadges: nextBadges
          });
        }

        return true;
      },

      takeQuiz: (perfectScore) => set((state) => {
        const nextTaken = state.quizzesTaken + 1;
        const nextPerfect = perfectScore ? state.perfectQuizzes + 1 : state.perfectQuizzes;

        // Sync to Auth database
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            quizzesTaken: nextTaken,
            perfectQuizzes: nextPerfect
          });
        }

        return {
          quizzesTaken: nextTaken,
          perfectQuizzes: nextPerfect
        };
      }),

      resetLearningState: () => {
        set({
          masteredWords: [],
          unlockedBadges: ['first-step'],
          quizzesTaken: 0,
          perfectQuizzes: 0,
        });

        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            unlockedBadges: ['first-step'],
            quizzesTaken: 0,
            perfectQuizzes: 0
          });
        }
      },

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
      },

      setStoreState: (state) => set({
        dailyGoal: state.dailyGoal,
        masteredWords: state.masteredWords,
        unlockedBadges: state.unlockedBadges,
        quizzesTaken: state.quizzesTaken,
        perfectQuizzes: state.perfectQuizzes
      }),
    }),
    {
      name: 'translategpt-learning',
    }
  )
);
