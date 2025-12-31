import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
type NavigationHeaderProps = Record<string, never>;
const navigationLinks = [{
  label: 'Home',
  href: '/',
  key: 'nav.home'
}, {
  label: 'Tools',
  href: '/instagram',
  key: 'nav.tools'
}, {
  label: 'About',
  href: '/about',
  key: 'nav.about'
}, {
  label: 'Contact',
  href: '/contact',
  key: 'nav.contact'
}] as any[];

const languages = [
  { code: 'en' as const, label: 'English', native: 'EN' },
  { code: 'es' as const, label: 'Español', native: 'ES' },
  { code: 'pt-br' as const, label: 'Português (Brasil)', native: 'PT-BR' },
  { code: 'fr' as const, label: 'Français', native: 'FR' },
];

export const NavigationHeader = (props: NavigationHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = React.useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  
  return <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 bg-white/80 backdrop-blur-md" style={{
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "16px",
      paddingRight: "16px"
    }}>
        <div className="w-full max-w-[1400px] flex items-center justify-between" style={{
        paddingTop: "0px",
        paddingBottom: "0px",
        paddingLeft: "0px",
        paddingRight: "0px",
        flexDirection: "row"
      }}>
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo-igmetryx.png" 
              alt="IGmetryx" 
              className="h-[30px] w-auto object-contain"
            />
          </Link>

          {/* Navigation Pill - Desktop */}
          <nav className="hidden lg:flex items-center bg-gray-100/50 backdrop-blur-md rounded-full px-1 py-1 shadow-sm border border-white/20">
            {navigationLinks.map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <Link key={link.label} to={link.href} className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}>
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>

          {/* Language Dropdown - Desktop (replaces CTA) */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all duration-300"
            >
              <Globe className="w-4 h-4" />
              <span>{languages.find(l => l.code === language)?.native || 'EN'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${languageMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {languageMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLanguageMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-40 min-w-[180px]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLanguageMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        language === lang.code
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden w-10 h-10 bg-gray-100/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-gray-200/50 transition-colors" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-5 h-5 text-gray-900" /> : <Menu className="w-5 h-5 text-gray-900" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

          {/* Menu Panel */}
          <div className="absolute top-24 left-4 right-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
            <nav className="flex flex-col p-2">
              {navigationLinks.map((link, i) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link key={link.label} to={link.href} className={`px-6 py-4 text-base font-medium rounded-2xl transition-all duration-300 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} onClick={() => setMobileMenuOpen(false)}>
                    {t(link.key)}
                  </Link>
                );
              })}
              
              {/* Mobile Language Selector (replaces CTA) */}
              <div className="px-4 pt-4 pb-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 px-4 mb-2">Language / Idioma / Langue</p>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${
                        language === lang.code
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>}
    </>;
};