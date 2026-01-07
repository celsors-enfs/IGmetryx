import React from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { AdBanner468x60 } from '../components/AdBanner468x60';
import { AdBanner728x90 } from '../components/AdBanner728x90';
import { useLanguage } from '../contexts/LanguageContext';

export const AboutPage = () => {
  const { t } = useLanguage();
  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      <AdBanner728x90 />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('nav.about')} IGmetryx
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8 text-gray-700 leading-relaxed">
              <p className="text-lg md:text-xl text-gray-600 font-light">
                {t('about.intro')}
              </p>

              <p>
                {t('about.belief')}
              </p>

              <p>
                {t('about.privacy')}
              </p>

              <h2 className="text-3xl font-semibold text-gray-900 mt-12 mb-6" style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                fontWeight: "400",
                letterSpacing: "-0.05em"
              }}>
                {t('about.creators.title')}
              </h2>

              <p>
                {t('about.creators.text1')}
              </p>

              <p>
                {t('about.creators.text2')}
              </p>

              <h2 className="text-3xl font-semibold text-gray-900 mt-12 mb-6" style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                fontWeight: "400",
                letterSpacing: "-0.05em"
              }}>
                {t('about.commitment.title')}
              </h2>

              <p>
                {t('about.commitment.text')}
              </p>
            </div>
          </div>
        </div>
      </main>

      <AdBanner468x60 />
      <FooterSection />
    </div>
  );
};


