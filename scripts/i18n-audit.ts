import { rawTranslations } from '../src/contexts/LanguageContext';

type Translations = typeof rawTranslations;
type Language = keyof Translations;

const BASE_LOCALE: Language = 'en';

function runAudit() {
  const base = rawTranslations[BASE_LOCALE];
  const baseKeys = Object.keys(base);

  let hasIssues = false;

  for (const locale of Object.keys(rawTranslations) as Language[]) {
    if (locale === BASE_LOCALE) continue;

    const target = rawTranslations[locale];
    const missing: string[] = [];
    const empty: string[] = [];

    for (const key of baseKeys) {
      const value = target[key];
      if (value === undefined) {
        missing.push(key);
      } else if (value.trim().length === 0) {
        empty.push(key);
      }
    }

    if (missing.length || empty.length) {
      hasIssues = true;
      // eslint-disable-next-line no-console
      console.log(`\nLocale "${locale}" issues:`);
      if (missing.length) {
        // eslint-disable-next-line no-console
        console.log('  Missing keys:');
        for (const key of missing) {
          // eslint-disable-next-line no-console
          console.log(`    - ${key}`);
        }
      }
      if (empty.length) {
        // eslint-disable-next-line no-console
        console.log('  Empty values:');
        for (const key of empty) {
          // eslint-disable-next-line no-console
          console.log(`    - ${key}`);
        }
      }
    }
  }

  if (hasIssues) {
    // eslint-disable-next-line no-console
    console.error('\n[i18n-audit] Missing or empty translations detected.');
    process.exit(1);
  } else {
    // eslint-disable-next-line no-console
    console.log('[i18n-audit] All locales have full coverage.');
  }
}

runAudit();




