'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  theme: 'light' | 'dark';
  sourceLanguage: string;
  targetLanguage: string;
  tone: 'standard' | 'formal' | 'casual' | 'slang';
  recentSourceLanguages: string[];
  recentTargetLanguages: string[];
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSourceLanguage: (code: string) => void;
  setTargetLanguage: (code: string) => void;
  setTone: (tone: 'standard' | 'formal' | 'casual' | 'slang') => void;
  swapLanguages: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      tone: 'standard',
      recentSourceLanguages: ['en', 'es', 'fr'],
      recentTargetLanguages: ['es', 'fr', 'de'],

      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
        set({ theme });
      },

      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
        return { theme: newTheme };
      }),

      setSourceLanguage: (code) => set((state) => ({
        sourceLanguage: code,
        recentSourceLanguages: [code, ...state.recentSourceLanguages.filter(c => c !== code)].slice(0, 5),
      })),

      setTargetLanguage: (code) => set((state) => ({
        targetLanguage: code,
        recentTargetLanguages: [code, ...state.recentTargetLanguages.filter(c => c !== code)].slice(0, 5),
      })),

      setTone: (tone) => set({ tone }),

      swapLanguages: () => set((state) => ({
        sourceLanguage: state.targetLanguage,
        targetLanguage: state.sourceLanguage,
      })),
    }),
    {
      name: 'translategpt-user',
    }
  )
);
