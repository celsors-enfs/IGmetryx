/**
 * Routes configuration for sitemap generation
 * Single source of truth for all routes in the app
 */

export const routes = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'weekly',
    description: 'Homepage'
  },
  {
    path: '/instagram',
    priority: 0.9,
    changefreq: 'weekly',
    description: 'Instagram tools hub'
  },
  {
    path: '/instagram/profile-analyzer',
    priority: 0.8,
    changefreq: 'weekly',
    description: 'Profile Analyzer tool'
  },
  {
    path: '/instagram/caption-hashtag-generator',
    priority: 0.8,
    changefreq: 'weekly',
    description: 'Caption & Hashtag Generator tool'
  },
  {
    path: '/instagram/bio-generator',
    priority: 0.8,
    changefreq: 'weekly',
    description: 'Bio Generator tool'
  },
  {
    path: '/instagram/reel-cover-generator',
    priority: 0.8,
    changefreq: 'weekly',
    description: 'Reel Cover Generator tool'
  },
  {
    path: '/instagram/feed-analyzer',
    priority: 0.8,
    changefreq: 'weekly',
    description: 'Feed Analyzer tool'
  },
  {
    path: '/about',
    priority: 0.5,
    changefreq: 'monthly',
    description: 'About page'
  },
  {
    path: '/contact',
    priority: 0.5,
    changefreq: 'monthly',
    description: 'Contact page'
  },
  {
    path: '/privacy-policy',
    priority: 0.3,
    changefreq: 'yearly',
    description: 'Privacy Policy'
  },
  {
    path: '/terms-of-service',
    priority: 0.3,
    changefreq: 'yearly',
    description: 'Terms of Service'
  }
];

// Supported languages
export const languages = [
  { code: 'en', hreflang: 'en' },
  { code: 'pt-br', hreflang: 'pt-BR' },
  { code: 'es', hreflang: 'es' },
  { code: 'fr', hreflang: 'fr' }
];

// Base URL
export const baseUrl = 'https://igmetryx.com';

