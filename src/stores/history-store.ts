'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TranslationResult, TranslationStats } from '@/types/translation';

interface HistoryState {
  translations: TranslationResult[];
  stats: TranslationStats;
  addTranslation: (t: TranslationResult) => void;
  toggleFavorite: (id: string) => void;
  removeTranslation: (id: string) => void;
  clearHistory: () => void;
  getFavorites: () => TranslationResult[];
  getRecent: (n: number) => TranslationResult[];
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
        streak: 7,
        xp: 1250,
        level: 5,
        favoriteCount: 0,
      },

      addTranslation: (t) => set((state) => {
        const translations = [t, ...state.translations].slice(0, 500);
        const languagesUsed = new Set(
          translations.flatMap(tr => [tr.sourceLanguage.code, tr.targetLanguage.code])
        ).size;
        const wordsTranslated = translations.reduce(
          (acc, tr) => acc + tr.sourceText.split(/\s+/).length, 0
        );
        return {
          translations,
          stats: {
            ...state.stats,
            totalTranslations: state.stats.totalTranslations + 1,
            languagesUsed,
            wordsTranslated,
            dailyUsage: state.stats.dailyUsage + 1,
            xp: state.stats.xp + 10,
          },
        };
      }),

      toggleFavorite: (id) => set((state) => {
        const translations = state.translations.map(t =>
          t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
        );
        const favoriteCount = translations.filter(t => t.isFavorite).length;
        return {
          translations,
          stats: { ...state.stats, favoriteCount },
        };
      }),

      removeTranslation: (id) => set((state) => ({
        translations: state.translations.filter(t => t.id !== id),
      })),

      clearHistory: () => set((state) => ({
        translations: [],
        stats: { ...state.stats, totalTranslations: 0, wordsTranslated: 0, dailyUsage: 0 },
      })),

      getFavorites: () => get().translations.filter(t => t.isFavorite),

      getRecent: (n) => get().translations.slice(0, n),
    }),
    {
      name: 'translategpt-history',
    }
  )
);
