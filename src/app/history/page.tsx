'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Star, Trash2, Search, Filter, Download,
  Languages, Mic, Camera, MessageSquare, Copy, Check,
  Volume2, X, ChevronDown
} from 'lucide-react';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode } from '@/lib/languages';

const typeIcons = {
  text: Languages,
  voice: Mic,
  camera: Camera,
  conversation: MessageSquare,
};

const typeColors = {
  text: 'bg-emerald-500/10 text-emerald-500',
  voice: 'bg-blue-500/10 text-blue-500',
  camera: 'bg-purple-500/10 text-purple-500',
  conversation: 'bg-orange-500/10 text-orange-500',
};

export default function HistoryPage() {
  const { translations, toggleFavorite, removeTranslation, clearHistory } = useHistoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'text' | 'voice' | 'camera' | 'conversation' | 'favorites'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = useMemo(() => {
    let result = translations;

    if (filter === 'favorites') {
      result = result.filter(t => t.isFavorite);
    } else if (filter !== 'all') {
      result = result.filter(t => t.type === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.sourceText.toLowerCase().includes(q) ||
        t.translatedText.toLowerCase().includes(q)
      );
    }

    return result;
  }, [translations, filter, searchQuery]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  const handleExport = () => {
    const data = filtered.map(t => ({
      source: t.sourceText,
      translated: t.translatedText,
      from: t.sourceLanguage.name,
      to: t.targetLanguage.name,
      type: t.type,
      date: new Date(t.timestamp).toISOString(),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const filters: { key: typeof filter; label: string; icon?: React.ElementType }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: '★ Favorites' },
    { key: 'text', label: 'Text', icon: Languages },
    { key: 'voice', label: 'Voice', icon: Mic },
    { key: 'camera', label: 'Camera', icon: Camera },
    { key: 'conversation', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">History</h1>
              <p className="text-sm text-text-tertiary">{translations.length} translations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} disabled={filtered.length === 0}
              className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary hover:text-text-primary disabled:opacity-40" title="Export">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setShowClearConfirm(true)} disabled={translations.length === 0}
              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-text-tertiary hover:text-red-400 disabled:opacity-40" title="Clear all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search translations..."
            className="w-full pl-10 pr-10 py-3 rounded-xl glass border border-border focus:border-primary/50 focus:outline-none text-sm text-text-primary placeholder:text-text-tertiary/50 transition-colors"
            id="search-history"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                filter === f.key ? 'bg-primary text-white' : 'glass text-text-secondary hover:text-text-primary'
              }`}>
              {f.icon && <f.icon className="w-3 h-3" />}
              <span>{f.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Translations List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Search className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <h3 className="text-base font-semibold text-text-primary mb-1">
                {searchQuery ? 'No matches found' : 'No translations yet'}
              </h3>
              <p className="text-sm text-text-tertiary">
                {searchQuery ? 'Try a different search term' : 'Your translation history will appear here'}
              </p>
            </div>
          ) : (
            filtered.map((t, i) => {
              const TypeIcon = typeIcons[t.type];
              const typeColor = typeColors[t.type];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="glass-card p-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${typeColor} shrink-0`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{t.sourceLanguage.flag}</span>
                        <span className="text-xs text-text-tertiary">→</span>
                        <span className="text-sm">{t.targetLanguage.flag}</span>
                        <span className="text-xs text-text-tertiary ml-auto">{formatTime(t.timestamp)}</span>
                      </div>
                      <p className="text-sm text-text-primary truncate mb-1">{t.sourceText}</p>
                      <p className="text-sm text-text-secondary truncate">{t.translatedText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(t.translatedText, t.id)}
                      className="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors">
                      {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleSpeak(t.translatedText, t.targetLanguage.code)}
                      className="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors">
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleFavorite(t.id)}
                      className="p-1.5 rounded-md hover:bg-bg-secondary text-text-tertiary hover:text-yellow-400 transition-colors">
                      <Star className={`w-3.5 h-3.5 ${t.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => removeTranslation(t.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-text-tertiary hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-text-primary mb-2">Clear History?</h3>
                <p className="text-sm text-text-secondary mb-6">This will delete all your translation history. This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl btn-ghost text-sm">Cancel</button>
                  <button onClick={() => { clearHistory(); setShowClearConfirm(false); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                    Delete All
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
