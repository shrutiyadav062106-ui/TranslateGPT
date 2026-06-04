'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  nativeLanguage: string;
  targetLanguages: string[];
  learningGoals: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent';
  role: 'user' | 'guest';
  xp: number;
  level: number;
  streak: number;
  quizzesTaken: number;
  perfectQuizzes: number;
  unlockedBadges: string[];
  translations: any[];
  libraryFolders: { id: string; name: string }[];
  vocabBank: VocabWord[];
  tutorMemory: TutorMessage[];
}

export interface VocabWord {
  id: string;
  word: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  status: 'new' | 'learning' | 'mastered';
  difficulty: number; // 1-5 scale
  mistakes: number; // count of grammar issues with this word
  addedAt: number;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface NotificationAlert {
  id: string;
  title: string;
  desc: string;
  type: 'streak' | 'review' | 'milestone' | 'general';
  timestamp: number;
  read: boolean;
}

export const createDefaultUser = (details: Partial<UserProfile>): UserProfile => ({
  id: details.id || 'user-' + Math.random().toString(36).substring(2, 9),
  name: details.name || 'Guest User',
  email: details.email || 'guest@translategpt.local',
  nativeLanguage: details.nativeLanguage || 'en',
  targetLanguages: details.targetLanguages || ['es'],
  learningGoals: details.learningGoals || ['Travel'],
  skillLevel: details.skillLevel || 'Beginner',
  role: details.role || 'guest',
  xp: details.xp || 0,
  level: details.level || 1,
  streak: details.streak || 0,
  quizzesTaken: details.quizzesTaken || 0,
  perfectQuizzes: details.perfectQuizzes || 0,
  unlockedBadges: details.unlockedBadges || ['first-step'],
  translations: details.translations || [],
  libraryFolders: details.libraryFolders || [
    { id: 'folder-travel', name: '🌍 Travel Phrases' },
    { id: 'folder-slang', name: '💬 Slang & Idioms' },
    { id: 'folder-work', name: '💼 Business' }
  ],
  vocabBank: details.vocabBank || [],
  tutorMemory: details.tutorMemory || []
});

interface AuthState {
  currentUser: UserProfile | null;
  usersDb: Record<string, UserProfile>;
  notifications: NotificationAlert[];
  
  signUp: (details: Omit<UserProfile, 'id' | 'xp' | 'level' | 'streak' | 'quizzesTaken' | 'perfectQuizzes' | 'unlockedBadges' | 'translations' | 'libraryFolders' | 'vocabBank' | 'tutorMemory'>) => { success: boolean; error?: string };
  login: (email: string, password?: string) => { success: boolean; error?: string };
  loginOAuth: (provider: 'google' | 'apple', email: string, name: string) => void;
  logout: () => void;
  setGuestMode: () => void;
  saveUserData: (userId: string, data: Partial<UserProfile>) => void;
  
  // Library Folder Operations
  createFolder: (name: string) => void;
  deleteFolder: (folderId: string) => void;
  
  // Vocabulary bank actions
  addVocabWord: (word: string, translation: string, sourceLang: string, targetLang: string) => void;
  updateVocabStatus: (id: string, status: 'new' | 'learning' | 'mastered') => void;
  incrementVocabMistake: (id: string) => void;
  
  // Notification actions
  addNotification: (title: string, desc: string, type: NotificationAlert['type']) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // AI Tutor Memory updates
  addTutorMessage: (msg: TutorMessage) => void;
  clearTutorHistory: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      usersDb: {},
      notifications: [
        {
          id: 'notif-welcome',
          title: 'Welcome to TranslateGPT!',
          desc: 'Set up your learning goals and test your skills in the Learn tab.',
          type: 'general',
          timestamp: Date.now(),
          read: false
        }
      ],

      signUp: (details) => {
        const db = get().usersDb;
        const emailLower = details.email.toLowerCase();
        
        if (db[emailLower]) {
          return { success: false, error: 'User with this email already exists.' };
        }

        const newUser = createDefaultUser({
          ...details,
          email: emailLower,
          role: 'user'
        });

        set((state) => ({
          usersDb: { ...state.usersDb, [emailLower]: newUser },
          currentUser: newUser
        }));

        // Add welcome notifications
        get().addNotification(
          'Account Created! 🚀',
          `Welcome, ${details.name}! Your personalized learning path is now active.`,
          'general'
        );

        return { success: true };
      },

      login: (email, password) => {
        const db = get().usersDb;
        const emailLower = email.toLowerCase();
        const user = db[emailLower];

        if (!user) {
          return { success: false, error: 'No account found with this email.' };
        }

        if (password && user.password !== password) {
          return { success: false, error: 'Incorrect password.' };
        }

        set({ currentUser: user });
        
        // Add welcome notification
        get().addNotification(
          'Welcome Back! 👋',
          `Good to see you, ${user.name}! Continue your language learning streak.`,
          'streak'
        );

        return { success: true };
      },

      loginOAuth: (provider, email, name) => {
        const db = get().usersDb;
        const emailLower = email.toLowerCase();
        let user = db[emailLower];

        if (!user) {
          user = createDefaultUser({
            name,
            email: emailLower,
            role: 'user',
            nativeLanguage: 'en',
            targetLanguages: ['es'],
            learningGoals: ['Fluency'],
            skillLevel: 'Beginner'
          });
        }

        set((state) => ({
          usersDb: { ...state.usersDb, [emailLower]: user },
          currentUser: user
        }));

        get().addNotification(
          `Signed in with ${provider === 'google' ? 'Google' : 'Apple'} 🔐`,
          `Welcome back, ${name}! Your progress is synced.`,
          'general'
        );
      },

      logout: () => {
        const user = get().currentUser;
        if (user && user.role !== 'guest') {
          // Sync current state to DB first
          set((state) => ({
            usersDb: { ...state.usersDb, [user.email.toLowerCase()]: user }
          }));
        }
        set({ currentUser: null });
      },

      setGuestMode: () => {
        const guestUser = createDefaultUser({
          name: 'Guest User',
          email: 'guest@translategpt.local',
          role: 'guest'
        });
        set({ currentUser: guestUser });
      },

      saveUserData: (userId, data) => {
        set((state) => {
          const user = state.currentUser;
          if (!user || user.id !== userId) return {};

          const updatedUser = { ...user, ...data };
          const updatedDb = user.role !== 'guest' 
            ? { ...state.usersDb, [user.email.toLowerCase()]: updatedUser }
            : state.usersDb;

          return {
            currentUser: updatedUser,
            usersDb: updatedDb
          };
        });
      },

      createFolder: (name) => {
        const user = get().currentUser;
        if (!user) return;

        const newFolder = {
          id: 'folder-' + Math.random().toString(36).substring(2, 9),
          name
        };

        const updatedFolders = [...user.libraryFolders, newFolder];
        get().saveUserData(user.id, { libraryFolders: updatedFolders });

        get().addNotification(
          'Folder Created 📁',
          `Created library folder "${name}"`,
          'general'
        );
      },

      deleteFolder: (folderId) => {
        const user = get().currentUser;
        if (!user) return;

        const updatedFolders = user.libraryFolders.filter(f => f.id !== folderId);
        get().saveUserData(user.id, { libraryFolders: updatedFolders });
      },

      addVocabWord: (word, translation, sourceLang, targetLang) => {
        const user = get().currentUser;
        if (!user) return;

        // Check if word is already in bank
        const exists = user.vocabBank.find(v => v.word.toLowerCase() === word.toLowerCase());
        if (exists) return;

        const newWord: VocabWord = {
          id: 'vocab-' + Math.random().toString(36).substring(2, 9),
          word,
          translation,
          sourceLang,
          targetLang,
          status: 'new',
          difficulty: 2,
          mistakes: 0,
          addedAt: Date.now()
        };

        get().saveUserData(user.id, {
          vocabBank: [newWord, ...user.vocabBank]
        });

        // Trigger notification occasionally
        if (user.vocabBank.length % 5 === 4) {
          get().addNotification(
            'Vocabulary Growing! 📚',
            `You have added ${user.vocabBank.length + 1} words to your personal study bank.`,
            'milestone'
          );
        }
      },

      updateVocabStatus: (id, status) => {
        const user = get().currentUser;
        if (!user) return;

        const updatedBank = user.vocabBank.map(v => 
          v.id === id ? { ...v, status } : v
        );

        get().saveUserData(user.id, { vocabBank: updatedBank });
      },

      incrementVocabMistake: (id) => {
        const user = get().currentUser;
        if (!user) return;

        const updatedBank = user.vocabBank.map(v => 
          v.id === id ? { ...v, mistakes: v.mistakes + 1, status: 'learning' as const } : v
        );

        get().saveUserData(user.id, { vocabBank: updatedBank });
      },

      addNotification: (title, desc, type) => {
        const newNotif: NotificationAlert = {
          id: 'notif-' + Math.random().toString(36).substring(2, 9),
          title,
          desc,
          type,
          timestamp: Date.now(),
          read: false
        };

        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50)
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      addTutorMessage: (msg) => {
        const user = get().currentUser;
        if (!user) return;

        get().saveUserData(user.id, {
          tutorMemory: [...user.tutorMemory, msg]
        });
      },

      clearTutorHistory: () => {
        const user = get().currentUser;
        if (!user) return;

        get().saveUserData(user.id, { tutorMemory: [] });
      }
    }),
    {
      name: 'translategpt-auth',
    }
  )
);
