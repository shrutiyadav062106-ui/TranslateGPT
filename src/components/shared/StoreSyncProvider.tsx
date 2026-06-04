'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useHistoryStore } from '@/stores/history-store';
import { useLearningStore } from '@/stores/learning-store';

export function StoreSyncProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    if (currentUser) {
      // Load user's private translation history and statistics
      useHistoryStore.getState().setStoreState(
        currentUser.translations || [],
        {
          totalTranslations: currentUser.translations?.length || 0,
          languagesUsed: new Set(
            (currentUser.translations || []).flatMap((t: any) => [t.sourceLanguage.code, t.targetLanguage.code])
          ).size,
          wordsTranslated: (currentUser.translations || []).reduce(
            (acc: number, t: any) => acc + (t.sourceText ? t.sourceText.split(/\s+/).length : 0),
            0
          ),
          dailyUsage: currentUser.translations?.filter((t: any) => {
            const date = new Date(t.timestamp);
            const today = new Date();
            return date.toDateString() === today.toDateString();
          }).length || 0,
          streak: currentUser.streak || 0,
          xp: currentUser.xp || 0,
          level: currentUser.level || 1,
          favoriteCount: (currentUser.translations || []).filter((t: any) => t.isFavorite).length
        }
      );

      // Load user's private learning state
      useLearningStore.getState().setStoreState({
        dailyGoal: currentUser.xp ? (currentUser.vocabBank?.length > 10 ? 8 : 5) : 5, // adaptive daily goal
        masteredWords: currentUser.vocabBank?.filter((v: any) => v.status === 'mastered').map((v: any) => v.id) || [],
        unlockedBadges: currentUser.unlockedBadges || ['first-step'],
        quizzesTaken: currentUser.quizzesTaken || 0,
        perfectQuizzes: currentUser.perfectQuizzes || 0
      });
    } else {
      // Clear data on logout
      useHistoryStore.getState().setStoreState([], {
        totalTranslations: 0,
        languagesUsed: 0,
        wordsTranslated: 0,
        dailyUsage: 0,
        streak: 0,
        xp: 0,
        level: 1,
        favoriteCount: 0
      });

      useLearningStore.getState().setStoreState({
        dailyGoal: 5,
        masteredWords: [],
        unlockedBadges: ['first-step'],
        quizzesTaken: 0,
        perfectQuizzes: 0
      });
    }
  }, [currentUser]);

  return <>{children}</>;
}
