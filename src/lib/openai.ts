import { Language, ToneType } from '@/types/translation';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function queryOpenAI(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `OpenAI API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function translateWithOpenAI(
  text: string,
  sourceLang: Language,
  targetLang: Language,
  tone: ToneType,
  apiKey: string
): Promise<{
  translatedText: string;
  alternatives?: string[];
  pronunciation?: string;
  grammarNotes?: string;
}> {
  const systemPrompt = `You are a professional translator. Translate the text from ${sourceLang.name} to ${targetLang.name} using a ${tone} tone. 
Your output MUST be a JSON object containing the exact structure below, and nothing else (no markdown wrappers like \`\`\`json):
{
  "translation": "translated text here",
  "alternatives": ["alternative translation 1", "alternative translation 2"],
  "pronunciation": "/phonetic transcription here/",
  "grammarNotes": "optional explanations of grammar, cultural nuances, or tone choice (1-2 sentences)"
}`;

  try {
    const responseText = await queryOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      apiKey
    );

    // Clean markdown brackets if present
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      translatedText: parsed.translation || parsed.translatedText || '',
      alternatives: parsed.alternatives || [],
      pronunciation: parsed.pronunciation || '',
      grammarNotes: parsed.grammarNotes || undefined,
    };
  } catch (err) {
    console.error('OpenAI Translation failed, using local mock.', err);
    throw err;
  }
}

export async function askAIAssistant(
  message: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  apiKey: string
): Promise<string> {
  const systemPrompt = `You are a helpful language learning assistant. The user is using TranslateGPT to learn languages.
Answer questions about grammar, vocabulary, pronunciation, culture, or translation.
Keep answers structured, premium, engaging, and brief (max 3 short paragraphs). Use markdown to highlight words, grammar constructs, and phonetic spellings.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  return queryOpenAI(messages, apiKey);
}

// Generate vocabulary quiz questions
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string; // The correct option
  explanation: string;
}

export async function generateQuizQuestions(
  languageName: string,
  apiKey: string
): Promise<QuizQuestion[]> {
  const systemPrompt = `You are a language teacher. Generate 5 multiple-choice questions to test knowledge of vocabulary or translation from English to ${languageName}.
Ensure they range from beginner to intermediate.
Your response MUST be a JSON array containing exactly 5 questions matching this format, with no other text or formatting:
[
  {
    "question": "Translate: 'Good morning'",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation of the translation and culture"
  }
]`;

  try {
    const responseText = await queryOpenAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate 5 quiz questions for ${languageName}.` },
      ],
      apiKey
    );

    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error('OpenAI Quiz Generation failed', err);
    throw err;
  }
}
