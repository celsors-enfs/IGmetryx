import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const TOOL_LINKS = [
  { path: '/instagram/profile-analyzer', key: 'tool.profile_analyzer' },
  { path: '/instagram/caption-hashtag-generator', key: 'tool.caption_generator' },
  { path: '/instagram/bio-generator', key: 'tool.bio_generator' },
  { path: '/instagram/reel-cover-generator', key: 'tool.reel_cover' },
  { path: '/instagram/feed-analyzer', key: 'tool.feed_analyzer' },
] as const;

export const ToolNavBar: React.FC = () => {
  const location = useLocation();
  const { tx } = useLanguage();

  return (
    <nav className="-mt-12 mb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
          {TOOL_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tx(link.key)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};


