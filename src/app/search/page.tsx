'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search, Globe, Folder, BookOpen, Clock, ArrowRight, X, Sparkles, MessageSquare, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode } from '@/lib/languages';

interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  type: 'translation' | 'lesson' | 'tutor' | 'vocabulary';
  href: string;
  meta?: string;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { currentUser } = useAuthStore();
  const { translations } = useHistoryStore();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null) {
      setQuery(qParam);
      performSearch(qParam);
    }
  }, [searchParams, translations, currentUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim() || !currentUser) {
      setResults([]);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const list: SearchResultItem[] = [];

    // 1. Search Translation History
    translations.forEach((item) => {
      if (
        item.sourceText.toLowerCase().includes(q) ||
        item.translatedText.toLowerCase().includes(q)
      ) {
        list.push({
          id: `trans-${item.id}`,
          title: `Translation: ${item.sourceLanguage.flag} to ${item.targetLanguage.flag}`,
          snippet: `"${item.sourceText}" ➔ "${item.translatedText}"`,
          type: 'translation',
          href: `/library?folder=${item.folderId || 'all'}`,
          meta: new Date(item.timestamp).toLocaleDateString()
        });
      }
    });

    // 2. Search AI Tutor logs
    currentUser.tutorMemory.forEach((msg, idx) => {
      if (msg.content.toLowerCase().includes(q)) {
        list.push({
          id: `tutor-${idx}`,
          title: `AI Tutor Log (${msg.role === 'user' ? 'Student' : 'Tutor'})`,
          snippet: msg.content.length > 100 ? `${msg.content.slice(0, 100)}...` : msg.content,
          type: 'tutor',
          href: '/assistant',
          meta: new Date(msg.timestamp).toLocaleDateString()
        });
      }
    });

    // 3. Search Vocabulary Bank
    currentUser.vocabBank.forEach((v) => {
      if (
        v.word.toLowerCase().includes(q) ||
        v.translation.toLowerCase().includes(q)
      ) {
        list.push({
          id: `vocab-${v.id}`,
          title: `Vocabulary Word: ${v.word}`,
          snippet: `Translation: "${v.translation}" (Status: ${v.status})`,
          type: 'vocabulary',
          href: '/learn',
          meta: `Difficulty: ${v.difficulty}/5`
        });
      }
    });

    // 4. Search Learning Path units/lessons
    const targetLang = getLanguageByCode(currentUser.targetLanguages[0] || 'es');
    const pathLessons = [
      { id: 'u1-l1', title: 'Greetings & Introduction', desc: `Learn basic greetings in ${targetLang.name}` },
      { id: 'u1-l2', title: 'Survival Grammar', desc: `Understand fundamental ${targetLang.name} constructs` },
      { id: 'u2-l1', title: 'Numbers & Shopping', desc: `Ask for prices and make purchases in ${targetLang.name}` }
    ];

    pathLessons.forEach((lesson) => {
      if (
        lesson.title.toLowerCase().includes(q) ||
        lesson.desc.toLowerCase().includes(q)
      ) {
        list.push({
          id: `lesson-${lesson.id}`,
          title: `Learning Path: ${lesson.title}`,
          snippet: lesson.desc,
          type: 'lesson',
          href: '/learn/path',
          meta: 'Lesson Milestone'
        });
      }
    });

    setResults(list);
  };

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-sm">
          <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Global Intelligent Search</h3>
          <p className="text-xs text-text-tertiary mb-6">
            Register or sign in to search across all of your private translation records, vocabulary logs, and learning milestones.
          </p>
          <button onClick={() => router.push('/auth/login')} className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-md">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Global Search</h1>
            <p className="text-xs text-text-tertiary">Real-time intelligent query across history, lessons, and logs</p>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 mb-8">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-tertiary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history, vocabulary, tutor chats..."
              className="w-full pl-11 pr-12 py-3 rounded-xl glass border border-border text-sm text-text-primary focus:border-primary/50 focus:outline-none transition-colors"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-4 text-text-tertiary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary py-3 px-5 rounded-xl text-xs font-bold shadow-md">
            Search
          </button>
        </form>

        {/* Search Results list */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
              {results.length} Search Results
            </h3>
          </div>

          <div className="space-y-3">
            {results.map((res) => (
              <div
                key={res.id}
                onClick={() => router.push(res.href)}
                className="glass-card p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-primary flex-shrink-0 mt-0.5 border border-border">
                  {res.type === 'translation' && <Clock className="w-4 h-4" />}
                  {res.type === 'tutor' && <MessageSquare className="w-4 h-4" />}
                  {res.type === 'vocabulary' && <BookOpen className="w-4 h-4" />}
                  {res.type === 'lesson' && <Sparkles className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="text-xs font-bold text-text-primary truncate">{res.title}</h4>
                    {res.meta && <span className="text-[9px] text-text-tertiary font-medium flex-shrink-0">{res.meta}</span>}
                  </div>
                  <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">{res.snippet}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-text-tertiary self-center flex-shrink-0" />
              </div>
            ))}

            {query.trim() && results.length === 0 && (
              <div className="glass-card p-12 text-center">
                <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
                <h3 className="text-base font-bold text-text-primary mb-1">No matches found</h3>
                <p className="text-xs text-text-tertiary">We couldn't find any results matching your search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
