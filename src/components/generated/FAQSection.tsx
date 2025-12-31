"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
type FAQSectionProps = Record<string, never>;
export const FAQSection = (props: FAQSectionProps) => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const faqData = [{
    question: t('faq.question1'),
    answer: t('faq.answer1')
  }, {
    question: t('faq.question2'),
    answer: t('faq.answer2')
  }, {
    question: t('faq.question3'),
    answer: t('faq.answer3')
  }, {
    question: t('faq.question4'),
    answer: t('faq.answer4')
  }, {
    question: t('faq.question5'),
    answer: t('faq.answer5')
  }, {
    question: t('faq.question6'),
    answer: t('faq.answer6')
  }] as any[];
  return <section className="relative px-4 py-20 md:py-32" id="faq">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            FAQ
          </div>
          <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-gray-900 mb-4">
            {t('faq.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqData.map((faq, index) => <div key={index} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300">
              <button onClick={() => toggleFAQ(index)} className="w-full px-6 md:px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors duration-200">
                <span className="text-lg md:text-xl font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <ChevronDown className={`w-6 h-6 text-gray-500 shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 md:px-8 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>)}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">{t('faq.cta.question')}</p>
          <Link to="/contact" className="group bg-[#4F46E5] text-white px-8 py-3 rounded-full text-base font-medium hover:bg-[#4338ca] transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25 inline-block">
            {t('faq.cta.button')}
          </Link>
        </div>
      </div>
    </section>;
};