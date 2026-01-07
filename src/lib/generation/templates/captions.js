"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captionTemplates = void 0;
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
const joinKw = (kws, n) => kws.slice(0, n).join(", ");
const e = (ctx, s) => ctx.includeEmojis && ctx.emojis.length ? `${s} ${pick(ctx.emojis, s.length)}` : s;
exports.captionTemplates = {
    A: (locale, tone, length, ctx, seed) => {
        const kw = joinKw(ctx.keywords, 2);
        const loc = ctx.context.location ? ` (${ctx.context.location})` : "";
        if (length === "short") {
            return e(ctx, `${ctx.hook} ${kw ? `${ctx.transition} ${kw}.` : ""}${loc}`) + `\n\n${ctx.closer}`;
        }
        if (length === "medium") {
            return e(ctx, `${ctx.hook}`) +
                `\n${kw ? `${ctx.transition} ${kw}.` : ""}${loc}` +
                `\n\n${ctx.cta}`;
        }
        return e(ctx, `${ctx.hook}`) +
            `\n${kw ? `${ctx.transition} ${kw}.` : ""}${loc}` +
            `\n\n${locale.startsWith("pt") ? "O que eu quero guardar disso:" :
                locale === "es" ? "Lo que quiero guardar de esto:" :
                    locale === "fr" ? "Ce que je veux retenir :" :
                        "What I want to keep from this:"}` +
            `\n• ${ctx.keywords[0] ? ctx.keywords[0] : ""}` +
            `\n• ${ctx.keywords[1] ? ctx.keywords[1] : ""}` +
            `\n\n${ctx.cta}\n${ctx.closer}`;
    },
    B: (locale, tone, length, ctx, seed) => {
        const k1 = ctx.keywords[0] ?? "";
        const k2 = ctx.keywords[1] ?? "";
        const title = locale.startsWith("pt") ? "Dica rápida:" :
            locale === "es" ? "Tip rápido:" :
                locale === "fr" ? "Astuce rapide :" :
                    "Quick tip:";
        const step = locale.startsWith("pt") ? "Como fazer:" :
            locale === "es" ? "Cómo hacerlo:" :
                locale === "fr" ? "Comment faire :" :
                    "How to:";
        if (length === "short") {
            return `${title} ${k1 ? k1 : ctx.hook}\n${ctx.cta}`;
        }
        if (length === "medium") {
            return `${title} ${k1 ? k1 : ctx.hook}\n${step} ${k2 ? k2 : joinKw(ctx.keywords, 3)}.\n\n${ctx.closer}`;
        }
        return `${title} ${k1 ? k1 : ctx.hook}\n` +
            `${step} ${joinKw(ctx.keywords, 4)}.\n\n` +
            `${ctx.cta}\n${ctx.closer}`;
    },
    C: (locale, tone, length, ctx, seed) => {
        const kw = joinKw(ctx.keywords, 3);
        const opener = locale.startsWith("pt") ? "Direto ao ponto:" :
            locale === "es" ? "Al grano:" :
                locale === "fr" ? "Allons droit au but :" :
                    "Straight to it:";
        if (length === "short") {
            return `${opener} ${kw ? kw : ctx.hook}\n${ctx.cta}`;
        }
        if (length === "medium") {
            return `${opener} ${kw ? kw : ctx.hook}\n\n${ctx.cta}\n${ctx.closer}`;
        }
        return `${opener} ${kw ? kw : ctx.hook}\n\n${ctx.cta}\n${ctx.closer}`;
    },
};
