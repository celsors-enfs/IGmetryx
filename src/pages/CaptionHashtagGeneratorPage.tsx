import React, { useState } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { AdSlot } from '../ads/AdSlot';
import { ToolNavBar } from '../components/ToolNavBar';
import { ArrowUpRight, ChevronDown, Copy, Check, RefreshCw } from 'lucide-react';
import { generateCaptionsHashtags } from '../lib/api/captions-hashtags';
import type { Tone, Length } from '../lib/generation/dictionaries/types';
import { useLanguage } from '../contexts/LanguageContext';

export const CaptionHashtagGeneratorPage = () => {
  const { t, tx, language } = useLanguage();
  
  // Form state
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('friendly');
  const [length, setLength] = useState<Length>('medium');
  const [hashtagCount, setHashtagCount] = useState(15);
  
  // Results state
  const [captions, setCaptions] = useState<{ short: string; medium: string; long: string } | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setCaptions(null);
    setHashtags([]);
    
    try {
      const apiLanguage: 'pt-BR' | 'en' | 'es' | 'fr' = 
        language === 'pt-br' ? 'pt-BR' : 
        language === 'en' ? 'en' : 
        language === 'es' ? 'es' : 'fr';
      
      const response = await generateCaptionsHashtags({
        type: 'both',
        language: apiLanguage,
        tone: tone as any,
        length: length,
        hashtagCount: hashtagCount,
        topic: topic.trim(),
      });

      // Handle error response
      if (!response.ok || !response.result) {
        let errorMessage = response.error?.message;
        
        // Handle specific error codes
        if (response.error?.code === 'RATE_LIMITED' || response.error?.code === 'rate_limited') {
          // Use server message if available (already i18n), otherwise fallback
          if (response.error?.message) {
            errorMessage = response.error.message;
          } else {
            errorMessage = language === 'pt-br' 
              ? 'Muitas requisições. Por favor, tente novamente mais tarde.'
              : language === 'es'
              ? 'Demasiadas solicitudes. Por favor, inténtalo de nuevo más tarde.'
              : language === 'fr'
              ? 'Trop de requêtes. Veuillez réessayer plus tard.'
              : 'Too many requests. Please try again later.';
          }
        } else if (response.error?.code === 'NETWORK_ERROR') {
          errorMessage = t('api.unreachable');
        } else {
          errorMessage = errorMessage || (language === 'pt-br' 
            ? 'Algo deu errado ao gerar o conteúdo. Tente novamente em alguns segundos.'
            : language === 'es'
            ? 'Algo salió mal al generar el contenido. Inténtalo de nuevo en unos segundos.'
            : language === 'fr'
            ? 'Quelque chose s\'est mal passé lors de la génération du contenu. Réessayez dans quelques secondes.'
            : 'Something went wrong while generating content. Please try again in a few seconds.');
        }
        
        setError(errorMessage);
        return;
      }
      
      // Ensure hashtags are not empty when provider is deepseek
      if (response.result.hashtags.length === 0 && response.meta?.provider === 'deepseek') {
        console.warn('[Frontend] DeepSeek returned empty hashtags, retrying once...');
        // Retry once
        const retryResponse = await generateCaptionsHashtags({
          type: 'both',
          language: apiLanguage,
          tone: tone as any,
          length: length,
          hashtagCount: hashtagCount,
          topic: topic.trim(),
        });
        
        if (retryResponse.ok && retryResponse.result && retryResponse.result.hashtags.length > 0) {
          setCaptions(retryResponse.result.captions);
          setHashtags(retryResponse.result.hashtags);
          return;
        }
      }

      // Set results from standardized response
      setCaptions(response.result.captions);
      setHashtags(response.result.hashtags || []);
    } catch (err: any) {
      const errorMessage = err.message || (language === 'pt-br' 
        ? 'Algo deu errado ao gerar o conteúdo. Tente novamente em alguns segundos.'
        : language === 'es'
        ? 'Algo salió mal al generar el contenido. Inténtalo de nuevo en unos segundos.'
        : language === 'fr'
        ? 'Quelque chose s\'est mal passé lors de la génération du contenu. Réessayez dans quelques secondes.'
        : 'Something went wrong while generating content. Please try again in a few seconds.');
      
      setError(errorMessage);
      console.error('[Caption Generator Error]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (topic.trim()) {
      handleSubmit(new Event('submit') as any);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  const toneOptions: Tone[] = [
    'casual',
    'professional',
    'conversational',
    'friendly',
    'humorous',
    'inspirational',
    'creative',
    'engaging',
  ];

  const lengthOptions: Length[] = ['short', 'medium', 'long'];

  const faqData = [
    {
      question: t('caption.faq.q1') || 'How do I use this tool?',
      answer: t('caption.faq.a1') || 'Enter your topic, choose a tone and length, then click generate to get captions and hashtags.',
    },
    {
      question: t('caption.faq.q2') || 'What hashtag groups will I receive?',
      answer: t('caption.faq.a2') || 'You\'ll receive organized hashtag groups including Reach hashtags (broad audience), Niche hashtags (targeted audience), and Discovery hashtags (trending topics) to maximize your content\'s visibility.',
    },
    {
      question: t('caption.faq.q3') || 'Can I customize the generated content?',
      answer: t('caption.faq.a3') || 'Yes, all generated captions and hashtags are provided as suggestions. You can edit, combine, or customize them to match your voice and style.',
    },
    {
      question: t('caption.faq.q4') || 'Are the hashtags relevant to my content?',
      answer: t('caption.faq.a4') || 'Absolutely. Our system analyzes your topic and generates hashtags that are relevant, trending, and appropriate for your content type.',
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('caption.title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('caption.subtitle')}
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-20">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8">
              {/* Topic Input */}
              <div className="mb-6">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('caption.topic.label')}
                </label>
                <textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('caption.topic.placeholder')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t('caption.topic.helper')}
                </p>
              </div>

              {/* Tone Select */}
              <div className="mb-6">
                <label htmlFor="tone" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('caption.tone.label')}
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  {toneOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`caption.tone.${option}`) || option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Length Select */}
              <div className="mb-6">
                <label htmlFor="length" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('caption.length.label')}
                </label>
                <select
                  id="length"
                  value={length}
                  onChange={(e) => setLength(e.target.value as Length)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  {lengthOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`caption.length.${option}`) || option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hashtag Count Slider */}
              <div className="mb-6">
                <label htmlFor="hashtagCount" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('caption.hashtagsCount.label')}: {hashtagCount}
                </label>
                <input
                  type="range"
                  id="hashtagCount"
                  min="0"
                  max="30"
                  value={hashtagCount}
                  onChange={(e) => setHashtagCount(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t('caption.hashtagsCount.helper')}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {language === 'pt-br' ? 'Gerando...' : language === 'es' ? 'Generando...' : language === 'fr' ? 'Génération...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    {t('button.generate')} {t('caption.title').toLowerCase()}
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                      <ArrowUpRight className="w-5 h-5 text-black" />
                    </div>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {captions && (
            <div className="max-w-4xl mx-auto mb-20 space-y-8">
              {/* Captions Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {t('caption.result.title') || 'Generated Captions'}
                  </h2>
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {t('caption.regenerate') || 'Regenerate'}
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Short Caption */}
                  {captions.short && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          {t('caption.ui.short')}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(captions.short, 'caption-short')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {copied === 'caption-short' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied === 'caption-short' ? t('button.copied') : t('button.copy')}
                        </button>
                      </div>
                      <p className="text-gray-900 whitespace-pre-line">{captions.short}</p>
                    </div>
                  )}

                  {/* Medium Caption */}
                  {captions.medium && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          {t('caption.ui.medium')}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(captions.medium, 'caption-medium')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {copied === 'caption-medium' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied === 'caption-medium' ? t('button.copied') : t('button.copy')}
                        </button>
                      </div>
                      <p className="text-gray-900 whitespace-pre-line">{captions.medium}</p>
                    </div>
                  )}

                  {/* Long Caption */}
                  {captions.long && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          {t('caption.ui.long')}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(captions.long, 'caption-long')}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {copied === 'caption-long' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied === 'caption-long' ? t('button.copied') : t('button.copy')}
                        </button>
                      </div>
                      <p className="text-gray-900 whitespace-pre-line">{captions.long}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hashtags Section */}
              {hashtags.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    {t('caption.result.hashtags') || 'Generated Hashtags'}
                  </h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {hashtags.length} {hashtags.length === 1 ? 'hashtag' : 'hashtags'}
                      </p>
                      <button
                        onClick={() => copyToClipboard(hashtags.join(' '), 'hashtags-all')}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {copied === 'hashtags-all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied === 'hashtags-all' ? t('button.copied') : t('button.copy')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.map((tag, index) => (
                        <span key={index} className="inline-block bg-white px-3 py-1 rounded-lg text-sm text-gray-900 border border-gray-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          {captions && (
            <div className="max-w-4xl mx-auto mb-20 px-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-600 text-center">
                  {t('caption.disclaimer.text')} {t('caption.disclaimer.affiliation')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Why This Helps Section */}
      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {tx('caption.whyThisHelps.title')}
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('caption.whyThisHelps.item1.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('caption.whyThisHelps.item1.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('caption.whyThisHelps.item2.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('caption.whyThisHelps.item2.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('caption.whyThisHelps.item3.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('caption.whyThisHelps.item3.description')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600 mt-1">•</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {t('caption.whyThisHelps.item4.title')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('caption.whyThisHelps.item4.description')}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-12 bg-white">
        <ToolNavBar />
      </section>
      <AdSlot type="banner-468x60" />

      {/* How It Works Section */}
      <section className="relative px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">
              {tx('caption.howItWorks.title')}
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('caption.howItWorks.subtitle')}
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
                  {t('caption.howItWorks.step1Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('caption.howItWorks.step1')}
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
                  {t('caption.howItWorks.step2Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('caption.howItWorks.step2')}
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
                  {t('caption.howItWorks.step3Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('caption.howItWorks.step3')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
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
              {t('caption.faq.subtitle') || 'Frequently asked questions about caption and hashtag generation.'}
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

      <AdSlot type="banner-728x90" />
      <AdSlot type="banner-468x60" />
      <FooterSection />
    </div>
  );
};
