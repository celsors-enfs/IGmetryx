"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
type AboutCTASectionProps = Record<string, never>;
export const AboutCTASection = (props: AboutCTASectionProps) => {
  const { t } = useLanguage();
  return <section className="relative px-4 py-32 md:py-40 overflow-hidden bg-gray-950" id="about">
      {/* Colored Flares Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Purple flare - top left */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
        {/* Blue flare - top right */}
        <div className="absolute top-20 right-0 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl" />
        {/* Pink flare - bottom left */}
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl" />
        {/* Cyan flare - bottom right */}
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-5xl mx-auto">
        {/* Main Content */}
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-white mb-8 leading-[1.1] px-4">
            {t('aboutCta.title')}{' '}
            <span className="font-serif italic font-light text-gray-300" style={{
            fontFamily: 'Noto Serif Display',
            fontWeight: '300'
          }}>
              {t('aboutCta.titleItalic')}
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-light px-4">
            {t('aboutCta.description')}
          </p>

          {/* CTA Button */}
          <Link to="/instagram" className="group bg-[#1a1a1a] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-black transition-all duration-300 flex items-center gap-3 mx-auto hover:scale-105 inline-flex">
            {t('cta.start_tracking')}
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
              <ArrowUpRight className="w-5 h-5 text-black" />
            </div>
          </Link>
        </div>
      </div>
    </section>;
};