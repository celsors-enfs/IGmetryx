"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Instagram, Dribbble } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
type FooterSectionProps = Record<string, never>;
const sitemapLinks = [{
  label: 'Profile Analyzer',
  href: '/instagram/profile-analyzer'
}, {
  label: 'Caption & Hashtag Generator',
  href: '/instagram/caption-hashtag-generator'
}, {
  label: 'Bio Generator',
  href: '/instagram/bio-generator'
}, {
  label: 'Reel Cover Generator',
  href: '/instagram/reel-cover-generator'
}, {
  label: 'Feed Analyzer',
  href: '/instagram/feed-analyzer'
}] as any[];
const resourcesLinks = [{
  label: "Privacy Policy",
  href: '/privacy-policy'
}, {
  label: "Terms of Service",
  href: '/terms-of-service'
}] as any[];
const footerLinks = [{
  label: 'Privacy Policy',
  href: '/privacy-policy'
}, {
  label: 'Terms of Service',
  href: '/terms-of-service'
}] as any[];
export const FooterSection = (props: FooterSectionProps) => {
  const { t } = useLanguage();
  return <footer className="relative bg-white px-4 pt-20 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            {/* Logo */}
            <Link to="/" className="flex items-center mb-6">
              <img 
                src="/logo-igmetryx.png" 
                alt="IGmetryx" 
                className="h-[30px] w-auto object-contain"
              />
            </Link>

            {/* Tagline */}
            <p className="text-gray-600 leading-relaxed mb-8 max-w-xs">{t('footer.tagline')}</p>

            {/* Social Icons - Hidden by default via feature flag */}
            {import.meta.env.VITE_SHOW_SOCIAL === 'true' && (
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Twitter">
                  <Twitter className="w-5 h-5 text-gray-700" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5 text-gray-700" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5 text-gray-700" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="Dribbble" style={{
                display: "none"
              }}>
                  <Dribbble className="w-5 h-5 text-gray-700" />
                </a>
              </div>
            )}
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-3">
            <h3 className="text-gray-900 font-semibold text-lg mb-6">{t('footer.tools.title')}</h3>
            <ul className="space-y-4">
              {sitemapLinks.map(link => {
                let labelKey: string | null = null;
                if (link.href === '/instagram/profile-analyzer') {
                  labelKey = 'tool.profile_analyzer';
                } else if (link.href === '/instagram/caption-hashtag-generator') {
                  labelKey = 'tool.caption_generator';
                } else if (link.href === '/instagram/bio-generator') {
                  labelKey = 'tool.bio_generator';
                } else if (link.href === '/instagram/reel-cover-generator') {
                  labelKey = 'tool.reel_cover';
                } else if (link.href === '/instagram/feed-analyzer') {
                  labelKey = 'home.tool.feed.title';
                }
                return (
                  <li key={link.label}>
                    <Link to={link.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                      {labelKey ? (t(labelKey) || link.label) : link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="lg:col-span-2">
            <h3 className="text-gray-900 font-semibold text-lg mb-6">{t('footer.legal.title')}</h3>
            <ul className="space-y-4">
              {resourcesLinks.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {link.href === '/privacy-policy' ? t('footer.legal.privacy') || link.label : t('footer.legal.terms') || link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="lg:col-span-3">
            <h3 className="text-gray-900 font-semibold text-lg mb-6">{t('footer.company.title')}</h3>
            <ul className="space-y-4 text-gray-600">
              <li>
                <Link to="/about" className="hover:text-gray-900 transition-colors">{t('nav.about')}</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gray-900 transition-colors">{t('nav.contact')}</Link>
              </li>
              <li className="text-sm text-gray-500">{t('footer.company.response')}</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-gray-600 text-sm">{t('footer.copyright')}</p>

            {/* Footer Links */}
            <div className="flex items-center gap-6">
              {footerLinks.map(link => <Link key={link.label} to={link.href} className="text-gray-600 text-sm hover:text-gray-900 transition-colors">
                  {link.href === '/privacy-policy' ? t('footer.legal.privacy') || link.label : t('footer.legal.terms') || link.label}
                </Link>)}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            <strong>{t('common.limitations')}:</strong> {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>;
};