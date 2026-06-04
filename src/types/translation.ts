export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
  speechCode?: string;
}

export type ToneType = 'standard' | 'formal' | 'casual' | 'slang';

export interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  tone: ToneType;
  timestamp: number;
  isFavorite: boolean;
  type: 'text' | 'voice' | 'camera' | 'conversation';
  folderId?: string;
  alternatives?: string[];
  pronunciation?: string;
  grammarNotes?: string;
}

export interface ConversationMessage {
  id: string;
  speaker: 'A' | 'B';
  originalText: string;
  translatedText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  timestamp: number;
}

export interface TranslationStats {
  totalTranslations: number;
  languagesUsed: number;
  wordsTranslated: number;
  dailyUsage: number;
  streak: number;
  xp: number;
  level: number;
  favoriteCount: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence: number;
}
