/**
 * Content Generation Service
 * 
 * Two-step pipeline for high-quality caption and hashtag generation:
 * Step A: Extract meaning (structured content brief)
 * Step B: Generate outputs with constraints
 */

import { generateCaptionsAndHashtags } from './captionGenerator';

export type Language = 'en' | 'es' | 'pt-br' | 'fr';
export type Tone = 
  | 'casual' 
  | 'professional' 
  | 'conversational' 
  | 'friendly' 
  | 'humorous' 
  | 'authoritative' 
  | 'sarcastic' 
  | 'emotional' 
  | 'storytelling' 
  | 'creative' 
  | 'engaging' 
  | 'inspirational';

export type PostLength = 'short' | 'medium' | 'long';

/**
 * Content Brief - Structured extraction of meaning from user input
 */
export interface ContentBrief {
  language: Language;
  topicSummary: string; // 1-2 lines
  keyEntities: {
    places?: string[];
    brands?: string[];
    peopleTypes?: string[];
    events?: string[];
  };
  audience: string; // Who it's for
  intent: 'educate' | 'entertain' | 'sell' | 'inspire' | 'announce' | 'share';
  keywords: string[]; // 10-20 relevant keywords
  negativeKeywords: string[]; // Things to avoid
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Caption Generation Result
 */
export interface CaptionResult {
  language: Language;
  caption: string;
  hashtags: string[]; // Appended if count > 0
  fullText: string; // Caption + hashtags (for copy)
}

/**
 * Hashtag Generation Result
 */
export interface HashtagResult {
  language: Language;
  hashtags: string[];
  hashtagText: string; // Space-separated for copy
}

/**
 * Step A: Extract meaning from user input
 */
export const extractContentBrief = (inputText: string, language: Language): ContentBrief => {
  const text = inputText.toLowerCase().trim();
  
  // Language-specific stop words
  const stopWords: Record<Language, string[]> = {
    'en': ['the', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'your', 'what', 'when', 'where', 'which', 'about', 'into', 'over', 'after', 'under', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'a', 'an', 'my', 'me', 'i', 'we', 'you', 'they', 'photo', 'picture', 'image', 'pic'],
    'es': ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'con', 'por', 'para', 'este', 'esta', 'estos', 'estas', 'y', 'o', 'pero', 'es', 'son', 'era', 'eran', 'mi', 'me', 'yo', 'nosotros', 'tú', 'ellos', 'foto', 'imagen', 'fotografía'],
    'pt-br': ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'que', 'com', 'por', 'para', 'este', 'esta', 'estes', 'estas', 'e', 'ou', 'mas', 'é', 'são', 'era', 'eram', 'minha', 'meu', 'me', 'eu', 'nós', 'você', 'eles', 'minhas', 'meus', 'foto', 'imagem', 'fotografia'],
    'fr': ['le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'que', 'avec', 'par', 'pour', 'ce', 'cette', 'ces', 'et', 'ou', 'mais', 'est', 'sont', 'était', 'étaient', 'mon', 'ma', 'mes', 'me', 'je', 'nous', 'tu', 'ils', 'photo', 'image', 'photographie'],
  };

  // Extract keywords
  const words = text
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !stopWords[language].includes(w));

  const keywords = words.slice(0, 20);

  // Detect places
  const locationPatterns: Record<Language, RegExp[]> = {
    'en': [/rio|paris|london|new york|tokyo|barcelona|amsterdam|berlin|miami|los angeles|san francisco|sydney|melbourne|dubai|singapore|corcovado|christ the redeemer|sugarloaf/i],
    'es': [/madrid|barcelona|buenos aires|méxico|ciudad de méxico|valencia|sevilla|bogotá|lima|santiago|montevideo|corcovado/i],
    'pt-br': [/rio|são paulo|brasília|salvador|curitiba|porto alegre|recife|belo horizonte|fortaleza|manaus|pão de açúcar|corcovado|cristo redentor|ipanema|copacabana|sugarloaf/i],
    'fr': [/paris|lyon|marseille|toulouse|nice|nantes|strasbourg|montpellier|bordeaux|canada|québec|montréal/i],
  };

  const places: string[] = [];
  for (const pattern of locationPatterns[language]) {
    const matches = inputText.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      places.push(...matches.map(m => m.trim()));
    }
  }

  // Detect sentiment
  const positiveWords: Record<Language, string[]> = {
    'en': ['love', 'amazing', 'beautiful', 'great', 'wonderful', 'excited', 'happy', 'perfect', 'fantastic', 'awesome', 'gorgeous', 'stunning', 'incredible'],
    'es': ['amor', 'increíble', 'hermoso', 'genial', 'maravilloso', 'emocionado', 'feliz', 'perfecto', 'fantástico', 'impresionante', 'precioso'],
    'pt-br': ['amor', 'incrível', 'lindo', 'ótimo', 'maravilhoso', 'empolgado', 'feliz', 'perfeito', 'fantástico', 'demais', 'linda', 'bonita', 'bonito'],
    'fr': ['amour', 'incroyable', 'beau', 'super', 'merveilleux', 'excité', 'heureux', 'parfait', 'fantastique', 'génial', 'magnifique', 'époustouflant'],
  };

  const negativeWords: Record<Language, string[]> = {
    'en': ['sad', 'disappointed', 'frustrated', 'difficult', 'hard', 'struggling', 'challenging', 'bad', 'worst'],
    'es': ['triste', 'decepcionado', 'frustrado', 'difícil', 'duro', 'luchando', 'desafiante', 'malo', 'peor'],
    'pt-br': ['triste', 'decepcionado', 'frustrado', 'difícil', 'duro', 'lutando', 'desafiador', 'ruim', 'pior'],
    'fr': ['triste', 'déçu', 'frustré', 'difficile', 'dur', 'lutte', 'défiant', 'mauvais', 'pire'],
  };

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveWords[language].some(word => text.includes(word))) {
    sentiment = 'positive';
  } else if (negativeWords[language].some(word => text.includes(word))) {
    sentiment = 'negative';
  }

  // Infer intent
  const intentKeywords: Record<Language, Record<string, 'educate' | 'entertain' | 'sell' | 'inspire' | 'announce' | 'share'>> = {
    'en': {
      'learn': 'educate', 'teach': 'educate', 'how to': 'educate', 'tutorial': 'educate',
      'funny': 'entertain', 'joke': 'entertain', 'comedy': 'entertain', 'laugh': 'entertain',
      'buy': 'sell', 'sale': 'sell', 'discount': 'sell', 'shop': 'sell', 'product': 'sell',
      'motivation': 'inspire', 'inspire': 'inspire', 'motivational': 'inspire', 'growth': 'inspire',
      'announce': 'announce', 'news': 'announce', 'update': 'announce', 'launch': 'announce',
    },
    'pt-br': {
      'aprender': 'educate', 'ensinar': 'educate', 'como fazer': 'educate', 'tutorial': 'educate',
      'engraçado': 'entertain', 'piada': 'entertain', 'comédia': 'entertain', 'rir': 'entertain',
      'comprar': 'sell', 'venda': 'sell', 'desconto': 'sell', 'loja': 'sell', 'produto': 'sell',
      'motivação': 'inspire', 'inspirar': 'inspire', 'motivacional': 'inspire', 'crescimento': 'inspire',
      'anúncio': 'announce', 'notícia': 'announce', 'atualização': 'announce', 'lançamento': 'announce',
    },
    'es': {
      'aprender': 'educate', 'enseñar': 'educate', 'cómo hacer': 'educate', 'tutorial': 'educate',
      'divertido': 'entertain', 'chiste': 'entertain', 'comedia': 'entertain', 'reír': 'entertain',
      'comprar': 'sell', 'venta': 'sell', 'descuento': 'sell', 'tienda': 'sell', 'producto': 'sell',
      'motivación': 'inspire', 'inspirar': 'inspire', 'motivacional': 'inspire', 'crecimiento': 'inspire',
      'anuncio': 'announce', 'noticia': 'announce', 'actualización': 'announce', 'lanzamiento': 'announce',
    },
    'fr': {
      'apprendre': 'educate', 'enseigner': 'educate', 'comment faire': 'educate', 'tutoriel': 'educate',
      'drôle': 'entertain', 'blague': 'entertain', 'comédie': 'entertain', 'rire': 'entertain',
      'acheter': 'sell', 'vente': 'sell', 'réduction': 'sell', 'magasin': 'sell', 'produit': 'sell',
      'motivation': 'inspire', 'inspirer': 'inspire', 'motivationnel': 'inspire', 'croissance': 'inspire',
      'annonce': 'announce', 'nouvelle': 'announce', 'mise à jour': 'announce', 'lancement': 'announce',
    },
  };

  let intent: 'educate' | 'entertain' | 'sell' | 'inspire' | 'announce' | 'share' = 'share';
  const intentMap = intentKeywords[language];
  for (const [key, value] of Object.entries(intentMap)) {
    if (text.includes(key)) {
      intent = value;
      break;
    }
  }

  // Infer audience
  const audienceKeywords: Record<Language, Record<string, string>> = {
    'en': {
      'business': 'business professionals', 'entrepreneur': 'entrepreneurs', 'startup': 'startup founders',
      'fitness': 'fitness enthusiasts', 'gym': 'fitness enthusiasts', 'workout': 'fitness enthusiasts',
      'travel': 'travelers', 'trip': 'travelers', 'vacation': 'travelers',
      'food': 'food lovers', 'restaurant': 'food lovers', 'cooking': 'food lovers',
      'fashion': 'fashion enthusiasts', 'style': 'fashion enthusiasts', 'outfit': 'fashion enthusiasts',
    },
    'pt-br': {
      'negócio': 'profissionais de negócios', 'empreendedor': 'empreendedores', 'startup': 'fundadores de startups',
      'fitness': 'entusiastas de fitness', 'academia': 'entusiastas de fitness', 'treino': 'entusiastas de fitness',
      'viagem': 'viajantes', 'férias': 'viajantes',
      'comida': 'amantes de comida', 'restaurante': 'amantes de comida', 'culinária': 'amantes de comida',
      'moda': 'entusiastas de moda', 'estilo': 'entusiastas de moda', 'look': 'entusiastas de moda',
    },
    'es': {
      'negocio': 'profesionales de negocios', 'emprendedor': 'emprendedores', 'startup': 'fundadores de startups',
      'fitness': 'entusiastas del fitness', 'gimnasio': 'entusiastas del fitness', 'entrenamiento': 'entusiastas del fitness',
      'viaje': 'viajeros', 'vacaciones': 'viajeros',
      'comida': 'amantes de la comida', 'restaurante': 'amantes de la comida', 'cocina': 'amantes de la comida',
      'moda': 'entusiastas de la moda', 'estilo': 'entusiastas de la moda', 'look': 'entusiastas de la moda',
    },
    'fr': {
      'affaires': 'professionnels des affaires', 'entrepreneur': 'entrepreneurs', 'startup': 'fondateurs de startups',
      'fitness': 'passionnés de fitness', 'gym': 'passionnés de fitness', 'entraînement': 'passionnés de fitness',
      'voyage': 'voyageurs', 'vacances': 'voyageurs',
      'nourriture': 'amateurs de nourriture', 'restaurant': 'amateurs de nourriture', 'cuisine': 'amateurs de nourriture',
      'mode': 'passionnés de mode', 'style': 'passionnés de mode', 'look': 'passionnés de mode',
    },
  };

  let audience = 'general audience';
  const audienceMap = audienceKeywords[language];
  for (const [key, value] of Object.entries(audienceMap)) {
    if (text.includes(key)) {
      audience = value;
      break;
    }
  }

  // Generate topic summary
  const topicSummary = generateTopicSummary(keywords, places, language);

  // Negative keywords (generic words to avoid)
  const negativeKeywords: string[] = [];
  const genericWords: Record<Language, string[]> = {
    'en': ['photo', 'picture', 'image', 'pic', 'my', 'mine', 'this', 'that', 'thing', 'stuff'],
    'es': ['foto', 'imagen', 'fotografía', 'mi', 'mía', 'este', 'esta', 'cosa', 'cosas'],
    'pt-br': ['foto', 'imagem', 'fotografia', 'minha', 'meu', 'minhas', 'meus', 'este', 'esta', 'coisa', 'coisas'],
    'fr': ['photo', 'image', 'photographie', 'mon', 'ma', 'mes', 'ce', 'cette', 'chose', 'choses'],
  };
  
  words.forEach(w => {
    if (genericWords[language].includes(w)) {
      negativeKeywords.push(w);
    }
  });

  return {
    language,
    topicSummary,
    keyEntities: {
      places: places.length > 0 ? places : undefined,
    },
    audience,
    intent,
    keywords: keywords.slice(0, 20),
    negativeKeywords: [...new Set(negativeKeywords)],
    sentiment,
  };
};

/**
 * Generate topic summary
 */
const generateTopicSummary = (keywords: string[], places: string[], language: Language): string => {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  
  if (places.length > 0 && keywords.length > 0) {
    const place = places[0];
    const keyword = capitalize(keywords[0]);
    const summaries: Record<Language, string> = {
      'en': `${keyword} in ${place}`,
      'es': `${keyword} en ${place}`,
      'pt-br': `${keyword} em ${place}`,
      'fr': `${keyword} à ${place}`,
    };
    return summaries[language];
  }
  
  if (places.length > 0) {
    const place = places[0];
    const summaries: Record<Language, string> = {
      'en': `Content about ${place}`,
      'es': `Contenido sobre ${place}`,
      'pt-br': `Conteúdo sobre ${place}`,
      'fr': `Contenu sur ${place}`,
    };
    return summaries[language];
  }
  
  if (keywords.length > 0) {
    const keyword1 = capitalize(keywords[0]);
    const keyword2 = keywords[1] ? capitalize(keywords[1]) : '';
    const summaries: Record<Language, string> = {
      'en': keyword2 ? `${keyword1} and ${keyword2}` : keyword1,
      'es': keyword2 ? `${keyword1} y ${keyword2}` : keyword1,
      'pt-br': keyword2 ? `${keyword1} e ${keyword2}` : keyword1,
      'fr': keyword2 ? `${keyword1} et ${keyword2}` : keyword1,
    };
    return summaries[language];
  }
  
  const summaries: Record<Language, string> = {
    'en': 'General content',
    'es': 'Contenido general',
    'pt-br': 'Conteúdo geral',
    'fr': 'Contenu général',
  };
  return summaries[language];
};

/**
 * Step B: Generate caption with constraints
 */
export const generateCaption = (
  brief: ContentBrief,
  tone: Tone,
  length: PostLength,
  hashtagsCount: number
): CaptionResult => {
  // Character limits by length
  const lengthLimits: Record<PostLength, { min: number; max: number }> = {
    'short': { min: 80, max: 160 },
    'medium': { min: 180, max: 450 },
    'long': { min: 500, max: 1200 },
  };

  const limits = lengthLimits[length];
  
  // Generate caption based on brief, tone, and length
  const caption = generateCaptionText(brief, tone, length, limits);
  
  // Generate hashtags if count > 0
  const hashtags = hashtagsCount > 0 
    ? generateHashtagsForCaption(brief, hashtagsCount)
    : [];

  // Full text: caption + hashtags (with line break if hashtags exist)
  const fullText = hashtags.length > 0
    ? `${caption}\n\n${hashtags.join(' ')}`
    : caption;

  return {
    language: brief.language,
    caption,
    hashtags,
    fullText,
  };
};

/**
 * Generate caption text
 */
const generateCaptionText = (
  brief: ContentBrief,
  tone: Tone,
  length: PostLength,
  limits: { min: number; max: number }
): string => {
  // This will use the existing captionGenerator logic but with better constraints
  // For now, delegate to the existing generator but with improved parameters
  
  // Map new tones to old tones for compatibility
  const toneMap: Record<Tone, 'friendly' | 'professional' | 'funny' | 'inspirational'> = {
    'casual': 'friendly',
    'professional': 'professional',
    'conversational': 'friendly',
    'friendly': 'friendly',
    'humorous': 'funny',
    'authoritative': 'professional',
    'sarcastic': 'funny',
    'emotional': 'inspirational',
    'storytelling': 'inspirational',
    'creative': 'inspirational',
    'engaging': 'friendly',
    'inspirational': 'inspirational',
  };

  const oldTone = toneMap[tone];
  const inputText = brief.topicSummary || brief.keywords.join(' ');
  
  const result = generateCaptionsAndHashtags(
    inputText,
    oldTone,
    brief.language
  );

  // Select caption based on length
  let selectedCaption = result.captions.medium;
  if (length === 'short') {
    selectedCaption = result.captions.short;
  } else if (length === 'long') {
    selectedCaption = result.captions.long;
  }

  // Ensure length constraints
  if (selectedCaption.length < limits.min) {
    // Expand if too short
    selectedCaption = expandCaption(selectedCaption, brief, tone, limits.min);
  } else if (selectedCaption.length > limits.max) {
    // Truncate if too long (but preserve sentence boundaries)
    selectedCaption = truncateCaption(selectedCaption, limits.max);
  }

  // Language lock: validate and regenerate if needed
  const validated = validateLanguageLock(selectedCaption, brief.language);
  
  return validated;
};

/**
 * Expand caption if too short
 */
const expandCaption = (
  caption: string,
  brief: ContentBrief,
  tone: Tone,
  minLength: number
): string => {
  // Add context from brief
  if (brief.keyEntities.places && brief.keyEntities.places.length > 0) {
    const place = brief.keyEntities.places[0];
    const additions: Record<Language, string[]> = {
      'en': [` The experience in ${place} was unforgettable.`, ` ${place} never disappoints.`, ` Every moment in ${place} is special.`],
      'es': [` La experiencia en ${place} fue inolvidable.`, ` ${place} nunca decepciona.`, ` Cada momento en ${place} es especial.`],
      'pt-br': [` A experiência em ${place} foi inesquecível.`, ` ${place} nunca decepciona.`, ` Cada momento em ${place} é especial.`],
      'fr': [` L'expérience à ${place} était inoubliable.`, ` ${place} ne déçoit jamais.`, ` Chaque moment à ${place} est spécial.`],
    };
    const options = additions[brief.language];
    caption += options[Math.floor(Math.random() * options.length)];
  }
  
  if (caption.length < minLength && brief.keywords.length > 0) {
    const keyword = brief.keywords[0];
    const additions: Record<Language, string[]> = {
      'en': [` Exploring ${keyword} opened new perspectives.`, ` ${keyword} always surprises me.`],
      'es': [` Explorar ${keyword} abrió nuevas perspectivas.`, ` ${keyword} siempre me sorprende.`],
      'pt-br': [` Explorar ${keyword} abriu novas perspectivas.`, ` ${keyword} sempre me surpreende.`],
      'fr': [` Explorer ${keyword} a ouvert de nouvelles perspectives.`, ` ${keyword} me surprend toujours.`],
    };
    const options = additions[brief.language];
    caption += options[Math.floor(Math.random() * options.length)];
  }
  
  return caption;
};

/**
 * Truncate caption preserving sentence boundaries
 */
const truncateCaption = (caption: string, maxLength: number): string => {
  if (caption.length <= maxLength) return caption;
  
  // Find last sentence boundary before maxLength
  const truncated = caption.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // If no good sentence boundary, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

/**
 * Generate hashtags for caption
 */
const generateHashtagsForCaption = (
  brief: ContentBrief,
  count: number
): string[] => {
  const inputText = brief.topicSummary || brief.keywords.join(' ');
  const result = generateCaptionsAndHashtags(
    inputText,
    'friendly', // Default tone for hashtag generation
    brief.language
  );

  // Combine all hashtag groups
  const allHashtags = [
    ...result.hashtags.niche,
    ...result.hashtags.reach,
    ...result.hashtags.discovery,
  ];

  // Remove duplicates and filter out negative keywords
  const filtered = allHashtags
    .filter(tag => {
      const cleanTag = tag.replace('#', '').toLowerCase();
      return !brief.negativeKeywords.some(neg => cleanTag.includes(neg));
    })
    .filter((tag, index, self) => self.indexOf(tag) === index)
    .slice(0, count);

  return filtered;
};

/**
 * Generate standalone hashtags
 */
export const generateHashtags = (
  brief: ContentBrief,
  count: number
): HashtagResult => {
  const hashtags = generateHashtagsForCaption(brief, count);
  
  return {
    language: brief.language,
    hashtags,
    hashtagText: hashtags.join(' '),
  };
};

/**
 * Language lock: validate output is in correct language
 */
const validateLanguageLock = (text: string, language: Language): string => {
  if (language === 'en') return text; // No validation needed for English
  
  // Common English stopwords that shouldn't appear in non-English text
  const englishStopwords = ['the', 'and', 'you', 'your', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'are', 'was', 'were'];
  
  const textLower = text.toLowerCase();
  const englishWordCount = englishStopwords.filter(word => {
    // Match whole words only
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(textLower);
  }).length;
  
  // If too many English words detected, try to fix
  if (englishWordCount > 3 && text.length > 50) {
    if (import.meta.env.DEV) {
      console.warn(`[Language Lock] Detected ${englishWordCount} English words in ${language} output. Attempting fix...`);
    }
    
    // Simple fix: replace common English phrases with language equivalents
    const replacements: Record<Language, Record<string, string>> = {
      'en': {},
      'pt-br': {
        ' the ': ' o ',
        ' and ': ' e ',
        ' you ': ' você ',
        ' your ': ' seu ',
        ' this ': ' isso ',
        ' that ': ' aquilo ',
        ' with ': ' com ',
        ' from ': ' de ',
        ' have ': ' ter ',
        ' will ': ' vai ',
        ' are ': ' são ',
        ' was ': ' era ',
        ' were ': ' eram ',
      },
      'es': {
        ' the ': ' el ',
        ' and ': ' y ',
        ' you ': ' tú ',
        ' your ': ' tu ',
        ' this ': ' esto ',
        ' that ': ' eso ',
        ' with ': ' con ',
        ' from ': ' de ',
        ' have ': ' tener ',
        ' will ': ' va ',
        ' are ': ' son ',
        ' was ': ' era ',
        ' were ': ' eran ',
      },
      'fr': {
        ' the ': ' le ',
        ' and ': ' et ',
        ' you ': ' tu ',
        ' your ': ' ton ',
        ' this ': ' ce ',
        ' that ': ' cela ',
        ' with ': ' avec ',
        ' from ': ' de ',
        ' have ': ' avoir ',
        ' will ': ' va ',
        ' are ': ' sont ',
        ' was ': ' était ',
        ' were ': ' étaient ',
      },
    };
    
    let fixed = text;
    const langReplacements = replacements[language];
    if (langReplacements) {
      for (const [en, translated] of Object.entries(langReplacements)) {
        fixed = fixed.replace(new RegExp(en, 'gi'), translated);
      }
    }
    
    return fixed;
  }
  
  return text;
};

