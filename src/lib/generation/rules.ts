export const FORBIDDEN_GENERIC_TAGS = new Set([
  "#love","#instagood","#follow","#like","#viral","#trending","#fyp","#explorepage"
]);

export function sanitizeHashtag(tag: string) {
  const t = tag
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .replace(/^_+|_+$/g, "");
  return t ? `#${t}` : "";
}

export function uniqueKeepOrder(tags: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (!t) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}




