import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart3, MessageSquare, User, ImageIcon, Grid3x3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
type HeroSectionProps = Record<string, never>;

// @component: HeroSection
export const HeroSection = (props: HeroSectionProps) => {
  const { t } = useLanguage();
  // @return
  return <div className="relative min-h-screen w-full bg-white font-sans selection:bg-rose-100 overflow-hidden pt-20">
      {/* Background Flares */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left Flare - Pink */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-rose-400/15 rounded-full blur-3xl" />
        
        {/* Top Right Flare - Hot Pink */}
        <div className="absolute top-40 -right-32 w-[500px] h-[500px] bg-pink-400/14 rounded-full blur-3xl" />
        
        {/* Center Left Flare - Deep Pink */}
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-rose-500/13 rounded-full blur-3xl" />
        
        {/* Bottom Center Flare - Pink */}
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-pink-500/14 rounded-full blur-3xl" />
        
        {/* Accent Yellow/Orange Flares - Balanced */}
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-yellow-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-amber-400/12 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-orange-400/13 rounded-full blur-3xl" />
        
        {/* Additional flares for services section */}
        <div className="absolute bottom-1/4 -right-40 w-[450px] h-[450px] bg-purple-400/12 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-rose-400/14 rounded-full blur-3xl" />
      </div>

      {/* Hero Content */}
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1]" style={{
          fontFamily: "",
          marginBottom: "0px",
          paddingRight: "0px",
          paddingBottom: "0px"
        }}>{t('home.hero.titleLine1')}<br /></h1>

          {/* Second H1 */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 mb-6 leading-[1.1]" style={{
          fontStyle: "italic",
          marginBottom: "0px",
          marginRight: "0px",
          fontFamily: "Noto Serif Display",
          fontWeight: "200"
        }}>{t('home.hero.titleLine2')}</h1>

          {/* Tagline Box */}
          <div className="bg-white border border-gray-200 rounded-2xl px-8 py-4 mb-8 inline-block" style={{
          borderTopWidth: "0px",
          borderRightWidth: "0px",
          borderBottomWidth: "0px",
          borderLeftWidth: "0px",
          borderStyle: "none",
          borderRadius: "16px"
        }}>
            <p className="text-base md:text-lg text-gray-700 font-medium" style={{
            fontSize: "96px",
            fontWeight: "400",
            fontStyle: "normal",
            color: "#101828",
            paddingBottom: "0px",
            paddingTop: "20px",
            paddingRight: "0px",
            paddingLeft: "0px",
            display: "none"
          }}>
              Your tagline goes here
            </p>
          </div>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed font-light">
            {t('home.hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Link to="/instagram/profile-analyzer" className="group bg-[#1a1a1a] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-black transition-all duration-300 flex items-center gap-3 hover:scale-105" style={{
            background: "#4338ca",
            boxShadow: "0px 0.03px 0px 0px rgba(0, 0, 0, 0.2), 0px 0.03px 0px 0px rgba(0, 0, 0, 0.2)"
          }}>
              {t('home.cta.primary')}
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                <ArrowUpRight className="w-5 h-5 text-black" style={{
                background: "rgb(7 7 7 / 0)"
              }} />
              </div>
            </Link>

            <Link to="/instagram/caption-hashtag-generator" className="group bg-white text-gray-900 pl-6 pr-2 py-2 rounded-full text-base font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-300 flex items-center gap-3 hover:scale-105" style={{
            borderTopWidth: "1px",
            borderTopColor: "#4338ca",
            borderRightWidth: "1px",
            borderRightColor: "#4338ca",
            borderBottomWidth: "1px",
            borderBottomColor: "#4338ca",
            borderLeftWidth: "1px",
            borderLeftColor: "#4338ca",
            borderStyle: "solid",
            borderRadius: "3.35544e+07px"
          }}>
              {t('home.cta.secondary')}
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 border border-gray-200">
                <ArrowUpRight className="w-5 h-5 text-black" />
              </div>
            </Link>
          </div>

          {/* Tool Cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-32" id="tools">
            {/* Profile Analyzer */}
            <Link to="/instagram/profile-analyzer" className="bg-rose-50/80 border border-rose-100 rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 block" style={{
            paddingBottom: "24px",
            paddingTop: "24px",
            paddingLeft: "24px",
            marginTop: "40px",
            marginBottom: "0px"
          }}>
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{
              fontSize: "28px",
              fontFamily: "Inter",
              fontWeight: "500",
              letterSpacing: "-0.05em"
            }}>{t('home.tool.profile.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('home.tool.profile.description')}
              </p>
            </Link>

            {/* Caption & Hashtag Generator */}
            <Link to="/instagram/caption-hashtag-generator" className="bg-pink-50/80 border border-pink-100 rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 block" style={{
            marginTop: "40px",
            marginBottom: "0px"
          }}>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: "28px",
              letterSpacing: "-0.05em",
              lineHeight: "1"
            }}>{t('home.tool.caption.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('home.tool.caption.description')}
              </p>
            </Link>

            {/* Bio Generator */}
            <Link to="/instagram/bio-generator" className="bg-blue-50/80 border border-blue-100 rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 block" style={{
            marginTop: "40px",
            marginBottom: "0px"
          }}>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: "28px",
              letterSpacing: "-0.05em"
            }}>{t('home.tool.bio.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('home.tool.bio.description')}
              </p>
            </Link>

            {/* Reel Cover Generator */}
            <Link to="/instagram/reel-cover-generator" className="bg-yellow-50/80 border border-yellow-100 rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 block" style={{
            marginTop: "40px",
            marginBottom: "0px"
          }}>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: "28px",
              letterSpacing: "-0.05em",
              lineHeight: "1"
            }}>{t('home.tool.reel.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('home.tool.reel.description')}
              </p>
            </Link>

            {/* Feed Analyzer */}
            <Link to="/instagram/feed-analyzer" className="bg-green-50/80 border border-green-100 rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 block" style={{
            marginTop: "40px",
            marginBottom: "0px"
          }}>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Grid3x3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: "28px",
              letterSpacing: "-0.05em",
              lineHeight: "1"
            }}>{t('home.tool.feed.title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('home.tool.feed.description')}
              </p>
            </Link>
          </div>
        </div>
      </main>

      {/* How IGMETRYX Works Section */}
      <section className="relative px-4 py-20 bg-white" style={{
      paddingTop: "0px",
      paddingLeft: "16px"
    }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-gray-900 mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              {/* Background number watermark */}
              <div className="absolute top-4 right-4 text-[180px] font-bold text-purple-100/40 leading-none select-none">
                1
              </div>
              
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-purple-600 mb-6 leading-none" style={{
                fontWeight: "400"
              }}>
                  01
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                fontWeight: "400",
                letterSpacing: "-0.05em",
                fontSize: "34px"
              }}>{t('home.howItWorks.step1.title')}</h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('home.howItWorks.step1.description')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              {/* Background number watermark */}
              <div className="absolute top-4 right-4 text-[180px] font-bold text-blue-100/40 leading-none select-none">
                2
              </div>
              
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-blue-600 mb-6 leading-none" style={{
                fontWeight: "400"
              }}>
                  02
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                fontWeight: "400",
                letterSpacing: "-0.05em",
                fontSize: "34px"
              }}>{t('home.howItWorks.step2.title')}</h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('home.howItWorks.step2.description')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-8 md:p-10 text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
              {/* Background number watermark */}
              <div className="absolute top-4 right-4 text-[180px] font-bold text-emerald-100/40 leading-none select-none">
                3
              </div>
              
              <div className="relative z-10">
                <div className="text-7xl md:text-8xl font-bold text-emerald-600 mb-6 leading-none" style={{
                fontWeight: "400"
              }}>
                  03
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 leading-tight" style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
                fontWeight: "400",
                letterSpacing: "-0.05em",
                fontSize: "34px"
              }}>{t('home.howItWorks.step3.title')}</h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {t('home.howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Do Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-gray-900 mb-4">{t('home.whatYouCanDo.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.whatYouCanDo.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Profile Analysis */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">{t('home.whatYouCanDo.profile.title')}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t('home.whatYouCanDo.profile.description')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-700">{t('home.whatYouCanDo.profile.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-700">{t('home.whatYouCanDo.profile.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-700">{t('home.whatYouCanDo.profile.item3')}</span>
                </li>
              </ul>
            </div>

            {/* Content Generation */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">{t('home.whatYouCanDo.content.title')}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t('home.whatYouCanDo.content.description')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-700">{t('home.whatYouCanDo.content.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-700">{t('home.whatYouCanDo.content.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-700">{t('home.whatYouCanDo.content.item3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>;
};