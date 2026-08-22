import { compression } from 'vite-plugin-compression2';
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import { execSync } from 'child_process';

const shouldUploadSentrySourcemaps = process.env.SENTRY_UPLOAD_SOURCEMAPS === 'true';
const shouldAnalyzeBundle = process.env.ANALYZE === 'true';

// Translation bundling plugin
function translationBundlePlugin() {
  return {
    name: 'translation-bundle',
    buildStart() {
      // Generate translation bundles before build starts
      try {
        execSync('node scripts/bundle-translations.js', { stdio: 'inherit' });
      } catch (error) {
        throw error;
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    translationBundlePlugin(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    } as any),
    ...(shouldUploadSentrySourcemaps
      ? [
          sentryVitePlugin({
            org: 'blitzedout',
            project: 'javascript-react',
            // Only needed if thirdPartyErrorFilterIntegration is reinstated in
            // services/sentry.ts — see the note there. This plugin is opt-in, so
            // that filter must not depend on it.
            applicationKey: 'blitzed-out',
          }),
        ]
      : []),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      strategies: 'generateSW',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.(?:mp3|mp4|webm|ogg|wav|flac|aac)$/i],
        skipWaiting: false,
        clientsClaim: false,
      },
      devOptions: {
        enabled: false,
      },
    }),
    // Enable both Brotli and Gzip compression
    compression({
      algorithms: ['gzip', 'brotliCompress'],
      exclude: [/\.(br|gz)$/],
      threshold: 1024, // Only compress files > 1KB
    }),
    // Bundle composition report — opt-in via `ANALYZE=true npm run build`
    ...(shouldAnalyzeBundle
      ? [
          visualizer({
            filename: 'bundle-stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  server: {
    host: '0.0.0.0', // Allow access from network (including Android emulator)
    // Reduce HTTP/2 server push overhead in dev
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  build: {
    rollupOptions: {
      output: {
        // Add format configuration for better Safari compatibility
        format: 'es',
        // Oxc's minify options live on the output object, not `build.minify`
        // — a sibling `rolldownOptions` block would override `rollupOptions`
        // wholesale and silently drop `manualChunks`.
        //
        // `dropConsole` only reaches dependency code now: every app-side call
        // goes through `utils/logger`, which reads `console[level]` computed and
        // so survives the pass — `?debug=1` still works in production.
        minify: {
          compress: { dropConsole: true },
          mangle: true,
        },
        manualChunks: (id) => {
          if (!id.includes('node_modules/')) return;

          // Chunk mapping: pattern -> chunk name
          const chunkMap: [string[], string][] = [
            [['react/', 'react-dom/'], 'react-core'],
            [['@mui/icons-material/'], 'mui-icons'],
            [['@mui/x-date-pickers/'], 'mui-date'],
            [
              [
                '@mui/material/',
                '@mui/system/',
                '@mui/utils/',
                '@mui/private-theming/',
                '@mui/styled-engine/',
              ],
              'mui',
            ],
            [['@emotion/'], 'emotion'],
            [['react-router'], 'router'],
            [['i18next', 'react-i18next'], 'i18n'],
            [['firebase/', '@firebase/'], 'firebase'],
            [['zustand/'], 'state'],
            [['dexie'], 'db'],
            [['dayjs/', 'nanoid/', 'clsx/', 'js-sha256/'], 'utils'],
          ];

          for (const [patterns, chunk] of chunkMap) {
            if (patterns.some((p) => id.includes(`node_modules/${p}`))) {
              return chunk;
            }
          }
        },
        // Optimize chunk sizes
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.name || assetInfo.names?.[0] || 'asset';
          const info = fileName.split('.');
          const extType = info[info.length - 1] || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(extType || '')) {
            return `fonts/[name]-[hash][extname]`;
          }
          if (/mp3|wav|ogg/i.test(extType || '')) {
            return `audio/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Target compatible browsers for Safari iOS compatibility
    target: ['es2018', 'safari15', 'ios15'],

    // Enable CSS code splitting for better caching
    cssCodeSplit: true,

    // Optimize chunk size for better tree shaking
    chunkSizeWarningLimit: 1000,

    // Enable advanced minification for smaller bundles
    // Oxc (Vite 8's default) over terser: same job in ~1/3 the wall time and
    // ~1/5 the CPU, for +0.2% brotli. Terser's `mangle.safari10` went with it —
    // the build target is safari15. See `rollupOptions.output.minify` for the
    // console stripping terser used to do.
    minify: 'oxc',

    // Enhanced compatibility settings for iOS Safari
    modulePreload: {
      polyfill: true,
    },

    // Inline more assets to reduce HTTP requests
    // Inline assets < 16KB
    assetsInlineLimit: 16384,

    sourcemap: true,
  },
  optimizeDeps: {
    include: [
      // Pre-bundle all heavy dependencies
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      '@emotion/react',
      '@emotion/styled',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector',
      'i18next-resources-to-backend',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/database',
      'firebase/storage',
      'zustand',
      'dexie',
      'dexie-react-hooks',
      'dayjs',
      'dayjs/plugin/relativeTime',
      'dayjs/locale/es',
      'dayjs/locale/fr',
      'dayjs/locale/zh-cn',
      'dayjs/locale/hi',
      'react-markdown',
      'remark-gfm',
      'remark-gemoji',
      'react-router-dom',
      'clsx',
      'nanoid',
      'js-sha256',
    ],
    // Force pre-bundling for faster dev server
    force: true,
  },
  assetsInclude: ['**/*.mp3'],
});
