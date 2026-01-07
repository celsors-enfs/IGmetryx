"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCaptions = generateCaptions;
const dictionaries_1 = require("./dictionaries");
const captions_1 = require("./templates/captions");
function generateCaptions(input, locale, tone, length, extracted) {
    const dict = dictionaries_1.DICTS[locale];
    const nicheDict = dict.niche[extracted.detectedNiche];
    // Map extended tones to base tones for hooks
    const toneMap = {
        "casual": "friendly",
        "conversational": "friendly",
        "friendly": "friendly",
        "humorous": "funny",
        "funny": "funny",
        "sarcastic": "funny",
        "professional": "professional",
        "authoritative": "professional",
        "motivational": "motivational",
        "inspirational": "motivational",
        "emotional": "motivational",
        "storytelling": "motivational",
        "creative": "motivational",
        "engaging": "friendly",
        "luxury": "luxury",
        "educational": "educational",
    };
    const baseTone = toneMap[tone] || "friendly";
    // Pick hook, transition, closer, CTA
    const seed = input.length + tone.length;
    const hook = dict.hooks[baseTone][seed % dict.hooks[baseTone].length];
    const transition = dict.transitions[seed % dict.transitions.length];
    const closer = dict.closers[seed % dict.closers.length];
    const cta = dict.ctas.engage[seed % dict.ctas.engage.length];
    // Use niche emojis if available
    const emojis = nicheDict.emojis || ["✨", "📌", "💬"];
    // Build context
    const ctx = {
        hook,
        keywords: extracted.keywords,
        context: extracted.context,
        transition,
        closer,
        cta,
        emojis,
        includeEmojis: baseTone === "friendly" || baseTone === "motivational" || tone === "humorous" || tone === "creative",
    };
    // Generate 3 variants
    const variantA = captions_1.captionTemplates.A(locale, tone, length, ctx, seed);
    const variantB = captions_1.captionTemplates.B(locale, tone, length, ctx, seed + 1);
    const variantC = captions_1.captionTemplates.C(locale, tone, length, ctx, seed + 2);
    return { variantA, variantB, variantC };
}
