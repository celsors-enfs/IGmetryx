import React, { useState } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { ToolNavBar } from '../components/ToolNavBar';
import { ArrowUpRight, ChevronDown, Copy, Check } from 'lucide-react';
import { generateBios, generateCTALines } from '../lib/bioGenerator';
import { useLanguage } from '../contexts/LanguageContext';

export const BioGeneratorPage = () => {
  const { t, tx } = useLanguage();
  const [whatYouDo, setWhatYouDo] = useState('');
  const [whoYouHelp, setWhoYouHelp] = useState('');
  const [differentiator, setDifferentiator] = useState('');
  const [bios, setBios] = useState<string[]>([]);
  const [ctaLines, setCTALines] = useState<string[]>([]);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedBios = generateBios(whatYouDo, whoYouHelp, differentiator);
    const generatedCTAs = generateCTALines();
    setBios(generatedBios);
    setCTALines(generatedCTAs);
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const faqData = [
    {
      question: t('bio.faq.q1'),
      answer: t('bio.faq.a1'),
    },
    {
      question: t('bio.faq.q2'),
      answer: t('bio.faq.a2'),
    },
    {
      question: t('bio.faq.q3'),
      answer: t('bio.faq.a3'),
    },
    {
      question: t('bio.faq.q4'),
      answer: t('bio.faq.a4'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('bio.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('bio.subtitle')}
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-20">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="mb-6">
                <label htmlFor="whatYouDo" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('bio.whatYouDo.label')}
                </label>
                <input
                  type="text"
                  id="whatYouDo"
                  value={whatYouDo}
                  onChange={(e) => setWhatYouDo(e.target.value)}
                  placeholder={t('bio.whatYouDo.placeholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="whoYouHelp" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('bio.whoYouHelp.label')}
                </label>
                <input
                  type="text"
                  id="whoYouHelp"
                  value={whoYouHelp}
                  onChange={(e) => setWhoYouHelp(e.target.value)}
                  placeholder={t('bio.whoYouHelp.placeholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="differentiator" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('bio.differentiator.label')}
                </label>
                <input
                  type="text"
                  id="differentiator"
                  value={differentiator}
                  onChange={(e) => setDifferentiator(e.target.value)}
                  placeholder={t('bio.differentiator.placeholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 w-full justify-center"
              >
                {t('button.generate')} {t('bio.result.title').toLowerCase()}
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="w-5 h-5 text-black" />
                </div>
              </button>
            </form>
          </div>

          {/* Results */}
          {bios.length > 0 && (
            <div className="max-w-4xl mx-auto mb-20 space-y-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('bio.result.title')}</h2>
                
                <div className="space-y-6">
                  {bios.map((bio, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Option {index + 1}</span>
                        <button
                          onClick={() => copyToClipboard(bio, `bio-${index}`)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                        {copied === `bio-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied === `bio-${index}` ? t('button.copied') : t('button.copy')}
                        </button>
                      </div>
                      <p className="text-gray-900 whitespace-pre-line">{bio}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('bio.result.cta')}</h2>
                <p className="text-sm text-gray-600 mb-4">{t('bio.result.ctaHelper') || 'Add one of these to the end of your bio:'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ctaLines.map((cta, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-900 text-sm">{cta}</span>
                      <button
                        onClick={() => copyToClipboard(cta, `cta-${index}`)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {copied === `cta-${index}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied === `cta-${index}` ? t('button.copied') : t('button.copy')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Why This Helps Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {tx('bio.whyThisHelps.title')}
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('bio.whyThisHelps.item1.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('bio.whyThisHelps.item1.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('bio.whyThisHelps.item2.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('bio.whyThisHelps.item2.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('bio.whyThisHelps.item3.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('bio.whyThisHelps.item3.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('bio.whyThisHelps.item4.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('bio.whyThisHelps.item4.description')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('bio.whyThisHelps.item5.title')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('bio.whyThisHelps.item5.description')}
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <ToolNavBar />

      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {tx('bio.howItWorks.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('bio.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[180px] font-bold text-purple-100/40 leading-none select-none">
                1
              </div>
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-purple-600 mb-6 leading-none" style={{ fontWeight: "400" }}>
                  01
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                  fontWeight: "400",
                  letterSpacing: "-0.05em",
                  fontSize: "34px"
                }}>
                  {t('bio.howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('bio.howItWorks.step1.description')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[180px] font-bold text-blue-100/40 leading-none select-none">
                2
              </div>
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-blue-600 mb-6 leading-none" style={{ fontWeight: "400" }}>
                  02
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                  fontWeight: "400",
                  letterSpacing: "-0.05em",
                  fontSize: "34px"
                }}>
                  {t('bio.howItWorks.step2.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('bio.howItWorks.step2.description')}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              <div className="absolute top-4 right-4 text-[180px] font-bold text-emerald-100/40 leading-none select-none">
                3
              </div>
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-emerald-600 mb-6 leading-none" style={{ fontWeight: "400" }}>
                  03
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                  fontWeight: "400",
                  letterSpacing: "-0.05em",
                  fontSize: "34px"
                }}>
                  {t('bio.howItWorks.step3.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('bio.howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {t('faq.badge') || 'FAQ'}
            </div>
            <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {t('faq.title.main') || t('faq.title')}{' '}
              <span
                className="font-serif italic font-light text-gray-600"
                style={{
                  fontFamily: 'Noto Serif Display',
                  fontWeight: '200',
                }}
              >
                {t('faq.title.highlight') || ''}
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('bio.faq.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300">
                <button onClick={() => toggleFAQ(index)} className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors duration-200">
                  <span className="text-lg md:text-xl font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-6 h-6 text-gray-500 shrink-0 transition-transform duration-300 ${openFAQIndex === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFAQIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 md:px-8 pb-6 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limitations Notice */}
      <div className="max-w-4xl mx-auto mb-20 px-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {tx('bio.limitations.title')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('bio.limitations.item1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('bio.limitations.item2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('bio.limitations.item3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>{t('bio.limitations.item4')}</span>
            </li>
          </ul>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};
