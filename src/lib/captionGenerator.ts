/**
 * Caption & Hashtag Generator
 * 
 * Generates high-quality, language-aware captions and hashtags based on user input.
 * Uses keyword-based approach with intelligent context extraction and dynamic text generation.
 */

export type Language = 'en' | 'es' | 'pt-br' | 'fr';
export type Tone = 'friendly' | 'professional' | 'funny' | 'inspirational';

export interface GeneratedContent {
  language: Language;
  tone: Tone;
  topicSummary: string;
  captions: {
    short: string;
    medium: string;
    long: string;
  };
  hashtags: {
    reach: string[];
    niche: string[];
    discovery: string[];
  };
}

/**
 * Main generation function - generates captions and hashtags in the specified language
 */
export const generateCaptionsAndHashtags = (
  topic: string,
  tone: Tone,
  language: Language
): GeneratedContent => {
  if (!topic.trim()) {
    throw new Error('Topic is required');
  }

  const context = extractContext(topic, language);
  const topicSummary = generateTopicSummary(context, language);
  
  const captions = {
    short: generateShortCaption(context, topic, tone, language),
    medium: generateMediumCaption(context, topic, tone, language),
    long: generateLongCaption(context, topic, tone, language),
  };

  const hashtags = {
    reach: generateReachHashtags(context, language),
    niche: generateNicheHashtags(context, language),
    discovery: generateDiscoveryHashtags(context, language),
  };

  const result: GeneratedContent = {
    language,
    tone,
    topicSummary,
    captions,
    hashtags,
  };

  // Validate and post-process
  return validateAndPostProcess(result);
};

/**
 * Extract context from user input - improved to capture meaningful keywords
 */
interface ExtractedContext {
  keywords: string[]; // Substantivos e adjetivos relevantes
  location?: string;
  activity?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  niche?: string;
  hasLocation: boolean;
  hasActivity: boolean;
  mainSubject?: string; // O assunto principal mencionado
  descriptiveWords: string[]; // Adjetivos e palavras descritivas
  allKeywords: string[]; // Todas as palavras-chave (incluindo descritivas)
}

const extractContext = (topic: string, language: Language): ExtractedContext => {
  const text = topic.toLowerCase().trim();
  
  // Language-specific stop words (mais completas)
  const stopWords: Record<Language, string[]> = {
    'en': ['the', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'your', 'what', 'when', 'where', 'which', 'about', 'into', 'over', 'after', 'under', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'a', 'an', 'my', 'me', 'i', 'we', 'you', 'they'],
    'es': ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'con', 'por', 'para', 'este', 'esta', 'estos', 'estas', 'y', 'o', 'pero', 'es', 'son', 'era', 'eran', 'mi', 'me', 'yo', 'nosotros', 'tú', 'ellos'],
    'pt-br': ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'que', 'com', 'por', 'para', 'este', 'esta', 'estes', 'estas', 'e', 'ou', 'mas', 'é', 'são', 'era', 'eram', 'minha', 'meu', 'me', 'eu', 'nós', 'você', 'eles', 'minhas', 'meus'],
    'fr': ['le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'que', 'avec', 'par', 'pour', 'ce', 'cette', 'ces', 'et', 'ou', 'mais', 'est', 'sont', 'était', 'étaient', 'mon', 'ma', 'mes', 'me', 'je', 'nous', 'tu', 'ils'],
  };

  // Extrair palavras, mantendo acentos
  const words = text
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !stopWords[language].includes(w));

  // Filtrar palavras genéricas que não devem virar hashtags
  const genericWords: Record<Language, string[]> = {
    'en': ['photo', 'picture', 'image', 'pic', 'my', 'mine', 'this', 'that'],
    'es': ['foto', 'imagen', 'fotografía', 'mi', 'mía', 'este', 'esta'],
    'pt-br': ['foto', 'imagem', 'fotografia', 'minha', 'meu', 'minhas', 'meus', 'este', 'esta'],
    'fr': ['photo', 'image', 'photographie', 'mon', 'ma', 'mes', 'ce', 'cette'],
  };

  // Palavras-chave relevantes (substituir palavras genéricas por termos mais específicos)
  const relevantKeywords = words
    .filter(w => !genericWords[language].includes(w))
    .map(w => {
      // Substituir variações genéricas
      if (language === 'pt-br') {
        if (w === 'bonita' || w === 'bonito') return 'linda';
      }
      return w;
    })
    .filter((w): w is string => w !== null && w.length > 2)
    .slice(0, 8);

  // Detectar local
  const locationPatterns: Record<Language, RegExp[]> = {
    'en': [/rio|paris|london|new york|tokyo|barcelona|amsterdam|berlin|miami|los angeles|san francisco|sydney|melbourne|dubai|singapore|corcovado|christ the redeemer/i],
    'es': [/madrid|barcelona|buenos aires|méxico|ciudad de méxico|valencia|sevilla|bogotá|lima|santiago|montevideo|corcovado/i],
    'pt-br': [/rio|são paulo|brasília|salvador|curitiba|porto alegre|recife|belo horizonte|fortaleza|manaus|pão de açúcar|corcovado|cristo redentor|ipanema|copacabana|sugarloaf/i],
    'fr': [/paris|lyon|marseille|toulouse|nice|nantes|strasbourg|montpellier|bordeaux|canada|québec|montréal/i],
  };

  let location: string | undefined;
  for (const pattern of locationPatterns[language]) {
    const match = topic.match(pattern);
    if (match) {
      location = match[0];
      break;
    }
  }

  // Detectar atividade/assunto principal
  const activityKeywords: Record<Language, Record<string, string>> = {
    'en': {
      'travel': 'travel', 'trip': 'travel', 'journey': 'travel',
      'food': 'food', 'restaurant': 'food', 'cooking': 'food', 'meal': 'food',
      'fitness': 'fitness', 'workout': 'fitness', 'gym': 'fitness', 'exercise': 'fitness',
      'fashion': 'fashion', 'style': 'fashion', 'outfit': 'fashion',
      'nature': 'nature', 'outdoor': 'nature', 'hiking': 'nature',
      'art': 'art', 'design': 'art', 'creative': 'art',
    },
    'pt-br': {
      'viagem': 'viagem', 'jornada': 'viagem',
      'comida': 'comida', 'restaurante': 'comida', 'culinária': 'comida', 'refeição': 'comida',
      'fitness': 'fitness', 'treino': 'fitness', 'academia': 'fitness', 'exercício': 'fitness',
      'moda': 'moda', 'estilo': 'moda', 'look': 'moda',
      'natureza': 'natureza', 'ar livre': 'natureza', 'trilha': 'natureza',
      'arte': 'arte', 'design': 'arte', 'criativo': 'arte',
    },
    'es': {
      'viaje': 'viaje', 'jornada': 'viaje',
      'comida': 'comida', 'restaurante': 'comida', 'cocina': 'comida',
      'fitness': 'fitness', 'entrenamiento': 'fitness', 'gimnasio': 'fitness', 'ejercicio': 'fitness',
      'moda': 'moda', 'estilo': 'moda', 'look': 'moda',
      'naturaleza': 'naturaleza', 'aire libre': 'naturaleza', 'senderismo': 'naturaleza',
      'arte': 'arte', 'diseño': 'arte', 'creativo': 'arte',
    },
    'fr': {
      'voyage': 'voyage', 'journée': 'voyage',
      'nourriture': 'nourriture', 'restaurant': 'nourriture', 'cuisine': 'nourriture', 'repas': 'nourriture',
      'fitness': 'fitness', 'entraînement': 'fitness', 'gym': 'fitness', 'exercice': 'fitness',
      'mode': 'mode', 'style': 'mode', 'look': 'mode',
      'nature': 'nature', 'plein air': 'nature', 'randonnée': 'nature',
      'art': 'art', 'design': 'art', 'créatif': 'art',
    },
  };

  let activity: string | undefined;
  const activityMap = activityKeywords[language];
  for (const [key, value] of Object.entries(activityMap)) {
    if (text.includes(key)) {
      activity = value;
      break;
    }
  }

  // Detectar sentimento
  const positiveWords: Record<Language, string[]> = {
    'en': ['love', 'amazing', 'beautiful', 'great', 'wonderful', 'excited', 'happy', 'perfect', 'fantastic', 'awesome', 'gorgeous', 'stunning'],
    'es': ['amor', 'increíble', 'hermoso', 'genial', 'maravilloso', 'emocionado', 'feliz', 'perfecto', 'fantástico', 'impresionante', 'precioso', 'impresionante'],
    'pt-br': ['amor', 'incrível', 'lindo', 'ótimo', 'maravilhoso', 'empolgado', 'feliz', 'perfeito', 'fantástico', 'demais', 'linda', 'bonita', 'bonito'],
    'fr': ['amour', 'incroyable', 'beau', 'super', 'merveilleux', 'excité', 'heureux', 'parfait', 'fantastique', 'génial', 'magnifique', 'époustouflant'],
  };

  const negativeWords: Record<Language, string[]> = {
    'en': ['sad', 'disappointed', 'frustrated', 'difficult', 'hard', 'struggling', 'challenging'],
    'es': ['triste', 'decepcionado', 'frustrado', 'difícil', 'duro', 'luchando', 'desafiante'],
    'pt-br': ['triste', 'decepcionado', 'frustrado', 'difícil', 'duro', 'lutando', 'desafiador'],
    'fr': ['triste', 'déçu', 'frustré', 'difficile', 'dur', 'lutte', 'défiant'],
  };

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveWords[language].some(word => text.includes(word))) {
    sentiment = 'positive';
  } else if (negativeWords[language].some(word => text.includes(word))) {
    sentiment = 'negative';
  }

  // Identificar assunto principal (primeira palavra-chave relevante ou local)
  const mainSubject = location || relevantKeywords[0] || activity || 'momento';

  // Palavras descritivas (adjetivos)
  const descriptiveWords = words.filter(w => {
    const descWords: Record<Language, string[]> = {
      'en': ['beautiful', 'amazing', 'gorgeous', 'stunning', 'perfect', 'wonderful', 'incredible', 'lovely', 'cute', 'nice', 'great', 'fantastic'],
      'es': ['hermoso', 'increíble', 'precioso', 'impresionante', 'perfecto', 'maravilloso', 'increíble', 'bonito', 'lindo', 'agradable'],
      'pt-br': ['bonita', 'linda', 'incrível', 'maravilhosa', 'perfeita', 'ótima', 'inacreditável', 'fofa', 'legal', 'bonito', 'lindo', 'demais'],
      'fr': ['beau', 'magnifique', 'superbe', 'époustouflant', 'parfait', 'merveilleux', 'incroyable', 'mignon', 'joli', 'agréable'],
    };
    return descWords[language].includes(w);
  });

  // Todas as palavras-chave (incluindo descritivas)
  const allKeywords = [...relevantKeywords, ...descriptiveWords].slice(0, 10);

  return {
    keywords: relevantKeywords,
    location,
    activity,
    sentiment,
    niche: activity,
    hasLocation: !!location,
    hasActivity: !!activity,
    mainSubject,
    descriptiveWords,
    allKeywords,
  };
};

/**
 * Generate a topic summary in the target language
 */
const generateTopicSummary = (context: ExtractedContext, language: Language): string => {
  const summaries: Record<Language, (ctx: ExtractedContext) => string> = {
    'en': (ctx) => {
      if (ctx.location && ctx.activity) {
        return `${ctx.activity} in ${ctx.location}`;
      }
      if (ctx.location) {
        return `Content about ${ctx.location}`;
      }
      if (ctx.activity) {
        return `Content about ${ctx.activity}`;
      }
      return `Content about ${ctx.keywords.slice(0, 2).join(' and ')}`;
    },
    'es': (ctx) => {
      if (ctx.location && ctx.activity) {
        return `${ctx.activity} en ${ctx.location}`;
      }
      if (ctx.location) {
        return `Contenido sobre ${ctx.location}`;
      }
      if (ctx.activity) {
        return `Contenido sobre ${ctx.activity}`;
      }
      return `Contenido sobre ${ctx.keywords.slice(0, 2).join(' y ')}`;
    },
    'pt-br': (ctx) => {
      if (ctx.location && ctx.activity) {
        return `${ctx.activity} em ${ctx.location}`;
      }
      if (ctx.location) {
        return `Conteúdo sobre ${ctx.location}`;
      }
      if (ctx.activity) {
        return `Conteúdo sobre ${ctx.activity}`;
      }
      return `Conteúdo sobre ${ctx.keywords.slice(0, 2).join(' e ')}`;
    },
    'fr': (ctx) => {
      if (ctx.location && ctx.activity) {
        return `${ctx.activity} à ${ctx.location}`;
      }
      if (ctx.location) {
        return `Contenu sur ${ctx.location}`;
      }
      if (ctx.activity) {
        return `Contenu sur ${ctx.activity}`;
      }
      return `Contenu sur ${ctx.keywords.slice(0, 2).join(' et ')}`;
    },
  };

  return summaries[language](context);
};

/**
 * Helper function to capitalize first letter
 */
const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generate short caption - MUITO mais variações e dinâmico
 */
const generateShortCaption = (context: ExtractedContext, topic: string, tone: Tone, language: Language): string => {
  const mainKeyword = context.mainSubject || context.keywords[0] || 'isso';
  const secondKeyword = context.keywords[1] || '';
  const thirdKeyword = context.keywords[2] || '';
  const descWord = context.descriptiveWords[0] || '';
  const allKeywords = context.allKeywords.slice(0, 3);
  
  // Templates expandidos com MUITO mais variações
  const templates: Record<Language, Record<Tone, (() => string)[]>> = {
    'pt-br': {
      friendly: [
        () => context.location ? `Amo ${context.location}! ✨` : `${capitalize(mainKeyword)} é tudo! ✨`,
        () => context.location ? `Vibes de ${context.location}! 💫` : `${capitalize(mainKeyword)} vibes! ✨`,
        () => descWord ? `${capitalize(descWord)} demais! 💫` : `Vivendo isso! 🌟`,
        () => context.location && descWord ? `${capitalize(descWord)} em ${context.location}! ✨` : `${capitalize(mainKeyword)}${secondKeyword ? ` e ${secondKeyword}` : ''} são tudo! ✨`,
        () => allKeywords.length > 1 ? `${capitalize(allKeywords[0])}${allKeywords[1] ? ` e ${allKeywords[1]}` : ''} são incríveis! 💫` : `Isso é incrível! 🌟`,
        () => context.location ? `Cada momento em ${context.location} é especial! ✨` : `${capitalize(mainKeyword)} sempre me surpreende! 💕`,
        () => descWord ? `Tão ${descWord}! 💫` : `Adorando isso! 🌟`,
        () => context.location ? `Energia de ${context.location}! ✨` : `${capitalize(mainKeyword)} é perfeito! 💫`,
      ],
      professional: [
        () => context.location ? `Explorando ${context.location}.` : `Focando em ${mainKeyword}.`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} em destaque.` : `Insights e atualizações.`,
        () => context.location ? `Análise de ${context.location}.` : `Perspectivas sobre ${mainKeyword}.`,
        () => allKeywords.length > 0 ? `${capitalize(allKeywords[0])} como foco principal.` : `Atualização profissional.`,
        () => context.location ? `Oportunidades em ${context.location}.` : `Desenvolvimento em ${mainKeyword}.`,
      ],
      funny: [
        () => context.location ? `Quando ${context.location} pega diferente 😂` : `Plot twist: ${mainKeyword} aconteceu 🎭`,
        () => mainKeyword !== 'isso' ? `Não eu e ${mainKeyword} de novo... 💀` : `A audácia não tem comparação 😭`,
        () => context.location ? `${context.location} me pegou de surpresa 😂` : `${capitalize(mainKeyword)} disse "bet" e eu disse "okay" 🎲`,
        () => descWord ? `A ${descWord} chegou diferente hoje 😭` : `A vida é uma caixinha de surpresas 💀`,
        () => context.location ? `Plot twist: ${context.location} é tudo isso 😂` : `${capitalize(mainKeyword)} não perdoa 🎭`,
      ],
      inspirational: [
        () => context.location ? `Encontrando inspiração em ${context.location} ✨` : `Cada momento é um novo começo 🌟`,
        () => `O crescimento acontece fora da sua zona de conforto 💫`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} me ensina algo novo todos os dias ✨` : `A jornada é tão importante quanto o destino 🌟`,
        () => context.location ? `${context.location} me lembra do que realmente importa 💫` : `Cada passo é progresso ✨`,
        () => descWord ? `A ${descWord} está em todos os detalhes 🌟` : `A beleza está nos pequenos momentos 💫`,
      ],
    },
    'en': {
      friendly: [
        () => context.location ? `Loving ${context.location}! ✨` : `${capitalize(mainKeyword)} is everything! ✨`,
        () => context.location ? `${context.location} vibes! 💫` : `${capitalize(mainKeyword)} vibes! ✨`,
        () => descWord ? `So ${descWord}! 💫` : `Living for this! 🌟`,
        () => context.location && descWord ? `${capitalize(descWord)} in ${context.location}! ✨` : `${capitalize(mainKeyword)}${secondKeyword ? ` and ${secondKeyword}` : ''} are everything! ✨`,
        () => allKeywords.length > 1 ? `${capitalize(allKeywords[0])}${allKeywords[1] ? ` and ${allKeywords[1]}` : ''} are amazing! 💫` : `This is incredible! 🌟`,
        () => context.location ? `Every moment in ${context.location} is special! ✨` : `${capitalize(mainKeyword)} always surprises me! 💕`,
        () => descWord ? `Too ${descWord}! 💫` : `Can't get enough! 🌟`,
        () => context.location ? `Energy of ${context.location}! ✨` : `${capitalize(mainKeyword)} is perfect! 💫`,
      ],
      professional: [
        () => context.location ? `Exploring ${context.location}.` : `Focusing on ${mainKeyword}.`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} in focus.` : `Insights and updates.`,
        () => context.location ? `Analysis of ${context.location}.` : `Perspectives on ${mainKeyword}.`,
        () => allKeywords.length > 0 ? `${capitalize(allKeywords[0])} as main focus.` : `Professional update.`,
        () => context.location ? `Opportunities in ${context.location}.` : `Development in ${mainKeyword}.`,
      ],
      funny: [
        () => context.location ? `When ${context.location} hits different 😂` : `Plot twist: ${mainKeyword} happened 🎭`,
        () => mainKeyword !== 'this' ? `Not me and ${mainKeyword} again... 💀` : `The audacity is unmatched 😭`,
        () => context.location ? `${context.location} caught me off guard 😂` : `${capitalize(mainKeyword)} said "bet" and I said "okay" 🎲`,
        () => descWord ? `The ${descWord} came different today 😭` : `Life is a box of surprises 💀`,
        () => context.location ? `Plot twist: ${context.location} is all that 😂` : `${capitalize(mainKeyword)} doesn't forgive 🎭`,
      ],
      inspirational: [
        () => context.location ? `Finding inspiration in ${context.location} ✨` : `Every moment is a new beginning 🌟`,
        () => `Growth happens outside your comfort zone 💫`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} teaches me something new every day ✨` : `The journey is as important as the destination 🌟`,
        () => context.location ? `${context.location} reminds me of what really matters 💫` : `Every step is progress ✨`,
        () => descWord ? `The ${descWord} is in all the details 🌟` : `Beauty is in the small moments 💫`,
      ],
    },
    'es': {
      friendly: [
        () => context.location ? `¡Amo ${context.location}! ✨` : `¡${capitalize(mainKeyword)} es todo! ✨`,
        () => context.location ? `¡Vibes de ${context.location}! 💫` : `¡${capitalize(mainKeyword)} vibes! ✨`,
        () => descWord ? `¡Tan ${descWord}! 💫` : `¡Viviendo esto! 🌟`,
        () => context.location && descWord ? `¡${capitalize(descWord)} en ${context.location}! ✨` : `¡${capitalize(mainKeyword)}${secondKeyword ? ` y ${secondKeyword}` : ''} son todo! ✨`,
        () => allKeywords.length > 1 ? `¡${capitalize(allKeywords[0])}${allKeywords[1] ? ` y ${allKeywords[1]}` : ''} son increíbles! 💫` : `¡Esto es increíble! 🌟`,
        () => context.location ? `¡Cada momento en ${context.location} es especial! ✨` : `¡${capitalize(mainKeyword)} siempre me sorprende! 💕`,
        () => descWord ? `¡Demasiado ${descWord}! 💫` : `¡No puedo tener suficiente! 🌟`,
        () => context.location ? `¡Energía de ${context.location}! ✨` : `¡${capitalize(mainKeyword)} es perfecto! 💫`,
      ],
      professional: [
        () => context.location ? `Explorando ${context.location}.` : `Enfocándome en ${mainKeyword}.`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} en foco.` : `Insights y actualizaciones.`,
        () => context.location ? `Análisis de ${context.location}.` : `Perspectivas sobre ${mainKeyword}.`,
        () => allKeywords.length > 0 ? `${capitalize(allKeywords[0])} como foco principal.` : `Actualización profesional.`,
        () => context.location ? `Oportunidades en ${context.location}.` : `Desarrollo en ${mainKeyword}.`,
      ],
      funny: [
        () => context.location ? `Cuando ${context.location} pega diferente 😂` : `Giro de trama: ${mainKeyword} pasó 🎭`,
        () => mainKeyword !== 'esto' ? `No yo y ${mainKeyword} otra vez... 💀` : `La audacia no tiene comparación 😭`,
        () => context.location ? `${context.location} me tomó por sorpresa 😂` : `${capitalize(mainKeyword)} dijo "apuesta" y yo dije "okay" 🎲`,
        () => descWord ? `La ${descWord} llegó diferente hoy 😭` : `La vida es una caja de sorpresas 💀`,
        () => context.location ? `Giro de trama: ${context.location} es todo eso 😂` : `${capitalize(mainKeyword)} no perdona 🎭`,
      ],
      inspirational: [
        () => context.location ? `Encontrando inspiración en ${context.location} ✨` : `Cada momento es un nuevo comienzo 🌟`,
        () => `El crecimiento ocurre fuera de tu zona de confort 💫`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} me enseña algo nuevo todos los días ✨` : `El viaje es tan importante como el destino 🌟`,
        () => context.location ? `${context.location} me recuerda lo que realmente importa 💫` : `Cada paso es progreso ✨`,
        () => descWord ? `La ${descWord} está en todos los detalles 🌟` : `La belleza está en los pequeños momentos 💫`,
      ],
    },
    'fr': {
      friendly: [
        () => context.location ? `J'adore ${context.location} ! ✨` : `${capitalize(mainKeyword)} est tout ! ✨`,
        () => context.location ? `Vibes de ${context.location} ! 💫` : `${capitalize(mainKeyword)} vibes ! ✨`,
        () => descWord ? `Si ${descWord} ! 💫` : `Vivre ça ! 🌟`,
        () => context.location && descWord ? `${capitalize(descWord)} à ${context.location} ! ✨` : `${capitalize(mainKeyword)}${secondKeyword ? ` et ${secondKeyword}` : ''} sont tout ! ✨`,
        () => allKeywords.length > 1 ? `${capitalize(allKeywords[0])}${allKeywords[1] ? ` et ${allKeywords[1]}` : ''} sont incroyables ! 💫` : `C'est incroyable ! 🌟`,
        () => context.location ? `Chaque moment à ${context.location} est spécial ! ✨` : `${capitalize(mainKeyword)} me surprend toujours ! 💕`,
        () => descWord ? `Trop ${descWord} ! 💫` : `Je ne peux pas en avoir assez ! 🌟`,
        () => context.location ? `Énergie de ${context.location} ! ✨` : `${capitalize(mainKeyword)} est parfait ! 💫`,
      ],
      professional: [
        () => context.location ? `Explorer ${context.location}.` : `Se concentrer sur ${mainKeyword}.`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} en focus.` : `Insights et mises à jour.`,
        () => context.location ? `Analyse de ${context.location}.` : `Perspectives sur ${mainKeyword}.`,
        () => allKeywords.length > 0 ? `${capitalize(allKeywords[0])} comme focus principal.` : `Mise à jour professionnelle.`,
        () => context.location ? `Opportunités à ${context.location}.` : `Développement en ${mainKeyword}.`,
      ],
      funny: [
        () => context.location ? `Quand ${context.location} frappe différemment 😂` : `Retournement de situation : ${mainKeyword} s'est passé 🎭`,
        () => mainKeyword !== 'cela' ? `Pas moi et ${mainKeyword} encore... 💀` : `L'audace n'a pas de comparaison 😭`,
        () => context.location ? `${context.location} m'a pris par surprise 😂` : `${capitalize(mainKeyword)} a dit "pari" et j'ai dit "okay" 🎲`,
        () => descWord ? `Le ${descWord} est arrivé différent aujourd'hui 😭` : `La vie est une boîte de surprises 💀`,
        () => context.location ? `Retournement de situation : ${context.location} est tout ça 😂` : `${capitalize(mainKeyword)} ne pardonne pas 🎭`,
      ],
      inspirational: [
        () => context.location ? `Trouver l'inspiration à ${context.location} ✨` : `Chaque moment est un nouveau départ 🌟`,
        () => `La croissance se produit en dehors de votre zone de confort 💫`,
        () => context.keywords.length > 0 ? `${capitalize(mainKeyword)} m'apprend quelque chose de nouveau chaque jour ✨` : `Le voyage est aussi important que la destination 🌟`,
        () => context.location ? `${context.location} me rappelle ce qui compte vraiment 💫` : `Chaque pas est un progrès ✨`,
        () => descWord ? `Le ${descWord} est dans tous les détails 🌟` : `La beauté est dans les petits moments 💫`,
      ],
    },
  };

  const options = templates[language][tone];
  const selectedTemplate = options[Math.floor(Math.random() * options.length)];
  return selectedTemplate();
};

/**
 * Generate medium caption - MUITO mais dinâmico e variado
 */
const generateMediumCaption = (context: ExtractedContext, topic: string, tone: Tone, language: Language): string => {
  const mainKeyword = context.mainSubject || context.keywords[0] || 'isso';
  const secondKeyword = context.keywords[1] || '';
  const descWord = context.descriptiveWords[0] || '';
  const allKeywords = context.allKeywords;
  
  // Construir múltiplas variações de frases base
  const buildBaseSentences = (): string[] => {
    const sentences: string[] = [];
    
    if (context.location && context.keywords.length > 0) {
      const keyword = context.keywords[0];
      const desc = descWord ? ` ${descWord}` : '';
      
      if (language === 'pt-br') {
        sentences.push(
          `Explorando ${keyword}${desc} em ${context.location} foi uma experiência incrível.`,
          `Cada momento em ${context.location} me lembra por que ${keyword}${desc} é tão especial.`,
          `${capitalize(keyword)}${desc} em ${context.location} superou todas as expectativas.`,
          `A energia de ${context.location} combinada com ${keyword}${desc} é simplesmente única.`,
          `Descobrir ${keyword}${desc} em ${context.location} foi um dos melhores momentos.`
        );
      } else if (language === 'en') {
        sentences.push(
          `Exploring ${keyword}${desc} in ${context.location} was an incredible experience.`,
          `Every moment in ${context.location} reminds me why ${keyword}${desc} is so special.`,
          `${capitalize(keyword)}${desc} in ${context.location} exceeded all expectations.`,
          `The energy of ${context.location} combined with ${keyword}${desc} is simply unique.`,
          `Discovering ${keyword}${desc} in ${context.location} was one of the best moments.`
        );
      } else if (language === 'es') {
        sentences.push(
          `Explorar ${keyword}${desc} en ${context.location} fue una experiencia increíble.`,
          `Cada momento en ${context.location} me recuerda por qué ${keyword}${desc} es tan especial.`,
          `${capitalize(keyword)}${desc} en ${context.location} superó todas las expectativas.`,
          `La energía de ${context.location} combinada con ${keyword}${desc} es simplemente única.`,
          `Descubrir ${keyword}${desc} en ${context.location} fue uno de los mejores momentos.`
        );
      } else if (language === 'fr') {
        sentences.push(
          `Explorer ${keyword}${desc} à ${context.location} a été une expérience incroyable.`,
          `Chaque moment à ${context.location} me rappelle pourquoi ${keyword}${desc} est si spécial.`,
          `${capitalize(keyword)}${desc} à ${context.location} a dépassé toutes les attentes.`,
          `L'énergie de ${context.location} combinée avec ${keyword}${desc} est simplement unique.`,
          `Découvrir ${keyword}${desc} à ${context.location} a été l'un des meilleurs moments.`
        );
      }
    } else if (context.location) {
      if (language === 'pt-br') {
        sentences.push(
          `Há algo especial sobre ${context.location}.`,
          `${capitalize(context.location)} sempre me surpreende de formas novas.`,
          `Cada visita a ${context.location} revela algo diferente.`,
          `A atmosfera de ${context.location} é simplesmente única.`,
          `${capitalize(context.location)} tem uma energia que não se compara.`
        );
      } else if (language === 'en') {
        sentences.push(
          `There's something special about ${context.location}.`,
          `${capitalize(context.location)} always surprises me in new ways.`,
          `Every visit to ${context.location} reveals something different.`,
          `The atmosphere of ${context.location} is simply unique.`,
          `${capitalize(context.location)} has an energy that can't be compared.`
        );
      } else if (language === 'es') {
        sentences.push(
          `Hay algo especial sobre ${context.location}.`,
          `${capitalize(context.location)} siempre me sorprende de formas nuevas.`,
          `Cada visita a ${context.location} revela algo diferente.`,
          `La atmósfera de ${context.location} es simplemente única.`,
          `${capitalize(context.location)} tiene una energía que no se puede comparar.`
        );
      } else if (language === 'fr') {
        sentences.push(
          `Il y a quelque chose de spécial à propos de ${context.location}.`,
          `${capitalize(context.location)} me surprend toujours de nouvelles façons.`,
          `Chaque visite à ${context.location} révèle quelque chose de différent.`,
          `L'atmosphère de ${context.location} est simplement unique.`,
          `${capitalize(context.location)} a une énergie qui ne peut pas être comparée.`
        );
      }
    } else if (context.keywords.length > 0) {
      const keyword = capitalize(context.keywords[0]);
      if (language === 'pt-br') {
        sentences.push(
          `${keyword}${secondKeyword ? ` e ${secondKeyword}` : ''} abriu novas perspectivas.`,
          `Descobrir ${keyword.toLowerCase()}${secondKeyword ? ` e ${secondKeyword}` : ''} foi revelador.`,
          `${capitalize(keyword)}${secondKeyword ? ` e ${secondKeyword}` : ''} me ensinou algo novo.`,
          `A experiência com ${keyword.toLowerCase()}${secondKeyword ? ` e ${secondKeyword}` : ''} foi transformadora.`,
          `${capitalize(keyword)}${secondKeyword ? ` e ${secondKeyword}` : ''} sempre me surpreende.`
        );
      } else if (language === 'en') {
        sentences.push(
          `${keyword}${secondKeyword ? ` and ${secondKeyword}` : ''} opened new perspectives.`,
          `Discovering ${keyword.toLowerCase()}${secondKeyword ? ` and ${secondKeyword}` : ''} was revealing.`,
          `${capitalize(keyword)}${secondKeyword ? ` and ${secondKeyword}` : ''} taught me something new.`,
          `The experience with ${keyword.toLowerCase()}${secondKeyword ? ` and ${secondKeyword}` : ''} was transformative.`,
          `${capitalize(keyword)}${secondKeyword ? ` and ${secondKeyword}` : ''} always surprises me.`
        );
      } else if (language === 'es') {
        sentences.push(
          `${keyword}${secondKeyword ? ` y ${secondKeyword}` : ''} abrió nuevas perspectivas.`,
          `Descubrir ${keyword.toLowerCase()}${secondKeyword ? ` y ${secondKeyword}` : ''} fue revelador.`,
          `${capitalize(keyword)}${secondKeyword ? ` y ${secondKeyword}` : ''} me enseñó algo nuevo.`,
          `La experiencia con ${keyword.toLowerCase()}${secondKeyword ? ` y ${secondKeyword}` : ''} fue transformadora.`,
          `${capitalize(keyword)}${secondKeyword ? ` y ${secondKeyword}` : ''} siempre me sorprende.`
        );
      } else if (language === 'fr') {
        sentences.push(
          `${keyword}${secondKeyword ? ` et ${secondKeyword}` : ''} a ouvert de nouvelles perspectives.`,
          `Découvrir ${keyword.toLowerCase()}${secondKeyword ? ` et ${secondKeyword}` : ''} était révélateur.`,
          `${capitalize(keyword)}${secondKeyword ? ` et ${secondKeyword}` : ''} m'a appris quelque chose de nouveau.`,
          `L'expérience avec ${keyword.toLowerCase()}${secondKeyword ? ` et ${secondKeyword}` : ''} était transformative.`,
          `${capitalize(keyword)}${secondKeyword ? ` et ${secondKeyword}` : ''} me surprend toujours.`
        );
      }
    } else {
      // Fallback genérico
      if (language === 'pt-br') {
        sentences.push(
          `Esta experiência tem sido verdadeiramente significativa.`,
          `Cada momento traz algo novo para descobrir.`,
          `A jornada continua e cada passo é importante.`
        );
      } else if (language === 'en') {
        sentences.push(
          `This experience has been truly meaningful.`,
          `Every moment brings something new to discover.`,
          `The journey continues and every step matters.`
        );
      } else if (language === 'es') {
        sentences.push(
          `Esta experiencia ha sido verdaderamente significativa.`,
          `Cada momento trae algo nuevo para descubrir.`,
          `El viaje continúa y cada paso importa.`
        );
      } else if (language === 'fr') {
        sentences.push(
          `Cette expérience a été vraiment significative.`,
          `Chaque moment apporte quelque chose de nouveau à découvrir.`,
          `Le voyage continue et chaque pas compte.`
        );
      }
    }
    
    return sentences;
  };

  const baseSentences = buildBaseSentences();
  const baseText = baseSentences[Math.floor(Math.random() * baseSentences.length)];
  
  const endings: Record<Language, Record<Tone, string[]>> = {
    'pt-br': {
      friendly: [
        ' O que você acha? Compartilhe seus pensamentos abaixo! 👇',
        ' Deixa um ❤️ se você se identifica!',
        ' Me conta o que você pensa nos comentários! 💬',
        ' Qual é a sua opinião sobre isso?',
        ' O que você achou? Deixa nos comentários! 💕',
      ],
      professional: [
        ' Aguardo seu feedback.',
        ' Quais são seus pensamentos sobre isso?',
        ' Adoraria ouvir sua perspectiva.',
        ' Vamos discutir nos comentários.',
        ' Sua opinião é muito importante.',
      ],
      funny: [
        ' Sem mentira 🧢',
        ' Faz fazer sentido 🤔',
        ' Opiniões? 😂',
        ' A vida é uma caixinha de surpresas 💀',
        ' Me conta o que você acha! 🎭',
      ],
      inspirational: [
        ' O que está te inspirando hoje?',
        ' Compartilhe sua jornada abaixo! ✨',
        ' Qual é o seu próximo passo?',
        ' O que você está trabalhando para alcançar?',
        ' Vamos crescer juntos! 💫',
      ],
    },
    'en': {
      friendly: [
        ' What do you think? Share your thoughts below! 👇',
        ' Drop a ❤️ if you can relate!',
        ' Let me know your thoughts in the comments! 💬',
        ' What\'s your take on this?',
        ' What did you think? Leave it in the comments! 💕',
      ],
      professional: [
        ' Looking forward to your feedback.',
        ' What are your thoughts on this?',
        ' I\'d love to hear your perspective.',
        ' Let\'s discuss in the comments.',
        ' Your opinion is very important.',
      ],
      funny: [
        ' No cap 🧢',
        ' Make it make sense 🤔',
        ' Thoughts? 😂',
        ' Life is a box of surprises 💀',
        ' Tell me what you think! 🎭',
      ],
      inspirational: [
        ' What\'s inspiring you today?',
        ' Share your journey below! ✨',
        ' What\'s your next step?',
        ' What are you working towards?',
        ' Let\'s grow together! 💫',
      ],
    },
    'es': {
      friendly: [
        ' ¿Qué opinas? ¡Comparte tus pensamientos abajo! 👇',
        ' ¡Deja un ❤️ si te identificas!',
        ' ¡Déjame saber tu opinión en los comentarios! 💬',
        ' ¿Cuál es tu opinión sobre esto?',
        ' ¿Qué pensaste? ¡Déjalo en los comentarios! 💕',
      ],
      professional: [
        ' Espero tu comentario.',
        ' ¿Cuáles son tus pensamientos sobre esto?',
        ' Me encantaría escuchar tu perspectiva.',
        ' Discutamos en los comentarios.',
        ' Tu opinión es muy importante.',
      ],
      funny: [
        ' Sin mentiras 🧢',
        ' Haz que tenga sentido 🤔',
        ' ¿Opiniones? 😂',
        ' La vida es una caja de sorpresas 💀',
        ' ¡Dime qué piensas! 🎭',
      ],
      inspirational: [
        ' ¿Qué te inspira hoy?',
        ' ¡Comparte tu camino abajo! ✨',
        ' ¿Cuál es tu próximo paso?',
        ' ¿Hacia qué estás trabajando?',
        ' ¡Crecemos juntos! 💫',
      ],
    },
    'fr': {
      friendly: [
        ' Qu\'en penses-tu ? Partage tes pensées ci-dessous ! 👇',
        ' Laisse un ❤️ si tu peux t\'identifier !',
        ' Fais-moi savoir ce que tu penses dans les commentaires ! 💬',
        ' Quel est ton avis sur cela ?',
        ' Qu\'as-tu pensé ? Laisse-le dans les commentaires ! 💕',
      ],
      professional: [
        ' J\'attends tes commentaires.',
        ' Quels sont tes pensées sur cela ?',
        ' J\'aimerais entendre ta perspective.',
        ' Discutons dans les commentaires.',
        ' Ton opinion est très importante.',
      ],
      funny: [
        ' Sans mentir 🧢',
        ' Fais que ça ait du sens 🤔',
        ' Avis ? 😂',
        ' La vie est une boîte de surprises 💀',
        ' Dis-moi ce que tu penses ! 🎭',
      ],
      inspirational: [
        ' Qu\'est-ce qui t\'inspire aujourd\'hui ?',
        ' Partage ton parcours ci-dessous ! ✨',
        ' Quel est ton prochain pas ?',
        ' Vers quoi travailles-tu ?',
        ' Grandissons ensemble ! 💫',
      ],
    },
  };

  const endingOptions = endings[language][tone];
  const ending = endingOptions[Math.floor(Math.random() * endingOptions.length)];
  
  return baseText + ending;
};

/**
 * Generate long caption - storytelling expandido e dinâmico
 */
const generateLongCaption = (context: ExtractedContext, topic: string, tone: Tone, language: Language): string => {
  const mainKeyword = context.mainSubject || context.keywords[0] || 'isso';
  const descWord = context.descriptiveWords[0] || '';
  const allKeywords = context.allKeywords;
  
  // Intros expandidos
  const intros: Record<Language, Record<Tone, string[]>> = {
    'pt-br': {
      friendly: [
        'Oi, pessoal! 👋 ',
        'Tão empolgada para compartilhar isso com vocês! ',
        'Podemos falar sobre isso por um segundo? ',
        'Olha só o que aconteceu hoje! ',
        'Preciso compartilhar isso com vocês! ',
        'Vocês não vão acreditar! ',
      ],
      professional: [
        'Hoje quero discutir ',
        'Vamos mergulhar em ',
        'Tenho pensado sobre ',
        'Gostaria de compartilhar algumas reflexões sobre ',
        'Vamos explorar ',
      ],
      funny: [
        'Plot twist: ',
        'Então eu fiz uma coisa... ',
        'O jeito que eu ',
        'Não vai acreditar no que aconteceu: ',
        'A vida me pregou uma peça: ',
      ],
      inspirational: [
        'Queria compartilhar algo significativo com vocês hoje. ',
        'Este momento me lembrou de algo importante. ',
        'Hoje aprendi algo que quero compartilhar. ',
        'Esta experiência me fez refletir sobre ',
        'Quero dividir com vocês uma lição importante. ',
      ],
    },
    'en': {
      friendly: [
        'Hey everyone! 👋 ',
        'So excited to share this with you! ',
        'Can we talk about this for a second? ',
        'Look what happened today! ',
        'I need to share this with you! ',
        'You won\'t believe this! ',
      ],
      professional: [
        'Today I want to discuss ',
        'Let\'s dive into ',
        'I\'ve been thinking about ',
        'I\'d like to share some reflections on ',
        'Let\'s explore ',
      ],
      funny: [
        'Plot twist: ',
        'So I did a thing... ',
        'The way I ',
        'You won\'t believe what happened: ',
        'Life played a trick on me: ',
      ],
      inspirational: [
        'I wanted to share something meaningful with you today. ',
        'This moment reminded me of something important. ',
        'Today I learned something I want to share. ',
        'This experience made me reflect on ',
        'I want to share an important lesson with you. ',
      ],
    },
    'es': {
      friendly: [
        '¡Hola a todos! 👋 ',
        '¡Tan emocionada de compartir esto contigo! ',
        '¿Podemos hablar de esto por un segundo? ',
        '¡Mira lo que pasó hoy! ',
        '¡Necesito compartir esto contigo! ',
        '¡No vas a creer esto! ',
      ],
      professional: [
        'Hoy quiero discutir ',
        'Profundicemos en ',
        'He estado pensando en ',
        'Me gustaría compartir algunas reflexiones sobre ',
        'Exploremos ',
      ],
      funny: [
        'Giro de trama: ',
        'Así que hice algo... ',
        'La forma en que yo ',
        'No vas a creer lo que pasó: ',
        'La vida me jugó una broma: ',
      ],
      inspirational: [
        'Quería compartir algo significativo contigo hoy. ',
        'Este momento me recordó algo importante. ',
        'Hoy aprendí algo que quiero compartir. ',
        'Esta experiencia me hizo reflexionar sobre ',
        'Quiero compartir una lección importante contigo. ',
      ],
    },
    'fr': {
      friendly: [
        'Salut tout le monde ! 👋 ',
        'Tellement excitée de partager ça avec vous ! ',
        'Peut-on parler de ça une seconde ? ',
        'Regardez ce qui s\'est passé aujourd\'hui ! ',
        'Je dois partager ça avec vous ! ',
        'Vous ne croirez pas ça ! ',
      ],
      professional: [
        'Aujourd\'hui je veux discuter ',
        'Plongeons dans ',
        'J\'ai réfléchi à ',
        'J\'aimerais partager quelques réflexions sur ',
        'Explorons ',
      ],
      funny: [
        'Retournement de situation : ',
        'Alors j\'ai fait un truc... ',
        'La façon dont je ',
        'Vous ne croirez pas ce qui s\'est passé : ',
        'La vie m\'a joué un tour : ',
      ],
      inspirational: [
        'Je voulais partager quelque chose de significatif avec vous aujourd\'hui. ',
        'Ce moment m\'a rappelé quelque chose d\'important. ',
        'Aujourd\'hui j\'ai appris quelque chose que je veux partager. ',
        'Cette expérience m\'a fait réfléchir à ',
        'Je veux partager une leçon importante avec vous. ',
      ],
    },
  };

  const introOptions = intros[language][tone];
  const intro = introOptions[Math.floor(Math.random() * introOptions.length)];

  // Middle - múltiplas variações dinâmicas
  let middle = '';
  if (context.location && context.keywords.length > 0) {
    const keyword = context.keywords[0];
    const desc = descWord ? ` ${descWord}` : '';
    const middleOptions: Record<Language, string[]> = {
      'pt-br': [
        `Explorar ${keyword}${desc} em ${context.location} tem sido uma experiência incrível. A energia aqui não tem comparação, e estou tão grata por poder compartilhar esses momentos.`,
        `Cada momento em ${context.location} me lembra por que ${keyword}${desc} é tão especial. A combinação perfeita entre lugar e experiência cria memórias que vou levar para sempre.`,
        `${capitalize(keyword)}${desc} em ${context.location} superou todas as minhas expectativas. Há algo mágico nessa combinação que simplesmente não consigo explicar.`,
        `A energia de ${context.location} combinada com ${keyword}${desc} é simplesmente única. Cada detalhe, cada momento, cada sensação - tudo se conecta de forma perfeita.`,
        `Descobrir ${keyword}${desc} em ${context.location} foi um dos melhores momentos. A experiência foi tão rica e significativa que quero compartilhar com todos vocês.`,
      ],
      'en': [
        `Exploring ${keyword}${desc} in ${context.location} has been an incredible experience. The energy here is unmatched, and I'm so grateful to be able to share these moments.`,
        `Every moment in ${context.location} reminds me why ${keyword}${desc} is so special. The perfect combination of place and experience creates memories I'll carry forever.`,
        `${capitalize(keyword)}${desc} in ${context.location} exceeded all my expectations. There's something magical about this combination that I simply can't explain.`,
        `The energy of ${context.location} combined with ${keyword}${desc} is simply unique. Every detail, every moment, every sensation - everything connects perfectly.`,
        `Discovering ${keyword}${desc} in ${context.location} was one of the best moments. The experience was so rich and meaningful that I want to share it with all of you.`,
      ],
      'es': [
        `Explorar ${keyword}${desc} en ${context.location} ha sido una experiencia increíble. La energía aquí no tiene comparación, y estoy tan agradecida de poder compartir estos momentos.`,
        `Cada momento en ${context.location} me recuerda por qué ${keyword}${desc} es tan especial. La combinación perfecta entre lugar y experiencia crea recuerdos que llevaré para siempre.`,
        `${capitalize(keyword)}${desc} en ${context.location} superó todas mis expectativas. Hay algo mágico en esta combinación que simplemente no puedo explicar.`,
        `La energía de ${context.location} combinada con ${keyword}${desc} es simplemente única. Cada detalle, cada momento, cada sensación - todo se conecta perfectamente.`,
        `Descubrir ${keyword}${desc} en ${context.location} fue uno de los mejores momentos. La experiencia fue tan rica y significativa que quiero compartirla con todos ustedes.`,
      ],
      'fr': [
        `Explorer ${keyword}${desc} à ${context.location} a été une expérience incroyable. L'énergie ici est incomparable, et je suis si reconnaissante de pouvoir partager ces moments.`,
        `Chaque moment à ${context.location} me rappelle pourquoi ${keyword}${desc} est si spécial. La combinaison parfaite entre lieu et expérience crée des souvenirs que je porterai pour toujours.`,
        `${capitalize(keyword)}${desc} à ${context.location} a dépassé toutes mes attentes. Il y a quelque chose de magique dans cette combinaison que je ne peux tout simplement pas expliquer.`,
        `L'énergie de ${context.location} combinée avec ${keyword}${desc} est simplement unique. Chaque détail, chaque moment, chaque sensation - tout se connecte parfaitement.`,
        `Découvrir ${keyword}${desc} à ${context.location} a été l'un des meilleurs moments. L'expérience était si riche et significative que je veux la partager avec vous tous.`,
      ],
    };
    const options = middleOptions[language];
    middle = options[Math.floor(Math.random() * options.length)];
  } else if (context.location) {
    const middleOptions: Record<Language, string[]> = {
      'pt-br': [
        `Há algo especial sobre ${context.location}. O ambiente, as pessoas, as vibes - tudo se une perfeitamente. Cada visita revela uma nova camada de beleza e significado.`,
        `${capitalize(context.location)} sempre me surpreende de formas novas. A atmosfera aqui é única, e cada momento traz uma nova descoberta.`,
        `Cada visita a ${context.location} revela algo diferente. A energia deste lugar é contagiante, e sempre me deixa inspirada.`,
        `A atmosfera de ${context.location} é simplesmente única. Há uma magia aqui que não consigo explicar, mas que sinto em cada momento.`,
        `${capitalize(context.location)} tem uma energia que não se compara. Este lugar me ensina algo novo toda vez que venho.`,
      ],
      'en': [
        `There's something special about ${context.location}. The atmosphere, the people, the vibes - everything comes together perfectly. Each visit reveals a new layer of beauty and meaning.`,
        `${capitalize(context.location)} always surprises me in new ways. The atmosphere here is unique, and every moment brings a new discovery.`,
        `Every visit to ${context.location} reveals something different. The energy of this place is contagious, and it always leaves me inspired.`,
        `The atmosphere of ${context.location} is simply unique. There's a magic here that I can't explain, but I feel it in every moment.`,
        `${capitalize(context.location)} has an energy that can't be compared. This place teaches me something new every time I come.`,
      ],
      'es': [
        `Hay algo especial sobre ${context.location}. El ambiente, la gente, las vibes - todo se une perfectamente. Cada visita revela una nueva capa de belleza y significado.`,
        `${capitalize(context.location)} siempre me sorprende de formas nuevas. La atmósfera aquí es única, y cada momento trae un nuevo descubrimiento.`,
        `Cada visita a ${context.location} revela algo diferente. La energía de este lugar es contagiosa, y siempre me deja inspirada.`,
        `La atmósfera de ${context.location} es simplemente única. Hay una magia aquí que no puedo explicar, pero que siento en cada momento.`,
        `${capitalize(context.location)} tiene una energía que no se puede comparar. Este lugar me enseña algo nuevo cada vez que vengo.`,
      ],
      'fr': [
        `Il y a quelque chose de spécial à propos de ${context.location}. L'atmosphère, les gens, les vibes - tout se réunit parfaitement. Chaque visite révèle une nouvelle couche de beauté et de signification.`,
        `${capitalize(context.location)} me surprend toujours de nouvelles façons. L'atmosphère ici est unique, et chaque moment apporte une nouvelle découverte.`,
        `Chaque visite à ${context.location} révèle quelque chose de différent. L'énergie de cet endroit est contagieuse, et elle me laisse toujours inspirée.`,
        `L'atmosphère de ${context.location} est simplement unique. Il y a une magie ici que je ne peux pas expliquer, mais que je ressens à chaque moment.`,
        `${capitalize(context.location)} a une énergie qui ne peut pas être comparée. Cet endroit m'apprend quelque chose de nouveau à chaque fois que je viens.`,
      ],
    };
    const options = middleOptions[language];
    middle = options[Math.floor(Math.random() * options.length)];
  } else if (context.keywords.length > 0) {
    const keyword = capitalize(context.keywords[0]);
    const secondKeyword = context.keywords[1] || '';
    const middleOptions: Record<Language, string[]> = {
      'pt-br': [
        `Explorar ${keyword.toLowerCase()}${secondKeyword ? ` e ${secondKeyword}` : ''} abriu novas perspectivas. Há tanto para descobrir e aprender, e cada descoberta me deixa mais curiosa.`,
        `${capitalize(keyword)}${secondKeyword ? ` e ${secondKeyword}` : ''} me ensinou algo novo. A experiência foi tão rica e significativa que quero compartilhar com todos.`,
        `A experiência com ${keyword.toLowerCase()}${secondKeyword ? ` e ${secondKeyword}` : ''} foi transformadora. Cada detalhe, cada momento, cada sensação - tudo se conecta de forma perfeita.`,
        `${capitalize(keyword)}${secondKeyword ? ` e ${secondKeyword}` : ''} sempre me surpreende. Há uma profundidade aqui que não consigo explicar, mas que sinto em cada momento.`,
        `Descobrir ${keyword.toLowerCase()}${secondKeyword ? ` e ${secondKeyword}` : ''} foi revelador. Esta experiência me fez ver as coisas de uma perspectiva completamente nova.`,
      ],
      'en': [
        `Exploring ${keyword.toLowerCase()}${secondKeyword ? ` and ${secondKeyword}` : ''} opened up new perspectives. There's so much to discover and learn, and each discovery makes me more curious.`,
        `${capitalize(keyword)}${secondKeyword ? ` and ${secondKeyword}` : ''} taught me something new. The experience was so rich and meaningful that I want to share it with everyone.`,
        `The experience with ${keyword.toLowerCase()}${secondKeyword ? ` and ${secondKeyword}` : ''} was transformative. Every detail, every moment, every sensation - everything connects perfectly.`,
        `${capitalize(keyword)}${secondKeyword ? ` and ${secondKeyword}` : ''} always surprises me. There's a depth here that I can't explain, but I feel it in every moment.`,
        `Discovering ${keyword.toLowerCase()}${secondKeyword ? ` and ${secondKeyword}` : ''} was revealing. This experience made me see things from a completely new perspective.`,
      ],
      'es': [
        `Explorar ${keyword.toLowerCase()}${secondKeyword ? ` y ${secondKeyword}` : ''} abrió nuevas perspectivas. Hay tanto por descubrir y aprender, y cada descubrimiento me deja más curiosa.`,
        `${capitalize(keyword)}${secondKeyword ? ` y ${secondKeyword}` : ''} me enseñó algo nuevo. La experiencia fue tan rica y significativa que quiero compartirla con todos.`,
        `La experiencia con ${keyword.toLowerCase()}${secondKeyword ? ` y ${secondKeyword}` : ''} fue transformadora. Cada detalle, cada momento, cada sensación - todo se conecta perfectamente.`,
        `${capitalize(keyword)}${secondKeyword ? ` y ${secondKeyword}` : ''} siempre me sorprende. Hay una profundidad aquí que no puedo explicar, pero que siento en cada momento.`,
        `Descubrir ${keyword.toLowerCase()}${secondKeyword ? ` y ${secondKeyword}` : ''} fue revelador. Esta experiencia me hizo ver las cosas desde una perspectiva completamente nueva.`,
      ],
      'fr': [
        `Explorer ${keyword.toLowerCase()}${secondKeyword ? ` et ${secondKeyword}` : ''} a ouvert de nouvelles perspectives. Il y a tant à découvrir et apprendre, et chaque découverte me rend plus curieuse.`,
        `${capitalize(keyword)}${secondKeyword ? ` et ${secondKeyword}` : ''} m'a appris quelque chose de nouveau. L'expérience était si riche et significative que je veux la partager avec tout le monde.`,
        `L'expérience avec ${keyword.toLowerCase()}${secondKeyword ? ` et ${secondKeyword}` : ''} était transformative. Chaque détail, chaque moment, chaque sensation - tout se connecte parfaitement.`,
        `${capitalize(keyword)}${secondKeyword ? ` et ${secondKeyword}` : ''} me surprend toujours. Il y a une profondeur ici que je ne peux pas expliquer, mais que je ressens à chaque moment.`,
        `Découvrir ${keyword.toLowerCase()}${secondKeyword ? ` et ${secondKeyword}` : ''} était révélateur. Cette expérience m'a fait voir les choses sous un angle complètement nouveau.`,
      ],
    };
    const options = middleOptions[language];
    middle = options[Math.floor(Math.random() * options.length)];
  } else {
    const middleOptions: Record<Language, string[]> = {
      'pt-br': [
        `Esta experiência tem sido verdadeiramente significativa. Há algo especial sobre momentos como esses que nos lembram do que mais importa.`,
        `Cada momento traz algo novo para descobrir. A jornada continua e cada passo é importante na construção de memórias duradouras.`,
        `A beleza está nos detalhes, e cada experiência nos ensina algo valioso. Esta foi uma daquelas que vou guardar para sempre.`,
      ],
      'en': [
        `This experience has been truly meaningful. There's something special about moments like these that remind us what matters most.`,
        `Every moment brings something new to discover. The journey continues and every step matters in building lasting memories.`,
        `Beauty is in the details, and every experience teaches us something valuable. This was one of those I'll keep forever.`,
      ],
      'es': [
        `Esta experiencia ha sido verdaderamente significativa. Hay algo especial sobre momentos como estos que nos recuerdan lo que más importa.`,
        `Cada momento trae algo nuevo para descubrir. El viaje continúa y cada paso importa en la construcción de recuerdos duraderos.`,
        `La belleza está en los detalles, y cada experiencia nos enseña algo valioso. Esta fue una de esas que guardaré para siempre.`,
      ],
      'fr': [
        `Cette expérience a été vraiment significative. Il y a quelque chose de spécial à propos de moments comme ceux-ci qui nous rappellent ce qui compte le plus.`,
        `Chaque moment apporte quelque chose de nouveau à découvrir. Le voyage continue et chaque pas compte dans la construction de souvenirs durables.`,
        `La beauté est dans les détails, et chaque expérience nous apprend quelque chose de précieux. C'était l'une de celles que je garderai pour toujours.`,
      ],
    };
    const options = middleOptions[language];
    middle = options[Math.floor(Math.random() * options.length)];
  }

  // Outros expandidos
  const outros: Record<Language, Record<Tone, string[]>> = {
    'pt-br': {
      friendly: [
        '\n\nO que você acha? Adoraria ouvir você nos comentários! Não esqueça de salvar este post se achou útil. 💕',
        '\n\nMe conta o que você pensa abaixo! E se você gostou disso, dá um like e compartilha com alguém que possa achar útil. ✨',
        '\n\nDeixa um comentário e vamos conversar! Seu feedback significa muito para mim. 🌟',
        '\n\nO que você achou? Compartilhe sua experiência nos comentários! Adoraria saber o que você pensa. 💬',
        '\n\nVamos conversar! Deixa nos comentários o que você achou e se você já passou por algo parecido. 💕',
      ],
      professional: [
        '\n\nApreciaria seus pensamentos e feedback sobre este tópico. Vamos continuar a conversa nos comentários.',
        '\n\nQual é sua perspectiva? Sempre estou aberta a aprender e discutir diferentes pontos de vista.',
        '\n\nSinta-se à vontade para compartilhar seus insights ou perguntas abaixo. Ansiosa pela discussão.',
        '\n\nSua opinião é muito importante. Vamos engajar em uma conversa significativa sobre isso.',
        '\n\nO que você pensa sobre isso? Adoraria ouvir sua perspectiva profissional. 💼',
      ],
      funny: [
        '\n\nEnfim, essa é a verdade ☕️ O que você acha? Deixa seus pensamentos abaixo (sem mentira) 😂',
        '\n\nEntão é, isso aconteceu 💀 Pensamentos? Comentários? Preocupações? Me conta abaixo!',
        '\n\nFaz fazer sentido 🤷‍♀️ Mas sério, qual é a sua opinião sobre isso?',
        '\n\nA vida é uma caixinha de surpresas 💀 Me conta o que você acha!',
        '\n\nPlot twist: você vai comentar isso 😂 O que você pensa?',
      ],
      inspirational: [
        '\n\nO que está te inspirando agora? Compartilhe sua jornada nos comentários abaixo. ✨',
        '\n\nLembre-se: cada passo à frente é progresso. O que você está trabalhando para alcançar hoje? 🌟',
        '\n\nVamos apoiar o crescimento uns dos outros. Compartilhe o que você está aprendendo nos comentários! 💫',
        '\n\nQual é o seu próximo passo? Vamos crescer juntos e apoiar uns aos outros nessa jornada. ✨',
        '\n\nO que você está trabalhando para alcançar? Compartilhe seus objetivos e vamos nos motivar juntos! 🌟',
      ],
    },
    'en': {
      friendly: [
        '\n\nWhat are your thoughts? I\'d love to hear from you in the comments! Don\'t forget to save this post if you found it helpful. 💕',
        '\n\nLet me know what you think below! And if you enjoyed this, give it a like and share with someone who might find it useful. ✨',
        '\n\nDrop a comment and let\'s chat! Your feedback means the world to me. 🌟',
        '\n\nWhat did you think? Share your experience in the comments! I\'d love to know what you think. 💬',
        '\n\nLet\'s chat! Leave in the comments what you thought and if you\'ve been through something similar. 💕',
      ],
      professional: [
        '\n\nI\'d appreciate your thoughts and feedback on this topic. Let\'s continue the conversation in the comments.',
        '\n\nWhat\'s your perspective? I\'m always open to learning and discussing different viewpoints.',
        '\n\nFeel free to share your insights or questions below. Looking forward to the discussion.',
        '\n\nYour opinion is very important. Let\'s engage in a meaningful conversation about this.',
        '\n\nWhat do you think about this? I\'d love to hear your professional perspective. 💼',
      ],
      funny: [
        '\n\nAnyway, that\'s the tea ☕️ What do you think? Drop your thoughts below (no cap) 😂',
        '\n\nSo yeah, that happened 💀 Thoughts? Comments? Concerns? Let me know below!',
        '\n\nMake it make sense 🤷‍♀️ But fr, what\'s your take on this?',
        '\n\nLife is a box of surprises 💀 Tell me what you think!',
        '\n\nPlot twist: you\'re going to comment on this 😂 What do you think?',
      ],
      inspirational: [
        '\n\nWhat\'s inspiring you right now? Share your journey in the comments below. ✨',
        '\n\nRemember: every step forward is progress. What are you working towards today? 🌟',
        '\n\nLet\'s support each other\'s growth. Share what you\'re learning in the comments! 💫',
        '\n\nWhat\'s your next step? Let\'s grow together and support each other on this journey. ✨',
        '\n\nWhat are you working towards? Share your goals and let\'s motivate each other! 🌟',
      ],
    },
    'es': {
      friendly: [
        '\n\n¿Cuáles son tus pensamientos? ¡Me encantaría escucharte en los comentarios! No olvides guardar esta publicación si te resultó útil. 💕',
        '\n\n¡Déjame saber qué piensas abajo! Y si disfrutaste esto, dale un like y comparte con alguien que pueda encontrarlo útil. ✨',
        '\n\n¡Deja un comentario y charlemos! Tu feedback significa mucho para mí. 🌟',
        '\n\n¿Qué pensaste? ¡Comparte tu experiencia en los comentarios! Me encantaría saber qué piensas. 💬',
        '\n\n¡Charlemos! Deja en los comentarios lo que pensaste y si ya pasaste por algo similar. 💕',
      ],
      professional: [
        '\n\nApreciaría tus pensamientos y comentarios sobre este tema. Continuemos la conversación en los comentarios.',
        '\n\n¿Cuál es tu perspectiva? Siempre estoy abierta a aprender y discutir diferentes puntos de vista.',
        '\n\nSiéntete libre de compartir tus insights o preguntas abajo. Esperando la discusión.',
        '\n\nTu opinión es muy importante. Vamos a participar en una conversación significativa sobre esto.',
        '\n\n¿Qué piensas sobre esto? Me encantaría escuchar tu perspectiva profesional. 💼',
      ],
      funny: [
        '\n\nDe todos modos, esa es la verdad ☕️ ¿Qué piensas? Deja tus pensamientos abajo (sin mentiras) 😂',
        '\n\nAsí que sí, eso pasó 💀 ¿Pensamientos? ¿Comentarios? ¿Preocupaciones? ¡Déjame saber abajo!',
        '\n\nHaz que tenga sentido 🤷‍♀️ Pero en serio, ¿cuál es tu opinión sobre esto?',
        '\n\nLa vida es una caja de sorpresas 💀 ¡Dime qué piensas!',
        '\n\nGiro de trama: vas a comentar esto 😂 ¿Qué piensas?',
      ],
      inspirational: [
        '\n\n¿Qué te está inspirando ahora mismo? Comparte tu camino en los comentarios abajo. ✨',
        '\n\nRecuerda: cada paso adelante es progreso. ¿Hacia qué estás trabajando hoy? 🌟',
        '\n\nApoyemos el crecimiento mutuo. ¡Comparte lo que estás aprendiendo en los comentarios! 💫',
        '\n\n¿Cuál es tu próximo paso? Vamos a crecer juntos y apoyarnos mutuamente en este camino. ✨',
        '\n\n¿Hacia qué estás trabajando? ¡Comparte tus objetivos y motivémonos mutuamente! 🌟',
      ],
    },
    'fr': {
      friendly: [
        '\n\nQu\'en penses-tu ? J\'aimerais t\'entendre dans les commentaires ! N\'oublie pas de sauvegarder cette publication si tu l\'as trouvée utile. 💕',
        '\n\nFais-moi savoir ce que tu penses ci-dessous ! Et si tu as aimé ça, donne un like et partage avec quelqu\'un qui pourrait le trouver utile. ✨',
        '\n\nLaisse un commentaire et discutons ! Ton feedback signifie beaucoup pour moi. 🌟',
        '\n\nQu\'as-tu pensé ? Partage ton expérience dans les commentaires ! J\'aimerais savoir ce que tu penses. 💬',
        '\n\nDiscutons ! Laisse dans les commentaires ce que tu as pensé et si tu as vécu quelque chose de similaire. 💕',
      ],
      professional: [
        '\n\nJ\'apprécierais tes pensées et commentaires sur ce sujet. Continuons la conversation dans les commentaires.',
        '\n\nQuelle est ta perspective ? Je suis toujours ouverte à apprendre et discuter de différents points de vue.',
        '\n\nN\'hésite pas à partager tes insights ou questions ci-dessous. J\'attends la discussion.',
        '\n\nTon opinion est très importante. Participons à une conversation significative sur cela.',
        '\n\nQu\'en penses-tu ? J\'aimerais entendre ta perspective professionnelle. 💼',
      ],
      funny: [
        '\n\nBref, c\'est la vérité ☕️ Qu\'en penses-tu ? Laisse tes pensées ci-dessous (sans mentir) 😂',
        '\n\nAlors oui, ça s\'est passé 💀 Pensées ? Commentaires ? Préoccupations ? Fais-moi savoir ci-dessous !',
        '\n\nFais que ça ait du sens 🤷‍♀️ Mais sérieusement, quel est ton avis sur ça ?',
        '\n\nLa vie est une boîte de surprises 💀 Dis-moi ce que tu penses !',
        '\n\nRetournement de situation : tu vas commenter ça 😂 Qu\'en penses-tu ?',
      ],
      inspirational: [
        '\n\nQu\'est-ce qui t\'inspire en ce moment ? Partage ton parcours dans les commentaires ci-dessous. ✨',
        '\n\nRappelle-toi : chaque pas en avant est un progrès. Vers quoi travailles-tu aujourd\'hui ? 🌟',
        '\n\nSoutenons la croissance mutuelle. Partage ce que tu apprends dans les commentaires ! 💫',
        '\n\nQuel est ton prochain pas ? Grandissons ensemble et soutenons-nous mutuellement dans ce voyage. ✨',
        '\n\nVers quoi travailles-tu ? Partage tes objectifs et motivons-nous mutuellement ! 🌟',
      ],
    },
  };

  const outroOptions = outros[language][tone];
  const outro = outroOptions[Math.floor(Math.random() * outroOptions.length)];

  return intro + middle + outro;
};

/**
 * Generate reach hashtags - filtra palavras genéricas
 */
const generateReachHashtags = (context: ExtractedContext, language: Language): string[] => {
  // Usar palavras-chave relevantes (filtrar genéricas)
  const coreTags = context.keywords
    .filter(k => k.length > 3)
    .map(k => k.toLowerCase().replace(/[^\w]/g, ''))
    .filter(k => k.length > 0 && k.length < 25)
    .slice(0, 5);

  // Adicionar local se existir
  const locationTags: string[] = [];
  if (context.location) {
    const cleanLocation = context.location.toLowerCase().replace(/[^\w]/g, '');
    locationTags.push(cleanLocation);
    if (cleanLocation.includes('rio') || cleanLocation.includes('são paulo')) {
      locationTags.push('brasil', 'brazil');
    } else if (cleanLocation.includes('madrid') || cleanLocation.includes('barcelona')) {
      locationTags.push('espana', 'spain');
    } else if (cleanLocation.includes('paris')) {
      locationTags.push('france');
    }
  }

  const broadTags: Record<Language, string[]> = {
    'en': ['instagram', 'instagood', 'photooftheday', 'love', 'beautiful', 'happy', 'photography', 'instadaily', 'picoftheday', 'lifestyle', 'motivation', 'inspiration'],
    'es': ['instagram', 'instagood', 'fotodeldia', 'amor', 'hermoso', 'feliz', 'fotografia', 'instadaily', 'fotodeldia', 'estilodevida', 'motivacion', 'inspiracion'],
    'pt-br': ['instagram', 'instagood', 'fotodiaria', 'amor', 'lindo', 'feliz', 'fotografia', 'instadaily', 'fotodiaria', 'estilodevida', 'motivacao', 'inspiracao'],
    'fr': ['instagram', 'instagood', 'photodujour', 'amour', 'beau', 'heureux', 'photographie', 'instadaily', 'photodujour', 'stylevie', 'motivation', 'inspiration'],
  };

  const selected = [...new Set([...coreTags, ...locationTags, ...broadTags[language]])]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 12);

  return selected.map(tag => `#${tag}`);
};

/**
 * Generate niche hashtags - baseadas em palavras-chave do usuário
 */
const generateNicheHashtags = (context: ExtractedContext, language: Language): string[] => {
  // Usar palavras-chave principais do contexto
  const topicWords = context.keywords
    .filter(k => k.length > 4)
    .map(k => k.toLowerCase().replace(/[^\w]/g, ''))
    .filter(k => k.length > 2 && k.length < 25);

  const activityTags: string[] = [];
  if (context.activity) {
    const cleanActivity = context.activity.toLowerCase().replace(/[^\w]/g, '');
    activityTags.push(cleanActivity, `${cleanActivity}life`, `${cleanActivity}lovers`);
  }

  const locationTags: string[] = [];
  if (context.location) {
    const cleanLocation = context.location.toLowerCase().replace(/[^\w]/g, '');
    locationTags.push(cleanLocation, `${cleanLocation}life`, `${cleanLocation}vibes`);
  }

  // Tags baseadas em palavras-chave principais
  const keywordTags = topicWords
    .slice(0, 4)
    .flatMap(k => [`${k}lovers`, `${k}life`, `${k}community`])
    .filter(tag => tag.length > 3 && tag.length < 25);

  const combined = [...new Set([...topicWords, ...activityTags, ...locationTags, ...keywordTags])]
    .filter(tag => tag.length > 2 && tag.length < 30)
    .slice(0, 15);

  return combined.map(tag => `#${tag}`);
};

/**
 * Generate discovery hashtags
 */
const generateDiscoveryHashtags = (context: ExtractedContext, language: Language): string[] => {
  const discoveryTags: Record<Language, string[]> = {
    'en': ['discover', 'explorepage', 'trendingnow', 'viralcontent', 'mustsee', 'fyp', 'foryou', 'foryoupage', 'explore'],
    'es': ['descubrir', 'explorarpagina', 'tendencias', 'contenidoviral', 'debesver', 'fyp', 'parati', 'paratipagina', 'explorar'],
    'pt-br': ['descobrir', 'explorarpagina', 'tendencias', 'conteudoviral', 'devever', 'fyp', 'paravoce', 'paravocepagina', 'explorar'],
    'fr': ['decouvrir', 'explorerpage', 'tendances', 'contenuviral', 'avoirabsolument', 'fyp', 'pourtoi', 'pourtoipage', 'explorer'],
  };

  const keywordBased = context.keywords
    .slice(0, 3)
    .map(k => {
      const clean = k.toLowerCase().replace(/[^\w]/g, '');
      return [`${clean}lovers`, `${clean}life`, `${clean}community`];
    })
    .flat()
    .filter(k => k.length > 3 && k.length < 25);

  const selected = [...new Set([...keywordBased, ...discoveryTags[language]])]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

  return selected.map(tag => `#${tag}`);
};

/**
 * Validate and post-process generated content
 */
const validateAndPostProcess = (result: GeneratedContent): GeneratedContent => {
  // Remove duplicate hashtags
  const processedHashtags = {
    reach: [...new Set(result.hashtags.reach)],
    niche: [...new Set(result.hashtags.niche)],
    discovery: [...new Set(result.hashtags.discovery)],
  };

  // Ensure hashtags have proper format and filter out generic/invalid ones
  const sanitizeHashtags = (tags: string[]): string[] => {
    const genericHashtags = ['minha', 'meu', 'minhas', 'meus', 'foto', 'photo', 'imagem', 'image', 'pic', 'pics'];
    
    return tags
      .map(tag => {
        const clean = tag.replace(/^#+/, '').trim();
        if (clean.length === 0 || clean.length > 30) return null;
        // Remove invalid characters
        const valid = clean.replace(/[^\w]/g, '');
        // Filter out generic hashtags
        if (genericHashtags.includes(valid.toLowerCase())) return null;
        return valid.length > 0 ? `#${valid}` : null;
      })
      .filter((tag): tag is string => tag !== null);
  };

  // Clean captions (remove extra spaces, ensure proper formatting)
  const cleanCaption = (text: string): string => {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();
  };

  return {
    ...result,
    captions: {
      short: cleanCaption(result.captions.short),
      medium: cleanCaption(result.captions.medium),
      long: cleanCaption(result.captions.long),
    },
    hashtags: {
      reach: sanitizeHashtags(processedHashtags.reach).slice(0, 12),
      niche: sanitizeHashtags(processedHashtags.niche).slice(0, 15),
      discovery: sanitizeHashtags(processedHashtags.discovery).slice(0, 10),
    },
  };
};

// Legacy exports for backward compatibility
export const generateCaptions = (topic: string, tone: 'friendly' | 'professional' | 'funny' = 'friendly') => {
  const result = generateCaptionsAndHashtags(topic, tone, 'en');
  return result.captions;
};

export const generateHashtags = (topic: string) => {
  const result = generateCaptionsAndHashtags(topic, 'friendly', 'en');
  return result.hashtags;
};
