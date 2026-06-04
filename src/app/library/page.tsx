'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FolderPlus, Star, Search, Trash2, Volume2,
  FolderOpen, ChevronRight, X, Clock, Plus, Filter, Globe, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode } from '@/lib/languages';
import { TranslationResult } from '@/types/translation';

function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFolderId = searchParams.get('folder') || 'all';

  const { currentUser, createFolder, deleteFolder } = useAuthStore();
  const { translations, toggleFavorite, removeTranslation, assignToFolder } = useHistoryStore();

  const [selectedFolder, setSelectedFolder] = useState(initialFolderId);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'text' | 'voice' | 'camera'>('all');

  // Track active folder dropdown per translation card
  const [activeMoveDropdown, setActiveMoveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const folderParam = searchParams.get('folder');
    if (folderParam) {
      setSelectedFolder(folderParam);
    }
  }, [searchParams]);

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-sm">
          <Folder className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Private Translation Library</h3>
          <p className="text-xs text-text-tertiary mb-6">
            Sign in to organize your translations into custom folders, search through saved history, and track vocabulary.
          </p>
          <button onClick={() => router.push('/auth/login')} className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-md">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  // Create new folder submit
  const handleAddFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowAddFolder(false);
    }
  };

  // Speak voice synthesizer
  const handleSpeak = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = getLanguageByCode(langCode);
      utterance.lang = lang.speechCode || langCode;
      utterance.rate = 0.9;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  // Get unique languages in saved history
  const uniqueLanguages = Array.from(
    new Set(translations.map(t => t.targetLanguage.code))
  ).map(code => getLanguageByCode(code));

  // Filter translations
  const filteredTranslations = translations.filter((item) => {
    // 1. Search Query filter
    const matchesSearch =
      item.sourceText.toLowerCase().includes(search.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(search.toLowerCase());

    // 2. Language filter
    const matchesLang = langFilter === 'all' || item.targetLanguage.code === langFilter;

    // 3. Tab filter
    const matchesTab = activeTab === 'all' || item.type === activeTab;

    // 4. Folder filter
    let matchesFolder = true;
    if (selectedFolder === 'favorites') {
      matchesFolder = item.isFavorite;
    } else if (selectedFolder !== 'all') {
      matchesFolder = item.folderId === selectedFolder;
    }

    return matchesSearch && matchesLang && matchesTab && matchesFolder;
  });

  return (
    <div className="min-h-screen pb-24 md:pb-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-lg">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Saved Library</h1>
              <p className="text-xs text-text-tertiary">Organize your private expressions, texts, and voice logs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Folders Sidebar Panel */}
          <div className="md:col-span-1 space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Folders</h3>
                <button
                  onClick={() => setShowAddFolder(!showAddFolder)}
                  className="p-1 hover:bg-bg-secondary rounded-lg text-primary transition-colors"
                  title="New Folder"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Add folder expander */}
              <AnimatePresence>
                {showAddFolder && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddFolderSubmit}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="flex gap-1.5">
                      <input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder Name..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg glass border border-border text-text-primary focus:outline-none focus:border-primary/50"
                      />
                      <button type="submit" className="btn-primary p-1.5 rounded-lg">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Folder list buttons */}
              <div className="space-y-1">
                {[
                  { id: 'all', name: '📁 All Saved Items' },
                  { id: 'favorites', name: '⭐ Favorites' },
                  ...currentUser.libraryFolders.map(f => ({ id: f.id, name: `📁 ${f.name}` }))
                ].map((folder) => {
                  const isActive = selectedFolder === folder.id;
                  const isCustom = folder.id !== 'all' && folder.id !== 'favorites';
                  return (
                    <div
                      key={folder.id}
                      className={`flex items-center justify-between group rounded-xl transition-colors ${
                        isActive ? 'bg-primary/10 text-primary font-bold' : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className="flex-1 text-left px-3 py-2 text-xs flex items-center gap-2"
                      >
                        <span className="truncate">{folder.name}</span>
                      </button>
                      
                      {isCustom && (
                        <button
                          onClick={() => {
                            deleteFolder(folder.id);
                            if (selectedFolder === folder.id) setSelectedFolder('all');
                          }}
                          className="p-1 text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mr-1 rounded"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Library Content Panel */}
          <div className="md:col-span-3 space-y-4">
            {/* Search, Filter, Tabs Row */}
            <div className="glass-card p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search query */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search query within library..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl glass border border-border text-xs text-text-primary focus:outline-none focus:border-primary/50"
                  />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"><X className="w-3.5 h-3.5" /></button>}
                </div>

                {/* Target language filters */}
                <div className="relative flex-shrink-0">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <select
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-xl glass border border-border text-xs text-text-secondary focus:outline-none focus:border-primary/50 appearance-none bg-transparent"
                  >
                    <option value="all">All Languages</option>
                    {uniqueLanguages.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-text-tertiary absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex items-center gap-1 border-t border-border pt-3">
                {(['all', 'text', 'voice', 'camera'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                      activeTab === tab
                        ? 'bg-primary/20 text-primary'
                        : 'text-text-tertiary hover:text-text-primary hover:bg-bg-glass'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Translation Cards list */}
            <div className="space-y-3">
              {filteredTranslations.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Folder className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-40" />
                  <h3 className="text-base font-bold text-text-primary mb-1">No matches found</h3>
                  <p className="text-xs text-text-tertiary">Try adjusting your filter options or search terms.</p>
                </div>
              ) : (
                filteredTranslations.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    className="glass-card p-5 relative group"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0 mt-0.5" title={item.sourceLanguage.name}>
                        {item.sourceLanguage.flag}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary select-all leading-normal">{item.sourceText}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-2xl flex-shrink-0" title={item.targetLanguage.name}>
                            {item.targetLanguage.flag}
                          </span>
                          <p className="text-sm font-bold text-text-secondary select-all leading-normal">{item.translatedText}</p>
                        </div>

                        {/* Extra metadata */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] text-text-tertiary font-medium">
                          <span className="bg-bg-secondary px-2 py-0.5 rounded border border-border capitalize">{item.type}</span>
                          {item.tone && <span className="bg-bg-secondary px-2 py-0.5 rounded border border-border capitalize">{item.tone}</span>}
                          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          
                          {/* Folder badge */}
                          {item.folderId && (
                            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                              📁 {currentUser.libraryFolders.find(f => f.id === item.folderId)?.name || 'Custom Folder'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Panel */}
                      <div className="flex items-center gap-1">
                        {/* Audio Speak */}
                        <button
                          onClick={() => handleSpeak(item.translatedText, item.targetLanguage.code)}
                          className="p-1.5 hover:bg-bg-secondary text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
                          title="Speak Translation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Folder Allocation Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveMoveDropdown(activeMoveDropdown === item.id ? null : item.id)}
                            className="p-1.5 hover:bg-bg-secondary text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
                            title="Move to Folder"
                          >
                            <Folder className="w-4 h-4" />
                          </button>
                          
                          {activeMoveDropdown === item.id && (
                            <div className="absolute right-0 mt-1 z-40 w-44 glass-card p-2 shadow-xl">
                              <p className="text-[9px] uppercase font-bold text-text-tertiary mb-1 px-1.5">Organize into:</p>
                              <button
                                onClick={() => { assignToFolder(item.id, undefined); setActiveMoveDropdown(null); }}
                                className="w-full text-left text-[11px] px-2 py-1 hover:bg-bg-secondary text-text-secondary rounded"
                              >
                                (No Folder)
                              </button>
                              {currentUser.libraryFolders.map(folder => (
                                <button
                                  key={folder.id}
                                  onClick={() => { assignToFolder(item.id, folder.id); setActiveMoveDropdown(null); }}
                                  className={`w-full text-left text-[11px] px-2 py-1 hover:bg-bg-secondary rounded truncate block ${item.folderId === folder.id ? 'text-primary font-bold' : 'text-text-secondary'}`}
                                >
                                  {folder.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Favorite toggle */}
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors text-text-tertiary hover:text-yellow-400"
                        >
                          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>

                        {/* Delete entry */}
                        <button
                          onClick={() => removeTranslation(item.id)}
                          className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors text-text-tertiary hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  );
}
