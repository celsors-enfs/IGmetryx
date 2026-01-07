"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAll = generateAll;
const keyword_extract_1 = require("./keyword-extract");
const captions_1 = require("./captions");
const hashtags_1 = require("./hashtags");
function generateAll(input, locale, tone, length, hashtagCount) {
    // Normalize locale (already normalized, just use as-is)
    const normalizedLocale = locale;
    // Extract keywords and detect niche
    const extracted = (0, keyword_extract_1.extractKeywords)(input, normalizedLocale);
    // Generate captions
    const captions = (0, captions_1.generateCaptions)(input, normalizedLocale, tone, length, extracted);
    // Generate hashtags
    const hashtags = (0, hashtags_1.generateHashtags)(input, normalizedLocale, hashtagCount, extracted);
    return {
        captions,
        hashtags,
        detectedNiche: extracted.detectedNiche,
        confidence: extracted.confidence,
    };
}
