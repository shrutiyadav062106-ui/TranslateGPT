'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Volume2, Mic, MicOff, RefreshCw, Copy, Check, Info
} from 'lucide-react';
import { askAIAssistant } from '@/lib/openai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const SUGGESTIONS = [
  { text: 'Explain French subjunctive verb endings', icon: '🇫🇷' },
  { text: 'Give me 5 essential Spanish idioms for travelers', icon: '🇪🇸' },
  { text: 'How do I pronounce "refrigerator" in Japanese?', icon: '🇯🇵' },
  { text: 'Correct my German grammar: "Ich habe ein Hund"', icon: '🇩🇪' },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Language Assistant. I can explain complex grammar, correct your sentences, suggest expressions, or help you practice pronunciation. Select a topic below or type your question!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check for OpenAI API key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('translategpt_openai_key');
      setHasApiKey(!!key);
    }
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const rec = new SpeechRecognitionCtor();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = (e: any) => {
          const text = e.results[0][0].transcript;
          setInput(prev => prev + (prev ? ' ' : '') + text);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Request mic permission explicitly to trigger browser dialog and catch permission errors
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // release mic immediately
        } catch (err: any) {
          console.error('Microphone access error:', err);
          alert('Microphone access denied or no microphone found. Please click the lock/microphone icon next to the URL in your browser address bar and set Microphone to "Allow".');
          return;
        }
      } else {
        alert('Microphone access is not supported by your browser in this context. Ensure you are using HTTPS or localhost.');
        return;
      }

      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for typing animation/stream simulation
  const typeMessage = (text: string, messageId: string) => {
    let currentText = '';
    const words = text.split(' ');
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, content: currentText } : m))
        );
        i++;
      } else {
        clearInterval(interval);
        setIsSending(false);
      }
    }, 45);
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const userMsgId = `${Date.now()}-user`;
    const botMsgId = `${Date.now()}-bot`;

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: trimmed, timestamp: Date.now() },
    ]);
    setInput('');
    setIsSending(true);

    // Add empty placeholder message for bot response
    setMessages(prev => [
      ...prev,
      { id: botMsgId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    const apiKey = localStorage.getItem('translategpt_openai_key') || '';
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      if (apiKey) {
        // Query real OpenAI API
        const answer = await askAIAssistant(trimmed, history, apiKey);
        typeMessage(answer, botMsgId);
      } else {
        // Run smart local mock responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        let mockReply = '';
        const lower = trimmed.toLowerCase();

        if (lower.includes('conjug') || lower.includes('verb') || lower.includes('ser')) {
          mockReply = `**Spanish Verb Conjugation**

Here is the present tense conjugation of **ser** (to be - permanent characteristics):
* **Yo soy** (I am)
* **Tú eres** (You are - informal)
* **Él/Ella/Usted es** (He/She/You are - formal)
* **Nosotros somos** (We are)
* **Ellos/Ellas/Ustedes son** (They/You all are)

*Usage tip*: Use **ser** for identity, profession, origin, and time. Use **estar** for temporary states and locations.`;
        } else if (lower.includes('idiom') || lower.includes('spani')) {
          mockReply = `Here are **5 Spanish Idioms** that will make you sound like a native:

1. **"Tomar el pelo"** (Literal: To take the hair) — Meaning: To pull someone's leg / joke around.
2. **"Echar de menos"** (Literal: To throw of less) — Meaning: To miss someone/something.
3. **"Ponerse las pilas"** (Literal: To put in the batteries) — Meaning: To wake up, focus, or get to work.
4. **"Ser pan comido"** (Literal: To be eaten bread) — Meaning: To be a piece of cake / extremely easy.
5. **"Costar un ojo de la cara"** (Literal: To cost an eye of the face) — Meaning: To cost an arm and a leg.`;
        } else if (lower.includes('pronounce') || lower.includes('refrigerator') || lower.includes('japan')) {
          mockReply = `In Japanese, the word for "refrigerator" is **冷蔵庫 (reizōko)**.

* **Hiragana**: れいぞうこ
* **Romaji**: re-i-zo-o-ko
* **Pronunciation key**:
  * **Rei**: Sounds like the English word "ray".
  * **zō**: Sounds like "zoh", but the "o" vowel is held double length (long vowel).
  * **ko**: Sounds like the first part of "coat".

Try reading it together: *ray-zoh-koh*. Ensure you slightly hold the middle "zō" sound!`;
        } else if (lower.includes('german') || lower.includes('hund') || lower.includes('correct')) {
          mockReply = `Great sentence! However, there is a minor grammatical correction. 

Correct sentence: **"Ich habe einen Hund."**

* **Why?**
  * In German, "haben" (to have) is a transitive verb that requires the **accusative case** for its object.
  * "Hund" (dog) is a **masculine noun** (*der Hund*).
  * Therefore, the indefinite article "ein" becomes **einen** in the masculine accusative case.
  * If the dog was female (like a cat, *die Katze*), it would remain "eine Katze".`;
        } else {
          mockReply = `That is an excellent language learning question! 

To get customized, detailed AI-powered answers, connect your **OpenAI API Key** in the **Settings** menu. 

Currently, I am operating in Offline/Demo mode. Feel free to ask about spanish verbs, idioms, Japanese pronunciation, or German grammar to see more demonstration content!`;
        }
        typeMessage(mockReply, botMsgId);
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === botMsgId
            ? { ...m, content: `Error: ${err?.message || 'Failed to contact AI. Please check your connection or API key.'}` }
            : m
        )
      );
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your AI Language Assistant. I can explain complex grammar, correct your sentences, suggest expressions, or help you practice pronunciation. Select a topic below or type your question!',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col justify-between max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">AI Language Assistant</h1>
            <p className="text-sm text-text-tertiary">Grammar explanations, corrections, and cultural queries</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border-border hover:text-red-500 hover:border-red-500/30"
          title="Clear Conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Chat
        </button>
      </div>

      {!hasApiKey && (
        <div className="relative mb-4 p-3.5 rounded-xl glass border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500/80 flex items-start gap-2.5">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Demo Mode Active</span>
            To get real-time custom explanations for any prompt, paste your OpenAI API key in the <span className="underline font-semibold cursor-pointer" onClick={() => window.location.href = '/settings'}>Settings page</span>. Try the suggestions below for a demonstration!
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="relative flex-1 min-h-[350px] glass-card p-4 md:p-6 mb-6 overflow-y-auto max-h-[500px] flex flex-col gap-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm relative group ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'glass border border-border text-text-primary rounded-tl-none'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                  {m.content || (
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-200" />
                      <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-300" />
                    </div>
                  )}
                </div>

                {m.content && (
                  <div className="absolute right-2 bottom-[-24px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-bg-primary/95 px-2 py-0.5 rounded-md border border-border text-[10px] text-text-tertiary shadow-sm z-10">
                    <button
                      onClick={() => handleSpeak(m.content)}
                      className="hover:text-text-primary"
                      title="Speak"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-text-primary"
                      title="Copy"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="relative mb-6">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2.5 px-1">Suggested Questions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUGGESTIONS.map((s, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSend(s.text)}
                className="flex items-center gap-2.5 text-left p-3.5 rounded-xl glass border border-border hover:border-primary/40 transition-colors"
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-medium text-text-secondary line-clamp-1">{s.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
        className="relative flex items-center gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Ask about grammar, idioms, corrections...'}
            disabled={isSending}
            className="w-full pl-4 pr-12 py-3.5 rounded-xl glass border border-border text-text-primary text-sm focus:border-primary/50 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3 p-2 rounded-lg transition-colors ${
              isListening ? 'text-red-500 bg-red-500/10' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-secondary'
            }`}
            title="Speech Input"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!input.trim() || isSending}
          className="btn-primary p-3.5 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
}
