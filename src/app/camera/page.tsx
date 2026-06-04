'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Loader2, Copy, Check, Volume2,
  Sparkles, Image as ImageIcon, X, RotateCcw
} from 'lucide-react';
import { useUserStore } from '@/stores/user-store';
import { useHistoryStore } from '@/stores/history-store';
import { getLanguageByCode } from '@/lib/languages';
import { translateText, generateId } from '@/lib/translation';

export default function CameraPage() {
  const { targetLanguage } = useUserStore();
  const addTranslation = useHistoryStore(s => s.addTranslation);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch {
      alert('Camera access denied or not available.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImageSrc(dataUrl);
      stopCamera();
      processImage(dataUrl);
    }
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageSrc(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (src: string) => {
    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');
    setTranslatedText('');

    try {
      // Dynamic import of Tesseract.js
      const Tesseract = await import('tesseract.js');

      const result = await Tesseract.recognize(src, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text.trim();
      setExtractedText(text || 'No text detected in image.');

      if (text) {
        setIsTranslating(true);
        const sourceLang = getLanguageByCode('en');
        const targetLang = getLanguageByCode(targetLanguage);
        const translation = await translateText(text, sourceLang, targetLang, 'standard');
        setTranslatedText(translation.translatedText);

        addTranslation({
          id: generateId(),
          sourceText: text,
          translatedText: translation.translatedText,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          tone: 'standard',
          timestamp: Date.now(),
          isFavorite: false,
          type: 'camera',
        });
        setIsTranslating(false);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setExtractedText('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setImageSrc(null);
    setExtractedText('');
    setTranslatedText('');
    setProgress(0);
    stopCamera();
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

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-pink-500/5 blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Camera Translation</h1>
            <p className="text-sm text-text-tertiary">Scan and translate text from images</p>
          </div>
        </motion.div>

        {/* Camera / Upload Area */}
        {!imageSrc && !cameraActive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startCamera}
                className="glass-card p-8 flex flex-col items-center gap-4 group cursor-pointer" id="camera-capture-button">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center group-hover:shadow-xl transition-shadow">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-text-primary mb-1">Take Photo</h3>
                  <p className="text-xs text-text-tertiary">Use your camera to scan text</p>
                </div>
              </motion.button>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => fileInputRef.current?.click()}
                className="glass-card p-8 flex flex-col items-center gap-4 group cursor-pointer" id="upload-image-button">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center group-hover:shadow-xl transition-shadow">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-text-primary mb-1">Upload Image</h3>
                  <p className="text-xs text-text-tertiary">Select from your gallery</p>
                </div>
              </motion.button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">What you can scan</h3>
              <div className="grid grid-cols-2 gap-2">
                {['📋 Documents', '🪧 Street Signs', '📖 Books', '🍽️ Menus', '🏷️ Labels', '📄 Receipts'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Camera View */}
        <AnimatePresence>
          {cameraActive && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-8">
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
                <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <button onClick={stopCamera} className="p-3 rounded-full glass text-text-primary hover:bg-red-500/20">
                    <X className="w-5 h-5" />
                  </button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-primary shadow-lg" id="camera-shutter">
                    <div className="w-full h-full rounded-full bg-primary/20" />
                  </motion.button>
                  <div className="w-12" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Captured Image */}
        {imageSrc && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={imageSrc} alt="Captured" className="w-full rounded-2xl" />
              <button onClick={reset} className="absolute top-3 right-3 p-2 rounded-full glass">
                <RotateCcw className="w-4 h-4 text-text-primary" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Processing Progress */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-text-primary">Extracting text...</span>
                <span className="text-sm text-text-tertiary ml-auto">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <motion.div className="h-full rounded-full gradient-primary" style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extracted Text */}
        <AnimatePresence>
          {extractedText && !isProcessing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-text-primary">Extracted Text</span>
                </div>
                <p className="text-text-primary text-sm leading-relaxed">{extractedText}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => handleCopy(extractedText)} className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary">
                    {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleSpeak(extractedText, 'en')} className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isTranslating ? (
                <div className="glass-card p-5 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-text-tertiary">Translating...</span>
                </div>
              ) : translatedText ? (
                <div className="glass-card p-5 gradient-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">Translation ({getLanguageByCode(targetLanguage).name})</span>
                  </div>
                  <p className="text-text-primary text-sm leading-relaxed">{translatedText}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => handleCopy(translatedText)} className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleSpeak(translatedText, targetLanguage)} className="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-tertiary">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
