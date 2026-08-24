// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import path from 'path';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://portal.traumainformedschools.co.uk',
  output: 'server',
  integrations: [react(), sitemap()],
  adapter: netlify(),
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    }
  }
});