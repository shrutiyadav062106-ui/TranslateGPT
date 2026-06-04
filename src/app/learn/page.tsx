'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Star, RefreshCw, CheckCircle2, XCircle, Award, Sparkles,
  ArrowRight, Check, Play, Volume2, Trophy
} from 'lucide-react';
import { useHistoryStore } from '@/stores/history-store';
import { useLearningStore } from '@/stores/learning-store';
import { getLanguageByCode } from '@/lib/languages';

// High-quality default phrases if user history is empty
const DEFAULT_STUDY_PHRASES = [
  { id: 'def-1', sourceText: 'Hello, how are you?', translatedText: 'Hola, ¿cómo estás?', sourceLanguage: { flag: '🇺🇸', name: 'English', code: 'en' }, targetLanguage: { flag: '🇪🇸', name: 'Spanish', code: 'es' }, pronunciation: '/oh-lah koh-moh es-tahs/', grammarNotes: 'Standard greeting. Uses the informal singular form of the verb estar.' },
  { id: 'def-2', sourceText: 'Thank you very much', translatedText: 'Merci beaucoup', sourceLanguage: { flag: '🇺🇸', name: 'English', code: 'en' }, targetLanguage: { flag: '🇫🇷', name: 'French', code: 'fr' }, pronunciation: '/mair-see boh-coo/', grammarNotes: 'Beaucoup translates to "a lot" or "much".' },
  { id: 'def-3', sourceText: 'Where is the bathroom?', translatedText: 'Wo ist die Toilette?', sourceLanguage: { flag: '🇺🇸', name: 'English', code: 'en' }, targetLanguage: { flag: '🇩🇪', name: 'German', code: 'de' }, pronunciation: '/voh ist dee twah-let-uh/', grammarNotes: '"Toilette" is feminine in German, hence "die".' },
  { id: 'def-4', sourceText: 'How much does this cost?', translatedText: 'これいくらですか (Kore ikura desu ka?)', sourceLanguage: { flag: '🇺🇸', name: 'English', code: 'en' }, targetLanguage: { flag: '🇯🇵', name: 'Japanese', code: 'ja' }, pronunciation: '/koh-reh ee-coo-rah dess kah/', grammarNotes: '"Ka" is the spoken question mark in Japanese.' },
  { id: 'def-5', sourceText: 'I would like water please', translatedText: 'Vorrei dell\'acqua per favore', sourceLanguage: { flag: '🇺🇸', name: 'English', code: 'en' }, targetLanguage: { flag: '🇮🇹', name: 'Italian', code: 'it' }, pronunciation: '/vohr-ray dell ah-kwah pair fah-voh-reh/', grammarNotes: '"Vorrei" is the polite conditional form of "volere" (to want).' },
];

export default function LearnPage() {
  const translations = useHistoryStore((s) => s.translations);
  const stats = useHistoryStore((s) => s.stats);
  const addTranslation = useHistoryStore((s) => s.addTranslation);
  const { masteredWords, markWordMastered, takeQuiz, checkBadgeUnlocks } = useLearningStore();

  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz'>('flashcards');

  // Flashcards state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizAnswersRecord, setQuizAnswersRecord] = useState<boolean[]>([]);

  // Notification for newly unlocked badges
  const [newBadgeAlert, setNewBadgeAlert] = useState<string | null>(null);

  // Pull favorites and recent translations for study items
  const studyItems = useMemo(() => {
    const favorites = translations.filter(t => t.isFavorite);
    const recent = translations.slice(0, 10);
    const combined = [...favorites, ...recent].filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    );
    
    // Map items to simple layout compatible with study details
    const mappedItems = combined.map(item => ({
      id: item.id,
      sourceText: item.sourceText,
      translatedText: item.translatedText,
      sourceLanguage: item.sourceLanguage,
      targetLanguage: item.targetLanguage,
      pronunciation: item.pronunciation || `/${item.translatedText.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').join(' · ')}/`,
      grammarNotes: item.grammarNotes || 'Saved from your active translation history.'
    }));

    return mappedItems.length > 0 ? mappedItems : DEFAULT_STUDY_PHRASES;
  }, [translations]);

  const currentCard = studyItems[currentCardIdx] || studyItems[0];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev + 1) % studyItems.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev - 1 + studyItems.length) % studyItems.length);
    }, 150);
  };

  const handleMarkMastered = () => {
    const isMastered = masteredWords.includes(currentCard.id);
    markWordMastered(currentCard.id, !isMastered);
  };

  // Generate quiz questions based on current study items
  const quizQuestions = useMemo(() => {
    const questions = [];
    const pool = studyItems.length >= 4 ? studyItems : [...studyItems, ...DEFAULT_STUDY_PHRASES];

    // Pick 5 unique random items for questions
    const selectedItems = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);

    for (const item of selectedItems) {
      // Pick 3 random incorrect answers from other items in the pool
      const incorrectPool = pool.filter(p => p.id !== item.id);
      const incorrectTranslations = incorrectPool
        .map(p => p.translatedText)
        .filter((v, i, a) => a.indexOf(v) === i) // Unique
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      // Ensure we have 4 options
      while (incorrectTranslations.length < 3) {
        incorrectTranslations.push(`Dummy variant ${incorrectTranslations.length + 1}`);
      }

      const options = [item.translatedText, ...incorrectTranslations].sort(() => 0.5 - Math.random());

      questions.push({
        id: item.id,
        question: `How do you say "${item.sourceText}" in ${item.targetLanguage.name}?`,
        options,
        correctAnswer: item.translatedText,
        explanation: item.grammarNotes || `"${item.translatedText}" is the correct translation.`
      });
    }

    return questions;
  }, [studyItems, quizActive]); // Re-generate only when quiz starts

  const activeQuestion = quizQuestions[quizQuestionIdx];

  const handleStartQuiz = () => {
    setQuizActive(true);
    setQuizQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizAnswersRecord([]);
  };

  const handleAnswerSubmit = (option: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks
    setSelectedAnswer(option);

    const isCorrect = option === activeQuestion.correctAnswer;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
    setQuizAnswersRecord((prev) => [...prev, isCorrect]);
  };

  const handleNextQuizQuestion = () => {
    setSelectedAnswer(null);
    if (quizQuestionIdx < quizQuestions.length - 1) {
      setQuizQuestionIdx((prev) => prev + 1);
    } else {
      // Finish Quiz
      setQuizFinished(true);
      
      const perfectScore = quizScore === quizQuestions.length;
      takeQuiz(perfectScore);

      // Add XP reward to history store
      const xpEarned = quizScore * 10 + (perfectScore ? 20 : 0);
      const historyStore = useHistoryStore.getState();
      
      // Update XP in history store
      const newXp = historyStore.stats.xp + xpEarned;
      const newLevel = Math.floor(newXp / 500) + 1;
      
      const leveledUp = newLevel > historyStore.stats.level;

      useHistoryStore.setState({
        stats: {
          ...historyStore.stats,
          xp: newXp,
          level: newLevel,
        }
      });

      // Check badges
      setTimeout(() => {
        const newlyUnlocked = useLearningStore.getState().checkBadgeUnlocks();
        if (newlyUnlocked.length > 0) {
          setNewBadgeAlert(newlyUnlocked.join(', '));
        } else if (leveledUp) {
          setNewBadgeAlert(`Level ${newLevel}!`);
        }
      }, 500);
    }
  };

  const handleSpeak = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = getLanguageByCode(langCode);
      utterance.lang = lang.speechCode || langCode;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const xpProgressPercentage = (stats.xp % 500) / 5; // 500 XP per level
  const dailyTargetPercent = Math.min(100, (stats.dailyUsage / 5) * 100);

  return (
    <div className="min-h-screen pb-24 md:pb-8 max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Study & Quizzes</h1>
          <p className="text-sm text-text-tertiary">Review vocabulary flashcards and test your knowledge</p>
        </div>
      </motion.div>

      {/* Badges and Levels Dashboard Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        {/* Level Card */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-xl relative">
            <Trophy className="w-6 h-6" />
            <span className="absolute -bottom-1.5 -right-1.5 bg-accent text-[9px] text-text-inverse px-1 py-0.5 rounded-full font-extrabold shadow-sm border border-border">
              Lvl {stats.level}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-text-secondary">Level Progress</span>
              <span className="text-primary font-bold">{stats.xp % 500} / 500 XP</span>
            </div>
            <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden border border-border/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgressPercentage}%` }}
                transition={{ duration: 0.6 }}
                className="h-full gradient-primary"
              />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl">
            🔥
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary">Study Streak</p>
            <p className="text-lg font-bold text-orange-500">{stats.streak} Consecutive Days</p>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="glass-card p-5 flex items-center gap-4">
          {/* Circular progress SVG */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-bg-secondary"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${dailyTargetPercent}, 100` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-primary"
                strokeDasharray="0 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary">
              {stats.dailyUsage}/5
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary">Daily Activity Goal</p>
            <p className="text-xs text-text-tertiary">Translate 5 phrases per day to preserve your streak</p>
          </div>
        </div>
      </motion.div>

      {/* New Badge Alert Modal */}
      <AnimatePresence>
        {newBadgeAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="glass-card p-8 max-w-sm w-full text-center relative overflow-hidden">
              <div className="absolute top-[-20%] left-[-20%] w-[200px] h-[200px] rounded-full bg-primary/10 blur-[80px]" />
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 text-4xl animate-bounce">
                🏆
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Congratulations!</h2>
              <p className="text-sm text-text-secondary mb-6">
                You unlocked an Achievement or Leveled Up:
                <br />
                <span className="font-extrabold text-primary text-base block mt-2">{newBadgeAlert}</span>
              </p>
              <button
                onClick={() => setNewBadgeAlert(null)}
                className="btn-primary w-full py-2.5 rounded-xl font-bold"
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => { setActiveTab('flashcards'); setQuizActive(false); }}
          className={`px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'flashcards' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Flashcards ({studyItems.length})
          {activeTab === 'flashcards' && (
            <motion.div
              layoutId="learn-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'quiz' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Practice Quiz
          {activeTab === 'quiz' && (
            <motion.div
              layoutId="learn-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'flashcards' ? (
          <motion.div
            key="flashcards"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col items-center justify-center py-4"
          >
            {/* Study Card (3D Flippable card container) */}
            <div
              className="w-full max-w-lg aspect-[5/3] cursor-pointer relative mb-6"
              onClick={handleFlip}
              style={{ perspective: 1000 }}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front Side: Original Word */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl glass-card p-8 flex flex-col justify-between"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex items-center justify-between text-xs text-text-tertiary font-medium">
                    <span>FRONT — TAP TO TRANSLATE</span>
                    <span className="flex items-center gap-1.5 bg-bg-secondary px-2.5 py-1 rounded-full text-text-secondary">
                      {currentCard.sourceLanguage.flag} {currentCard.sourceLanguage.name}
                    </span>
                  </div>

                  <div className="text-center py-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-text-primary tracking-wide">
                      {currentCard.sourceText}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center text-xs text-text-tertiary">
                    <span>Card {currentCardIdx + 1} of {studyItems.length}</span>
                    <span className="flex items-center gap-1 text-primary">
                      Click to reveal <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Back Side: Translated Word */}
                <div
                  className="absolute inset-0 w-full h-full rounded-2xl glass-card p-8 flex flex-col justify-between"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                  onClick={(e) => {
                    // Prevent flipping card when clicking inner interactive buttons
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-text-tertiary font-medium">
                    <button
                      onClick={handleFlip}
                      className="hover:underline flex items-center gap-1 text-[10px]"
                    >
                      ← BACK TO FRONT
                    </button>
                    <span className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full text-primary">
                      {currentCard.targetLanguage.flag} {currentCard.targetLanguage.name}
                    </span>
                  </div>

                  <div className="text-center py-4 flex flex-col items-center">
                    <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1">
                      {currentCard.translatedText}
                    </h3>
                    <p className="text-sm text-text-secondary font-mono italic mb-2">
                      {currentCard.pronunciation}
                    </p>
                    <p className="text-xs text-text-tertiary max-w-sm line-clamp-2">
                      {currentCard.grammarNotes}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleSpeak(currentCard.translatedText, currentCard.targetLanguage.code)}
                      className="p-2 rounded-lg hover:bg-bg-secondary text-text-tertiary hover:text-text-primary"
                      title="Speak translated text"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleMarkMastered}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        masteredWords.includes(currentCard.id)
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                          : 'border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {masteredWords.includes(currentCard.id) ? 'Mastered!' : 'Mark Mastered'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Carousel navigation controls */}
            <div className="flex gap-4">
              <button
                onClick={handlePrevCard}
                className="btn-ghost px-5 py-2 rounded-xl text-xs hover:border-primary/40 font-semibold"
              >
                Previous Card
              </button>
              <button
                onClick={handleNextCard}
                className="btn-primary px-6 py-2 rounded-xl text-xs font-semibold"
              >
                Next Card
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="w-full max-w-lg mx-auto"
          >
            {!quizActive ? (
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary text-3xl">
                  🧩
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Ready to test your vocabulary?</h3>
                <p className="text-xs text-text-tertiary mb-6 max-w-xs mx-auto leading-relaxed">
                  Start a rapid-fire quiz based on your translations. Get perfect answers to earn bonus XP and climb leaderboards!
                </p>
                <button
                  onClick={handleStartQuiz}
                  className="btn-primary px-8 py-3 rounded-xl font-bold text-sm w-full sm:w-auto"
                >
                  Start Practice Quiz
                </button>
              </div>
            ) : quizFinished ? (
              <div className="glass-card p-8 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500 text-3xl">
                  🎉
                </div>
                <h3 className="text-xl font-extrabold text-text-primary mb-1">Quiz Completed!</h3>
                <p className="text-sm text-text-secondary mb-4">
                  You scored **{quizScore} out of {quizQuestions.length}** correct answers.
                </p>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-bg-secondary/40 border border-border/30 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider block font-medium mb-0.5">XP Earned</span>
                    <span className="text-lg font-bold text-primary">+{quizScore * 10 + (quizScore === 5 ? 20 : 0)} XP</span>
                  </div>
                  <div className="bg-bg-secondary/40 border border-border/30 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider block font-medium mb-0.5">Grade</span>
                    <span className={`text-lg font-bold ${quizScore >= 4 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {quizScore === 5 ? 'A+' : quizScore >= 4 ? 'A' : 'B'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleStartQuiz}
                    className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setQuizActive(false)}
                    className="btn-ghost flex-1 py-2.5 rounded-xl text-xs font-semibold border-border hover:bg-bg-secondary"
                  >
                    Study Cards
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 md:p-8">
                {/* Quiz progress tracker indicator */}
                <div className="flex items-center justify-between mb-6 text-xs text-text-tertiary">
                  <span>Question {quizQuestionIdx + 1} of {quizQuestions.length}</span>
                  <div className="flex gap-1.5">
                    {quizQuestions.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-3 h-1.5 rounded-full transition-colors ${
                          idx === quizQuestionIdx
                            ? 'bg-primary'
                            : quizAnswersRecord[idx] !== undefined
                            ? quizAnswersRecord[idx]
                              ? 'bg-emerald-500'
                              : 'bg-red-500'
                            : 'bg-bg-secondary'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Active Question */}
                <h4 className="text-base sm:text-lg font-bold text-text-primary mb-6 leading-relaxed">
                  {activeQuestion.question}
                </h4>

                {/* Multiple choice options */}
                <div className="space-y-3 mb-6">
                  {activeQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = option === activeQuestion.correctAnswer;
                    const hasSelected = selectedAnswer !== null;

                    let btnClass = 'glass border-border hover:border-primary/40';
                    let Icon = null;

                    if (hasSelected) {
                      if (isCorrect) {
                        btnClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500';
                        Icon = CheckCircle2;
                      } else if (isSelected) {
                        btnClass = 'border-red-500/50 bg-red-500/10 text-red-500';
                        Icon = XCircle;
                      } else {
                        btnClass = 'border-border/30 opacity-40';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSubmit(option)}
                        disabled={hasSelected}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left font-medium text-sm transition-all duration-200 ${btnClass}`}
                      >
                        <span>{option}</span>
                        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation notes and Next button */}
                {selectedAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-bg-secondary/40 border border-border/40 text-xs text-text-secondary leading-relaxed mb-6"
                  >
                    <span className="font-bold text-text-primary block mb-1">Grammar Note:</span>
                    {activeQuestion.explanation}
                  </motion.div>
                )}

                {selectedAnswer && (
                  <button
                    onClick={handleNextQuizQuestion}
                    className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold"
                  >
                    {quizQuestionIdx === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
