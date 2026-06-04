'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Award, CheckCircle2, ChevronRight, Play, BookOpen,
  HelpCircle, Star, Sparkles, RefreshCw, Volume2, ArrowLeft, Lightbulb
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode } from '@/lib/languages';

interface Lesson {
  id: string;
  title: string;
  desc: string;
  type: 'vocab' | 'dialogue' | 'grammar';
  completed: boolean;
  content: {
    words?: { word: string; meaning: string }[];
    quiz?: { q: string; a: string; options: string[] }[];
  };
}

interface Unit {
  id: string;
  title: string;
  desc: string;
  lessons: Lesson[];
}

export default function LearningPathPage() {
  const router = useRouter();
  const { currentUser, saveUserData } = useAuthStore();
  const { translations } = useHistoryStore();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [aiAdaptedLesson, setAiAdaptedLesson] = useState<Lesson | null>(null);

  // Initialize learning path based on profile
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const targetLang = getLanguageByCode(currentUser.targetLanguages[0] || 'es');
    const skill = currentUser.skillLevel;
    const goals = currentUser.learningGoals;

    // Build static units based on profile
    const defaultUnits: Unit[] = [
      {
        id: 'unit-1',
        title: `Unit 1: ${skill} Fundamentals`,
        desc: `Master core ${targetLang.name} constructs for ${goals[0]}`,
        lessons: [
          {
            id: 'u1-l1',
            title: 'Greetings & Introduction',
            desc: 'Learn standard greetings and introducing yourself.',
            type: 'vocab',
            completed: false,
            content: {
              words: [
                { word: targetLang.code === 'es' ? 'Hola, ¿cómo estás?' : 'Bonjour, comment ça va?', meaning: 'Hello, how are you?' },
                { word: targetLang.code === 'es' ? 'Mucho gusto' : 'Enchanté', meaning: 'Nice to meet you' },
                { word: targetLang.code === 'es' ? 'Me llamo...' : 'Je m\'appelle...', meaning: 'My name is...' }
              ]
            }
          },
          {
            id: 'u1-l2',
            title: 'Survival Grammar',
            desc: 'Understand sentence structure and verbs.',
            type: 'grammar',
            completed: false,
            content: {
              quiz: [
                {
                  q: targetLang.code === 'es' ? 'How do you say "I have" in Spanish?' : 'How do you say "I have" in French?',
                  a: targetLang.code === 'es' ? 'Yo tengo' : 'J\'ai',
                  options: targetLang.code === 'es' ? ['Yo tengo', 'Yo soy', 'Yo hablo'] : ['J\'ai', 'Je suis', 'Je parle']
                }
              ]
            }
          }
        ]
      },
      {
        id: 'unit-2',
        title: 'Unit 2: Everyday Contexts',
        desc: 'Navigating typical scenarios and public areas.',
        lessons: [
          {
            id: 'u2-l1',
            title: 'Numbers & Shopping',
            desc: 'Asking for prices and paying at the checkout.',
            type: 'vocab',
            completed: false,
            content: {
              words: [
                { word: targetLang.code === 'es' ? '¿Cuánto cuesta?' : 'Combien ça coûte?', meaning: 'How much does it cost?' },
                { word: targetLang.code === 'es' ? 'Efectivo o tarjeta' : 'Espèces ou carte', meaning: 'Cash or card' }
              ]
            }
          }
        ]
      }
    ];

    // Detect if translations have custom travel keywords to adapt the path dynamically!
    const textHistory = translations.map(t => t.sourceText.toLowerCase() + ' ' + t.translatedText.toLowerCase()).join(' ');
    const hasTravelKeywords = /hotel|airport|ticket|flight|taxi|luggage|passport|beach/i.test(textHistory);
    const hasBusinessKeywords = /meeting|business|schedule|work|manager|office|contract/i.test(textHistory);

    if (hasTravelKeywords) {
      const travelLesson: Lesson = {
        id: 'ai-travel-lesson',
        title: '🌟 Special: Travel Vocabulary Booster',
        desc: 'Adapted by AI from your recent travel-related translation activity.',
        type: 'vocab',
        completed: false,
        content: {
          words: [
            { word: targetLang.code === 'es' ? 'El pasaporte y el billete' : 'Le passeport et le billet', meaning: 'The passport and the ticket' },
            { word: targetLang.code === 'es' ? '¿Dónde está la puerta de embarque?' : 'Où est la porte d\'embarquement?', meaning: 'Where is the boarding gate?' },
            { word: targetLang.code === 'es' ? 'Reservar una habitación de hotel' : 'Réserver une chambre d\'hôtel', meaning: 'Book a hotel room' }
          ]
        }
      };
      setAiAdaptedLesson(travelLesson);
    } else if (hasBusinessKeywords) {
      const businessLesson: Lesson = {
        id: 'ai-business-lesson',
        title: '🌟 Special: Business Dialogues',
        desc: 'Adapted by AI from your recent professional office translations.',
        type: 'vocab',
        completed: false,
        content: {
          words: [
            { word: targetLang.code === 'es' ? 'Reunión de negocios' : 'Réunion d\'affaires', meaning: 'Business meeting' },
            { word: targetLang.code === 'es' ? 'El contrato de trabajo' : 'Le contrat de travail', meaning: 'The employment contract' }
          ]
        }
      };
      setAiAdaptedLesson(businessLesson);
    }

    setUnits(defaultUnits);
  }, [currentUser, translations]);

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-sm">
          <Compass className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-bold text-text-primary mb-2">AI Learning Path</h3>
          <p className="text-xs text-text-tertiary mb-6">
            Create an account to generate a custom step-by-step learning path matching your target level and goals.
          </p>
          <button onClick={() => router.push('/auth/login')} className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-md">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const handleLessonStart = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setQuizScore(null);
    setSelectedAnswers([]);
  };

  const handleQuizSelect = (questionIdx: number, option: string) => {
    const updated = [...selectedAnswers];
    updated[questionIdx] = option;
    setSelectedAnswers(updated);
  };

  const handleQuizSubmit = () => {
    if (!activeLesson || !activeLesson.content.quiz) return;
    let correctCount = 0;
    activeLesson.content.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.a) correctCount++;
    });
    setQuizScore(correctCount);

    // Complete lesson and award XP
    if (correctCount === activeLesson.content.quiz.length) {
      handleCompleteLesson(activeLesson.id);
    }
  };

  const handleCompleteLesson = (lessonId: string) => {
    // Award XP
    const addXp = useHistoryStore.getState().stats.xp + 40;
    const nextLevel = Math.floor(addXp / 500) + 1;
    useHistoryStore.getState().setStoreState(translations, {
      ...useHistoryStore.getState().stats,
      xp: addXp,
      level: nextLevel
    });

    // Mark as completed
    setUnits(prev =>
      prev.map(u => ({
        ...u,
        lessons: u.lessons.map(l => (l.id === lessonId ? { ...l, completed: true } : l))
      }))
    );

    if (aiAdaptedLesson && aiAdaptedLesson.id === lessonId) {
      setAiAdaptedLesson(prev => prev ? { ...prev, completed: true } : null);
    }

    useAuthStore.getState().addNotification(
      'Lesson Completed! 🎓',
      `Completed lesson and earned +40 XP!`,
      'milestone'
    );
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageByCode(currentUser.targetLanguages[0]).speechCode || 'es-ES';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const totalLessons = units.flatMap(u => u.lessons).length + (aiAdaptedLesson ? 1 : 0);
  const completedLessons = units.flatMap(u => u.lessons).filter(l => l.completed).length + (aiAdaptedLesson?.completed ? 1 : 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen pb-24 md:pb-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {!activeLesson ? (
            /* Unit Map View */
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green-400 flex items-center justify-center shadow-lg">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-text-primary">Personal AI Learning Path</h1>
                  <p className="text-xs text-text-tertiary">Adapted dynamically based on goals and search history</p>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="glass-card p-5 mb-8 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary block mb-1">Learning Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-text-primary">{completedLessons} / {totalLessons} Lessons Completed</span>
                    <span className="text-xs text-primary font-semibold">({progressPercent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden mt-3">
                    <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              {/* AI Adapted Lesson Alert Banner */}
              {aiAdaptedLesson && (
                <div className="mb-6 p-4 rounded-xl glass border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-text-primary">{aiAdaptedLesson.title}</h4>
                    <p className="text-[11px] text-text-secondary mt-1">{aiAdaptedLesson.desc}</p>
                    <button
                      onClick={() => handleLessonStart(aiAdaptedLesson)}
                      disabled={aiAdaptedLesson.completed}
                      className="mt-3 btn-primary py-1.5 px-4 rounded-lg text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {aiAdaptedLesson.completed ? 'Completed' : 'Practice Lesson'}
                      <Play className="w-3 h-3 fill-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Units List */}
              <div className="space-y-6">
                {units.map((unit) => (
                  <div key={unit.id} className="space-y-3">
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider pl-1">{unit.title}</h3>
                    <p className="text-[11px] text-text-tertiary -mt-2 pl-1 mb-2">{unit.desc}</p>

                    <div className="grid grid-cols-1 gap-3">
                      {unit.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`glass-card p-4 flex items-center justify-between gap-4 transition-all ${
                            lesson.completed ? 'border-primary/20 bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              lesson.completed ? 'bg-primary/20 text-primary' : 'bg-bg-secondary text-text-secondary'
                            }`}>
                              {lesson.completed ? <CheckCircle2 className="w-4.5 h-4.5" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-text-primary">{lesson.title}</h4>
                              <p className="text-[10px] text-text-tertiary mt-0.5">{lesson.desc}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleLessonStart(lesson)}
                            className={`py-1.5 px-4 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              lesson.completed
                                ? 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary'
                                : 'btn-primary'
                            }`}
                          >
                            {lesson.completed ? 'Review' : 'Start'}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Interactive Lesson Workspace */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-6"
            >
              <button
                onClick={() => setActiveLesson(null)}
                className="btn-ghost py-1 px-3 rounded-lg text-xs font-medium flex items-center gap-1 mb-6 border-border"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Path
              </button>

              <h2 className="text-base font-bold text-text-primary mb-1">{activeLesson.title}</h2>
              <p className="text-xs text-text-tertiary mb-6">{activeLesson.desc}</p>

              {activeLesson.type === 'vocab' && activeLesson.content.words && (
                /* Vocabulary Review Card Slide */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase">
                    <Lightbulb className="w-4 h-4" />
                    <span>Vocabulary Practice</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {activeLesson.content.words.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl glass border border-border flex justify-between items-center gap-4">
                        <div>
                          <p className="text-sm font-bold text-text-primary">{item.word}</p>
                          <p className="text-xs text-text-tertiary mt-1">{item.meaning}</p>
                        </div>
                        <button
                          onClick={() => speakText(item.word)}
                          className="p-2 rounded-lg hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors"
                          title="Listen Pronunciation"
                        >
                          <Volume2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      handleCompleteLesson(activeLesson.id);
                      setActiveLesson(null);
                    }}
                    className="w-full btn-primary py-2.5 rounded-xl font-bold text-xs mt-6 shadow-md"
                  >
                    Finish Lesson (+40 XP)
                  </button>
                </div>
              )}

              {activeLesson.type === 'grammar' && activeLesson.content.quiz && (
                /* Interactive grammar multiple choice question */
                <div className="space-y-4">
                  {activeLesson.content.quiz.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-3">
                      <p className="text-xs font-semibold text-text-secondary">{q.q}</p>
                      
                      <div className="space-y-2">
                        {q.options.map((option) => {
                          const isSelected = selectedAnswers[qIdx] === option;
                          return (
                            <button
                              key={option}
                              onClick={() => handleQuizSelect(qIdx, option)}
                              disabled={quizScore !== null}
                              className={`w-full text-left p-3.5 rounded-xl glass border text-xs transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/5 text-primary font-bold'
                                  : 'border-border text-text-secondary hover:border-text-secondary'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {quizScore === null ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={selectedAnswers.length < activeLesson.content.quiz.length}
                      className="w-full btn-primary py-2.5 rounded-xl font-bold text-xs mt-6 disabled:opacity-50"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {quizScore === activeLesson.content.quiz.length ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                          🎉 Excellent! Perfect Score! You earned +40 XP.
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                          ❌ Incorrect answer. Review the unit and try again!
                        </div>
                      )}
                      
                      <button
                        onClick={() => setActiveLesson(null)}
                        className="w-full btn-primary py-2.5 rounded-xl font-bold text-xs"
                      >
                        Finish Lesson
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
