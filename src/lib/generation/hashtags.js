"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHashtags = generateHashtags;
const dictionaries_1 = require("./dictionaries");
const rules_1 = require("./rules");
function generateHashtags(input, locale, count, extracted) {
    if (count === 0) {
        return { brand: [], niche: [], context: [], mid: [] };
    }
    const dict = dictionaries_1.DICTS[locale];
    const nicheDict = dict.niche[extracted.detectedNiche];
    // Brand hashtags (from keywords, max 3)
    const brand = extracted.keywords
        .slice(0, 3)
        .map(k => (0, rules_1.sanitizeHashtag)(k))
        .filter(t => t && !rules_1.FORBIDDEN_GENERIC_TAGS.has(t.toLowerCase()));
    // Niche hashtags (from detected niche)
    const niche = nicheDict.hashtags
        .slice(0, Math.ceil(count * 0.4))
        .map(rules_1.sanitizeHashtag)
        .filter(t => t && !rules_1.FORBIDDEN_GENERIC_TAGS.has(t.toLowerCase()));
    // Context hashtags (location-based)
    const context = [];
    if (extracted.context.location) {
        const loc = extracted.context.location.toLowerCase().replace(/[^\w]/g, "");
        context.push((0, rules_1.sanitizeHashtag)(loc));
        if (locale === "pt-BR" && (loc.includes("rio") || loc.includes("são paulo"))) {
            context.push((0, rules_1.sanitizeHashtag)("brasil"));
        }
    }
    // Mid-reach hashtags
    const mid = nicheDict.midTags
        .slice(0, Math.ceil(count * 0.3))
        .map(rules_1.sanitizeHashtag)
        .filter(t => t && !rules_1.FORBIDDEN_GENERIC_TAGS.has(t.toLowerCase()));
    // Combine and limit to count
    const all = (0, rules_1.uniqueKeepOrder)([...brand, ...niche, ...context, ...mid]);
    const limited = all.slice(0, count);
    // Redistribute to maintain proportions
    const brandCount = Math.min(brand.length, Math.ceil(limited.length * 0.15));
    const nicheCount = Math.ceil(limited.length * 0.4);
    const contextCount = Math.min(context.length, Math.ceil(limited.length * 0.1));
    const midCount = limited.length - brandCount - nicheCount - contextCount;
    return {
        brand: limited.slice(0, brandCount),
        niche: limited.slice(brandCount, brandCount + nicheCount),
        context: limited.slice(brandCount + nicheCount, brandCount + nicheCount + contextCount),
        mid: limited.slice(brandCount + nicheCount + contextCount),
    };
}
