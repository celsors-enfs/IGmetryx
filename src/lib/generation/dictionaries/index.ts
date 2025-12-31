export { ptBR } from "./pt-BR";
export { en } from "./en";
export { es } from "./es";
export { fr } from "./fr";

import { ptBR } from "./pt-BR";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import type { Locale, LocaleDict } from "./types";

export const DICTS: Record<Locale, LocaleDict> = {
  "pt-BR": ptBR,
  "en": en,
  "es": es,
  "fr": fr,
};



