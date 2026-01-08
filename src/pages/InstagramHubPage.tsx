import React from 'react';
import { Link } from 'react-router-dom';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { AdBanner468x60 } from '../components/AdBanner468x60';
import { AdBanner728x90 } from '../components/AdBanner728x90';
import { BarChart3, MessageSquare, User, ImageIcon, Grid3x3, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const InstagramHubPage = () => {
  const { t } = useLanguage();
  const tools = [
    {
      icon: BarChart3,
      title: t('home.tool.profile.title'),
      description: t('home.tool.profile.description'),
      href: '/instagram/profile-analyzer',
      color: 'rose'
    },
    {
      icon: MessageSquare,
      title: t('home.tool.caption.title'),
      description: t('home.tool.caption.description'),
      href: '/instagram/caption-hashtag-generator',
      color: 'pink'
    },
    {
      icon: User,
      title: t('home.tool.bio.title'),
      description: t('home.tool.bio.description'),
      href: '/instagram/bio-generator',
      color: 'blue'
    },
    {
      icon: ImageIcon,
      title: t('home.tool.reel.title'),
      description: t('home.tool.reel.description'),
      href: '/instagram/reel-cover-generator',
      color: 'yellow'
    },
    {
      icon: Grid3x3,
      title: t('home.tool.feed.title') || 'Feed Analyzer',
      description: t('home.tool.feed.description') || 'Understand how your Instagram feed looks as a visual grid and how to improve it.',
      href: '/instagram/feed-analyzer',
      color: 'green'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      {/* Intro Section */}
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
            {t('hub.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed font-light">
            {t('hub.subtitle')}
          </p>
        </div>
      </main>

      {/* Tools Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const colorClasses = {
                rose: 'bg-rose-50/80 border-rose-100',
                pink: 'bg-pink-50/80 border-pink-100',
                blue: 'bg-blue-50/80 border-blue-100',
                yellow: 'bg-yellow-50/80 border-yellow-100',
                green: 'bg-green-50/80 border-green-100',
                purple: 'bg-purple-50/80 border-purple-100'
              };
              const iconColorClasses = {
                rose: 'bg-rose-100 text-rose-600',
                pink: 'bg-pink-100 text-pink-600',
                blue: 'bg-blue-100 text-blue-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                green: 'bg-green-100 text-green-600',
                purple: 'bg-purple-100 text-purple-600'
              };

              return (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className={`${colorClasses[tool.color as keyof typeof colorClasses]} border rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 block`}
                >
                  <div className={`w-12 h-12 ${iconColorClasses[tool.color as keyof typeof iconColorClasses]} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{
                    fontSize: "28px",
                    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    fontWeight: "500",
                    letterSpacing: "-0.05em"
                  }}>
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    {t('hub.getStarted')}
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <AdBanner728x90 />
      <AdBanner468x60 />
      <FooterSection />
    </div>
  );
};


