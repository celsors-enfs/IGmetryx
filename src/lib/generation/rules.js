"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORBIDDEN_GENERIC_TAGS = void 0;
exports.sanitizeHashtag = sanitizeHashtag;
exports.uniqueKeepOrder = uniqueKeepOrder;
exports.FORBIDDEN_GENERIC_TAGS = new Set([
    "#love", "#instagood", "#follow", "#like", "#viral", "#trending", "#fyp", "#explorepage"
]);
function sanitizeHashtag(tag) {
    const t = tag
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_]/gu, "")
        .replace(/^_+|_+$/g, "");
    return t ? `#${t}` : "";
}
function uniqueKeepOrder(tags) {
    const seen = new Set();
    const out = [];
    for (const t of tags) {
        const key = t.toLowerCase();
        if (!t)
            continue;
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(t);
    }
    return out;
}
