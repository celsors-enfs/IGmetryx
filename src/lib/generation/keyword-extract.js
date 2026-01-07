"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKeywords = extractKeywords;
const dictionaries_1 = require("./dictionaries");
const LOCATION_PATTERNS = {
    "pt-BR": [
        /rio|são paulo|brasília|salvador|curitiba|porto alegre|recife|belo horizonte|fortaleza|manaus|corcovado|cristo redentor|ipanema|copacabana|pão de açúcar|sugarloaf/gi,
        /brasil|brazil/gi,
    ],
    "en": [
        /rio|paris|london|new york|tokyo|barcelona|amsterdam|berlin|miami|los angeles|san francisco|sydney|melbourne|dubai|singapore|corcovado|christ the redeemer|sugarloaf/gi,
    ],
    "es": [
        /madrid|barcelona|buenos aires|méxico|ciudad de méxico|valencia|sevilla|bogotá|lima|santiago|montevideo|corcovado/gi,
        /españa|spain/gi,
    ],
    "fr": [
        /paris|lyon|marseille|toulouse|nice|nantes|strasbourg|montpellier|bordeaux|canada|québec|montréal/gi,
        /france/gi,
    ],
};
function extractKeywords(input, locale) {
    const text = input.toLowerCase().trim();
    const dict = dictionaries_1.DICTS[locale];
    const stopwords = new Set(dict.stopwords);
    // Extract words (preserve accents)
    const words = text
        .replace(/[^\w\s\u00C0-\u017F]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2)
        .filter(w => !stopwords.has(w));
    // Detect location
    let location;
    for (const pattern of LOCATION_PATTERNS[locale]) {
        const match = input.match(pattern);
        if (match) {
            location = match[0];
            break;
        }
    }
    // Detect niche by matching vocab
    let detectedNiche = "general";
    let maxMatches = 0;
    for (const [nicheId, nicheDict] of Object.entries(dict.niche)) {
        const vocab = nicheDict.vocab;
        const matches = vocab.filter(v => text.includes(v)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedNiche = nicheId;
        }
    }
    const confidence = maxMatches > 0 ? Math.min(maxMatches / 3, 1) : 0.3;
    // Filter keywords (remove generic words)
    const genericWords = {
        "pt-BR": ["foto", "imagem", "fotografia", "minha", "meu", "minhas", "meus", "este", "esta", "coisa", "coisas"],
        "en": ["photo", "picture", "image", "pic", "my", "mine", "this", "that", "thing", "stuff"],
        "es": ["foto", "imagen", "fotografía", "mi", "mía", "este", "esta", "cosa", "cosas"],
        "fr": ["photo", "image", "photographie", "mon", "ma", "mes", "ce", "cette", "chose", "choses"],
    };
    const relevantKeywords = words
        .filter(w => !genericWords[locale].includes(w))
        .slice(0, 10);
    return {
        keywords: relevantKeywords,
        context: {
            location,
        },
        detectedNiche,
        confidence,
    };
}
