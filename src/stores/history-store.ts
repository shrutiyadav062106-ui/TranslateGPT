'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationResult, TranslationStats } from '@/types/translation';
import { useAuthStore } from './auth-store';

interface HistoryState {
  translations: TranslationResult[];
  stats: TranslationStats;
  addTranslation: (t: TranslationResult) => void;
  toggleFavorite: (id: string) => void;
  removeTranslation: (id: string) => void;
  clearHistory: () => void;
  getFavorites: () => TranslationResult[];
  getRecent: (n: number) => TranslationResult[];
  setStoreState: (translations: TranslationResult[], stats: TranslationStats) => void;
  assignToFolder: (id: string, folderId: string | undefined) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      translations: [],
      stats: {
        totalTranslations: 0,
        languagesUsed: 0,
        wordsTranslated: 0,
        dailyUsage: 0,
        streak: 0,
        xp: 0,
        level: 1,
        favoriteCount: 0,
      },

      addTranslation: (t) => set((state) => {
        const translations = [t, ...state.translations].slice(0, 500);
        const languagesUsed = new Set(
          translations.flatMap(tr => [tr.sourceLanguage.code, tr.targetLanguage.code])
        ).size;
        const wordsTranslated = translations.reduce(
          (acc, tr) => acc + (tr.sourceText ? tr.sourceText.split(/\s+/).length : 0), 0
        );
        const nextStats = {
          ...state.stats,
          totalTranslations: state.stats.totalTranslations + 1,
          languagesUsed,
          wordsTranslated,
          dailyUsage: state.stats.dailyUsage + 1,
          xp: state.stats.xp + 10,
          level: Math.floor((state.stats.xp + 10) / 500) + 1
        };

        // Sync to Auth database
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            translations,
            xp: nextStats.xp,
            level: nextStats.level,
            streak: nextStats.streak,
            quizzesTaken: currentUser.quizzesTaken,
            perfectQuizzes: currentUser.perfectQuizzes,
            unlockedBadges: currentUser.unlockedBadges
          });
        }

        return {
          translations,
          stats: nextStats,
        };
      }),

      toggleFavorite: (id) => set((state) => {
        const translations = state.translations.map(t =>
          t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        );
        const favoriteCount = translations.filter(t => t.isFavorite).length;
        const nextStats = { ...state.stats, favoriteCount };

        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            translations
          });
        }

        return {
          translations,
          stats: nextStats,
        };
      }),

      removeTranslation: (id) => set((state) => {
        const translations = state.translations.filter(t => t.id !== id);
        const favoriteCount = translations.filter(t => t.isFavorite).length;
        const nextStats = { ...state.stats, favoriteCount };

        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            translations
          });
        }

        return {
          translations,
          stats: nextStats
        };
      }),

      clearHistory: () => set((state) => {
        const nextStats = { ...state.stats, totalTranslations: 0, wordsTranslated: 0, dailyUsage: 0, favoriteCount: 0 };
        
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            translations: []
          });
        }

        return {
          translations: [],
          stats: nextStats,
        };
      }),

      getFavorites: () => get().translations.filter(t => t.isFavorite),

      getRecent: (n) => get().translations.slice(0, n),

      setStoreState: (translations, stats) => set({ translations, stats }),

      assignToFolder: (id, folderId) => set((state) => {
        const translations = state.translations.map(t =>
          t.id === id ? { ...t, folderId } : t
        );

        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser) {
          useAuthStore.getState().saveUserData(currentUser.id, {
            translations
          });
        }

        return { translations };
      }),
    }),
    {
      name: 'translategpt-history',
    }
  )
);
