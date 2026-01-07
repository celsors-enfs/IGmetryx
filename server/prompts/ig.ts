/**
 * Instagram Caption & Hashtag Generation Prompts
 * 
 * Builds system and user prompts for DeepSeek API
 */

type Language = 'en' | 'pt-BR' | 'es' | 'fr';
type Tone = 'friendly' | 'professional' | 'fun' | 'inspirational' | 'casual' | 'conversational' | 'humorous' | 'authoritative' | 'sarcastic' | 'emotional' | 'storytelling' | 'creative' | 'engaging';

interface PromptPayload {
  topic: string;
  language: Language;
  tone: Tone;
  length: 'short' | 'medium' | 'long';
  hashtagCount: number;
  type: 'captions' | 'hashtags' | 'both';
  context?: string;
  avoid?: string[];
  brandWords?: string[];
}

const LANGUAGE_NAMES: Record<Language, string> = {
  'en': 'English',
  'pt-BR': 'Portuguese (Brazil)',
  'es': 'Spanish',
  'fr': 'French',
};

/**
 * Build system prompt for DeepSeek
 */
export function buildSystemPrompt(language: Language, type: 'captions' | 'hashtags' | 'both'): string {
  const langName = LANGUAGE_NAMES[language];
  const typeInstruction = type === 'captions' 
    ? 'Generate ONLY captions (ignore hashtags).'
    : type === 'hashtags'
    ? 'Generate ONLY hashtags (ignore captions).'
    : 'Generate both captions and hashtags.';

  return `You are a professional Instagram copywriter. Write captions that:
- sound human and natural
- feel contextual and relevant
- match the user's topic exactly with concrete details
- never repeat generic filler phrases
- never exaggerate results or promises
- are coherent and meaningful
- respect the chosen language completely (${langName} ONLY)

Rules:
- Language: ${langName} ONLY - NEVER mix languages or use English when ${langName} is requested
- Do NOT explain what you are doing
- Do NOT mention algorithms, growth hacks, or "hacks"
- Do NOT claim to be official Instagram or Meta
- Do NOT include markdown formatting (no code fences, no markdown)
- Emojis are allowed but must feel natural and appropriate
- ${typeInstruction}

Output format (STRICT JSON only, no markdown, no code fences, no commentary):

{
  "captions": {
    "short": "...",
    "medium": "...",
    "long": "..."
  },
  "hashtags": {
    "broad": ["#tag1", "#tag2", ...],
    "niche": ["#tag1", "#tag2", ...],
    "discovery": ["#tag1", "#tag2", ...]
  }
}

Important:
- short/medium/long must differ significantly in length and structure (not duplicates)
- Hashtags should be relevant to the topic, non-spammy, and appropriate
- All text must be in ${langName} language
- Each hashtag must start with #, no spaces, no duplicates
- Return ONLY valid JSON, no explanation, no markdown`;
}

/**
 * Build user prompt for DeepSeek
 */
export function buildUserPrompt(payload: PromptPayload): string {
  let message = `Generate Instagram content for the following topic:\n\nTopic: ${payload.topic}\n`;
  
  if (payload.context) {
    message += `Context: ${payload.context}\n`;
  }
  
  message += `Tone: ${payload.tone}\n`;
  
  if (payload.type === 'captions' || payload.type === 'both') {
    message += `Caption length preference: ${payload.length} (but still return all 3: short, medium, long)\n`;
  }
  
  if (payload.type === 'hashtags' || payload.type === 'both') {
    message += `Hashtag count: ${payload.hashtagCount} total hashtags\n`;
    message += `Distribute hashtags as follows:\n`;
    message += `- 30% niche (specific to the topic)\n`;
    message += `- 40% mid (category/community related)\n`;
    message += `- 30% broad (popular/trending)\n`;
  }
  
  if (payload.avoid && payload.avoid.length > 0) {
    message += `\nAvoid these words/phrases: ${payload.avoid.join(', ')}\n`;
  }
  
  if (payload.brandWords && payload.brandWords.length > 0) {
    message += `Prefer using these brand words naturally: ${payload.brandWords.join(', ')}\n`;
  }
  
  message += `\nConstraints:
- Hashtags should be relevant to the topic and context
- Avoid spam hashtags like #followme, #like4like, #viral, or anything spammy
- Do not include banned or inappropriate words
- Return ONLY valid JSON, no markdown, no code fences, no explanation`;
  
  return message;
}


