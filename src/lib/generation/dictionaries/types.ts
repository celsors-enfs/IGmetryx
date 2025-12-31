export type Locale = "pt-BR" | "en" | "es" | "fr";
export type BaseTone = "friendly" | "professional" | "funny" | "motivational" | "luxury" | "educational";
export type Tone = BaseTone | "casual" | "conversational" | "humorous" | "authoritative" | "sarcastic" | "emotional" | "storytelling" | "creative" | "engaging" | "inspirational";
export type Length = "short" | "medium" | "long";

export type NicheId =
  | "general"
  | "travel"
  | "food"
  | "fitness"
  | "beauty"
  | "fashion"
  | "business"
  | "photography"
  | "education"
  | "music"
  | "art"
  | "tech"
  | "realestate"
  | "pets"
  | "parenting";

export type NicheDict = {
  id: NicheId;
  vocab: string[];
  hashtags: string[];
  midTags: string[];
  emojis?: string[];
};

export type LocaleDict = {
  locale: Locale;
  stopwords: string[];
  ui: {
    variantA: string;
    variantB: string;
    variantC: string;
    groupBrand: string;
    groupNiche: string;
    groupContext: string;
    groupMid: string;
  };
  hooks: Record<BaseTone, string[]>;
  transitions: string[];
  closers: string[];
  ctas: Record<"engage" | "sell" | "inform" | "community", string[]>;
  niche: Record<NicheId, NicheDict>;
};

