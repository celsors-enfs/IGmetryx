import React from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { useLanguage } from '../contexts/LanguageContext';

type LegalType = 'privacy' | 'terms';

interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalContent {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

// Eagerly import all legal JSON content for each locale.
const privacyModules = import.meta.glob('../content/legal/*/privacy.json', {
  eager: true,
}) as Record<string, any>;

const termsModules = import.meta.glob('../content/legal/*/terms.json', {
  eager: true,
}) as Record<string, any>;

type LegalContentByLocale = Record<
  string,
  {
    privacy?: LegalContent;
    terms?: LegalContent;
  }
>;

const LEGAL_CONTENT: LegalContentByLocale = {};

for (const [path, mod] of Object.entries(privacyModules)) {
  const match = path.match(/legal\/([^/]+)\/privacy\.json$/);
  if (!match) continue;
  const locale = match[1];
  const moduleValue = mod as any;
  const content = (moduleValue.default ?? moduleValue) as LegalContent;
  if (!LEGAL_CONTENT[locale]) LEGAL_CONTENT[locale] = {};
  LEGAL_CONTENT[locale].privacy = content;
}

for (const [path, mod] of Object.entries(termsModules)) {
  const match = path.match(/legal\/([^/]+)\/terms\.json$/);
  if (!match) continue;
  const locale = match[1];
  const moduleValue = mod as any;
  const content = (moduleValue.default ?? moduleValue) as LegalContent;
  if (!LEGAL_CONTENT[locale]) LEGAL_CONTENT[locale] = {};
  LEGAL_CONTENT[locale].terms = content;
}

function getLocaleTag(language: string): string {
  if (language === 'pt-br') return 'pt-BR';
  if (language === 'es') return 'es-ES';
  if (language === 'fr') return 'fr-FR';
  return 'en-US';
}

interface LegalPageProps {
  type: LegalType;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const { t, language } = useLanguage();

  const localeKey = language;
  const localeContent = LEGAL_CONTENT[localeKey]?.[type];
  const fallbackContent = LEGAL_CONTENT['en']?.[type];

  const usingFallback = !localeContent && localeKey !== 'en' && !!fallbackContent;
  const content = localeContent ?? fallbackContent;

  if (!content) {
    return (
      <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
        <NavigationHeader />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              {t('legal.unavailable')}
            </h1>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const date = new Date(content.updatedAt);
  const formattedDate = isNaN(date.getTime())
    ? content.updatedAt
    : date.toLocaleDateString(getLocaleTag(language), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const titleKey = type === 'privacy' ? 'privacy.title' : 'terms.title';
  const updatedKey = type === 'privacy' ? 'privacy.lastUpdated' : 'terms.lastUpdated';

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t(titleKey)}
            </h1>
            <p className="text-sm text-gray-500">
              {t(updatedKey)}{' '}
              <span className="font-medium text-gray-700">{formattedDate}</span>
            </p>
            {usingFallback && (
              <p className="mt-3 text-xs text-amber-600">
                {t('legal.translationReview')}
              </p>
            )}
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-10 text-gray-700 leading-relaxed">
              {content.sections.map((section) => (
                <section key={section.heading}>
                  <h2
                    className="text-3xl font-semibold text-gray-900 mb-4"
                    style={{
                      fontFamily:
                        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontWeight: 400,
                      letterSpacing: '-0.05em',
                    }}
                  >
                    {section.heading}
                  </h2>
                  {section.body.map((paragraph, index) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};


