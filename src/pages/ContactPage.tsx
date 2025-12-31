import React, { useState } from 'react';
import { NavigationHeader } from '../components/generated/NavigationHeader';
import { FooterSection } from '../components/generated/FooterSection';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const ContactPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be implemented later
    window.location.href = `mailto:support@igmetryx.com?subject=Contact from ${formData.name}&body=${encodeURIComponent(formData.message)}`;
  };

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden pt-20">
      <NavigationHeader />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-gray-900 leading-[1.1] mb-6">
              {t('nav.contact')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
              {t('footer.company.response')}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8">
              <div className="mb-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.name')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('contact.form.namePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('contact.form.messagePlaceholder')}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="group bg-[#4338ca] text-white pl-6 pr-2 py-2 rounded-full text-base font-medium hover:bg-[#3730a3] transition-all duration-300 flex items-center gap-3 hover:scale-105 w-full justify-center"
              >
                {t('button.send')}
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="w-5 h-5 text-black" />
                </div>
              </button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">{t('contact.orEmail')}</p>
              <a href="mailto:support@igmetryx.com" className="text-[#4338ca] hover:text-[#3730a3] font-medium">
                support@igmetryx.com
              </a>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};


