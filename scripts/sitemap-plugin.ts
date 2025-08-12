import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

export function sitemapPlugin(): Plugin {
  return {
    name: 'sitemap-updater',
    generateBundle() {
      // Get the current date in ISO format (YYYY-MM-DD)
      const currentDate = new Date().toISOString().split('T')[0];

      // Path to the sitemap file
      const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');

      try {
        // Read the current sitemap
        let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

        // Replace all hardcoded lastmod dates with the current date
        const updatedSitemap = sitemapContent.replace(
          /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g,
          `<lastmod>${currentDate}</lastmod>`
        );

        // Write the updated sitemap back
        fs.writeFileSync(sitemapPath, updatedSitemap, 'utf8');

        console.log(`✓ Sitemap updated with lastmod: ${currentDate}`);
      } catch (error) {
        console.warn('Warning: Could not update sitemap lastmod dates:', error);
      }
    },
  };
}
