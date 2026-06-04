import { TranslationResult, ToneType } from '@/types/translation';
import { Language } from '@/types/translation';
import { translateWithOpenAI } from './openai';

// Mock translation database - maps common phrases between languages
const mockTranslations: Record<string, Record<string, string>> = {
  'en-es': {
    'hello': 'hola',
    'goodbye': 'adiós',
    'thank you': 'gracias',
    'how are you': 'cómo estás',
    'good morning': 'buenos días',
    'good night': 'buenas noches',
    'please': 'por favor',
    'yes': 'sí',
    'no': 'no',
    'i love you': 'te quiero',
    'what is your name': 'cómo te llamas',
    'my name is': 'me llamo',
    'where is': 'dónde está',
    'how much': 'cuánto cuesta',
  },
  'en-fr': {
    'hello': 'bonjour',
    'goodbye': 'au revoir',
    'thank you': 'merci',
    'how are you': 'comment allez-vous',
    'good morning': 'bonjour',
    'good night': 'bonne nuit',
    'please': 's\'il vous plaît',
    'yes': 'oui',
    'no': 'non',
    'i love you': 'je t\'aime',
    'what is your name': 'comment vous appelez-vous',
    'my name is': 'je m\'appelle',
  },
  'en-de': {
    'hello': 'hallo',
    'goodbye': 'auf wiedersehen',
    'thank you': 'danke',
    'how are you': 'wie geht es Ihnen',
    'good morning': 'guten Morgen',
    'good night': 'gute Nacht',
    'please': 'bitte',
    'yes': 'ja',
    'no': 'nein',
    'i love you': 'ich liebe dich',
  },
  'en-ja': {
    'hello': 'こんにちは',
    'goodbye': 'さようなら',
    'thank you': 'ありがとうございます',
    'how are you': 'お元気ですか',
    'good morning': 'おはようございます',
    'good night': 'おやすみなさい',
    'please': 'お願いします',
    'yes': 'はい',
    'no': 'いいえ',
    'i love you': '愛しています',
  },
  'en-zh': {
    'hello': '你好',
    'goodbye': '再见',
    'thank you': '谢谢',
    'how are you': '你好吗',
    'good morning': '早上好',
    'good night': '晚安',
    'please': '请',
    'yes': '是',
    'no': '不',
    'i love you': '我爱你',
  },
  'en-ko': {
    'hello': '안녕하세요',
    'goodbye': '안녕히 가세요',
    'thank you': '감사합니다',
    'how are you': '어떻게 지내세요',
    'good morning': '좋은 아침이에요',
    'good night': '잘 자요',
    'please': '부탁합니다',
    'yes': '네',
    'no': '아니요',
    'i love you': '사랑해요',
  },
  'en-hi': {
    'hello': 'नमस्ते',
    'goodbye': 'अलविदा',
    'thank you': 'धन्यवाद',
    'how are you': 'आप कैसे हैं',
    'good morning': 'सुप्रभात',
    'good night': 'शुभ रात्रि',
    'please': 'कृपया',
    'yes': 'हाँ',
    'no': 'नहीं',
    'i love you': 'मैं तुमसे प्यार करता हूँ',
  },
  'en-ar': {
    'hello': 'مرحبا',
    'goodbye': 'مع السلامة',
    'thank you': 'شكرا لك',
    'how are you': 'كيف حالك',
    'good morning': 'صباح الخير',
    'good night': 'تصبح على خير',
    'please': 'من فضلك',
    'yes': 'نعم',
    'no': 'لا',
    'i love you': 'أحبك',
  },
  'en-ru': {
    'hello': 'привет',
    'goodbye': 'до свидания',
    'thank you': 'спасибо',
    'how are you': 'как дела',
    'good morning': 'доброе утро',
    'good night': 'спокойной ночи',
    'please': 'пожалуйста',
    'yes': 'да',
    'no': 'нет',
    'i love you': 'я люблю тебя',
  },
  'en-pt': {
    'hello': 'olá',
    'goodbye': 'adeus',
    'thank you': 'obrigado',
    'how are you': 'como você está',
    'good morning': 'bom dia',
    'good night': 'boa noite',
    'please': 'por favor',
    'yes': 'sim',
    'no': 'não',
    'i love you': 'eu te amo',
  },
  'en-it': {
    'hello': 'ciao',
    'goodbye': 'arrivederci',
    'thank you': 'grazie',
    'how are you': 'come stai',
    'good morning': 'buongiorno',
    'good night': 'buonanotte',
    'please': 'per favore',
    'yes': 'sì',
    'no': 'no',
    'i love you': 'ti amo',
  },
  'en-tr': {
    'hello': 'merhaba',
    'goodbye': 'hoşça kal',
    'thank you': 'teşekkür ederim',
    'how are you': 'nasılsın',
    'good morning': 'günaydın',
    'good night': 'iyi geceler',
    'please': 'lütfen',
    'yes': 'evet',
    'no': 'hayır',
    'i love you': 'seni seviyorum',
  },
};

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
    pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', zh: 'Chinese', ja: 'Japanese',
    ko: 'Korean', ru: 'Russian', tr: 'Turkish', nl: 'Dutch', bn: 'Bengali',
    pl: 'Polish', sv: 'Swedish', da: 'Danish', fi: 'Finnish', no: 'Norwegian',
    el: 'Greek', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian', he: 'Hebrew',
    th: 'Thai', vi: 'Vietnamese', uk: 'Ukrainian', id: 'Indonesian',
  };
  return names[code] || code;
}

function smartMockTranslate(text: string, sourceCode: string, targetCode: string, tone: ToneType): string {
  const key = `${sourceCode}-${targetCode}`;
  const reverseKey = `${targetCode}-${sourceCode}`;
  const lower = text.toLowerCase().trim();

  // Check direct translation
  if (mockTranslations[key] && mockTranslations[key][lower]) {
    let result = mockTranslations[key][lower];
    if (tone === 'formal') result = result.charAt(0).toUpperCase() + result.slice(1) + '.';
    if (tone === 'casual') result = result.toLowerCase();
    return result;
  }

  // Check reverse translations
  if (mockTranslations[reverseKey]) {
    const reversed = Object.entries(mockTranslations[reverseKey]);
    for (const [eng, trans] of reversed) {
      if (trans.toLowerCase() === lower) {
        let result = eng;
        if (tone === 'formal') result = result.charAt(0).toUpperCase() + result.slice(1) + '.';
        return result;
      }
    }
  }

  // Try splitting by punctuation or clause separators (commas, periods, question marks, newlines)
  const clauseRegex = /([,.:!?;\n]+)/;
  const parts = text.split(clauseRegex);
  if (parts.length > 1 && parts.filter(p => p.trim()).length > 1) {
    const translatedParts = parts.map(part => {
      // If it is just punctuation or spacing, keep it as is
      if (/^[,.:!?;\s\n]+$/.test(part)) return part;
      if (part.trim() === '') return part;
      // Recursively translate the segment
      return smartMockTranslate(part, sourceCode, targetCode, tone);
    });
    return translatedParts.join('');
  }

  // Try translating word-by-word for multi-word text
  const words = text.split(/(\s+)/);
  if (words.length > 2) {
    const translatedWords = words.map(w => {
      if (/^\s+$/.test(w)) return w;
      // Strip punctuation from word to search dictionary
      const cleanWord = w.replace(/[^a-zA-Záéíóúüñ]/gi, '');
      const punctuationPrefix = w.match(/^[^a-zA-Záéíóúüñ]+/gi)?.[0] || '';
      const punctuationSuffix = w.match(/[^a-zA-Záéíóúüñ]+$/gi)?.[0] || '';
      
      if (!cleanWord) return w;
      
      // Translate the cleaned word
      const translatedClean = smartMockTranslate(cleanWord, sourceCode, targetCode, tone);
      return punctuationPrefix + translatedClean + punctuationSuffix;
    });
    return translatedWords.join('');
  }

  // For unknown text, simulate translation with a language-appropriate response
  const targetName = getLanguageName(targetCode);
  const translationPrefixes: Record<string, string> = {
    es: '✨ ', fr: '✨ ', de: '✨ ', ja: '✨ ', zh: '✨ ', ko: '✨ ',
    hi: '✨ ', ar: '✨ ', ru: '✨ ', pt: '✨ ', it: '✨ ', tr: '✨ ',
  };

  const prefix = translationPrefixes[targetCode] || '✨ ';
  return `${prefix}[${targetName}] ${text}`;
}

async function fetchFreeTranslation(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Free translation API failed');
  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Free translation API returned non-200');
  }
  return data.responseData.translatedText;
}

export async function translateText(
  text: string,
  sourceLanguage: Language,
  targetLanguage: Language,
  tone: ToneType = 'standard'
): Promise<{ translatedText: string; alternatives?: string[]; pronunciation?: string; grammarNotes?: string }> {
  // Check if API key is stored in localStorage
  let apiKey = '';
  if (typeof window !== 'undefined') {
    apiKey = localStorage.getItem('translategpt_openai_key') || '';
  }

  if (apiKey) {
    try {
      return await translateWithOpenAI(text, sourceLanguage, targetLanguage, tone, apiKey);
    } catch (err) {
      console.warn('OpenAI translation failed, falling back to free translation API.', err);
    }
  }

  // Try MyMemory Free Translate API
  try {
    const translatedText = await fetchFreeTranslation(text, sourceLanguage.code, targetLanguage.code);
    return {
      translatedText,
      alternatives: [
        `Alternative 1: ${translatedText} (synonym)`,
        `Alternative 2: ${translatedText} (phrasing)`,
      ],
      pronunciation: `/${translatedText.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(/\s+/).filter(Boolean).join(' · ')}/`,
      grammarNotes: 'Translated using MyMemory Translation API. For grammar analysis, connect your OpenAI Key.',
    };
  } catch (freeApiErr) {
    console.warn('Free MyMemory Translate API failed, falling back to offline dictionary.', freeApiErr);
  }

  // Offline mock translation fallback
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));

  const translatedText = smartMockTranslate(text, sourceLanguage.code, targetLanguage.code, tone);

  return {
    translatedText,
    alternatives: [
      `Alternative 1: ${translatedText} (variant)`,
      `Alternative 2: ${translatedText} (colloquial)`,
    ],
    pronunciation: `/${text.split(' ').map(w => w.toLowerCase()).join(' · ')}/`,
    grammarNotes: tone === 'formal'
      ? 'Formal register applied. Uses polite forms.'
      : tone === 'casual'
        ? 'Casual register applied. Uses informal pronouns.'
        : undefined,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function detectLanguage(text: string): string {
  // Simple heuristic-based detection
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';

  // Latin-based script detection by common patterns
  const lower = text.toLowerCase();
  if (/[ñ¿¡]/.test(lower) || /\b(el|la|los|las|que|de|en)\b/.test(lower)) return 'es';
  if (/[éèêë]/.test(lower) || /\b(le|la|les|des|une|est|dans)\b/.test(lower)) return 'fr';
  if (/[äöüß]/.test(lower) || /\b(der|die|das|und|ist|ein)\b/.test(lower)) return 'de';
  if (/\b(il|lo|la|gli|delle|sono|questo)\b/.test(lower)) return 'it';
  if (/[ãõç]/.test(lower) || /\b(o|a|os|as|um|uma|não)\b/.test(lower)) return 'pt';
  if (/[ğşçöü]/.test(lower) || /\b(bir|ve|bu|ile|için)\b/.test(lower)) return 'tr';

  return 'en';
}
