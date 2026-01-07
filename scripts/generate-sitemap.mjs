#!/usr/bin/env node
/**
 * Generate sitemap.xml for IGmetryx
 * 
 * This script generates a sitemap with all routes and hreflang alternates.
 * Since the app uses client-side language switching (not URL-based),
 * all hreflang tags point to the same canonical URL.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { routes, languages, baseUrl } from './routes.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true });

// Get current date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Generate sitemap XML
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  for (const route of routes) {
    const fullUrl = `${baseUrl}${route.path}`;
    
    xml += `  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
`;

    // Add hreflang alternates for all languages
    // Since the app uses client-side language switching, all point to the same URL
    for (const lang of languages) {
      xml += `    <xhtml:link rel="alternate" hreflang="${lang.hreflang}" href="${escapeXml(fullUrl)}" />
`;
    }
    
    // Add x-default pointing to English version
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(fullUrl)}" />
`;

    xml += `  </url>
`;
  }

  xml += `</urlset>
`;

  return xml;
}

// Escape XML special characters
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Write sitemap
try {
  const sitemapXml = generateSitemap();
  const sitemapPath = join(publicDir, 'sitemap.xml');
  writeFileSync(sitemapPath, sitemapXml, 'utf8');
  console.log(`✅ Sitemap generated: ${sitemapPath}`);
  console.log(`   Routes: ${routes.length}`);
  console.log(`   Languages: ${languages.length}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}


