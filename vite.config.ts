import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sitemapPlugin } from './scripts/sitemap-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    } as any),
    sentryVitePlugin({
      org: 'blitzedout',
      project: 'javascript-react',
    }),
    sitemapPlugin(),
  ],
  server: {
    host: '0.0.0.0', // Allow access from network (including Android emulator)
    https: false, // Explicitly disable HTTPS
    // Reduce HTTP/2 server push overhead in dev
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Use '@' as an alias for 'src'
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  build: {
    rollupOptions: {
      output: {
        // Add format configuration for better Safari compatibility
        format: 'es',
        // Ensure proper module declaration for Safari
        generatedCode: {
          constBindings: true,
          objectShorthand: false, // Avoid object shorthand for better compatibility
        },
        manualChunks: {
          // Bundle core libraries together for faster loading
          vendor: [
            'react',
            'react-dom',
            'react-router',
            'react-router-dom',
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-resources-to-backend',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Bundle critical providers together for Safari compatibility
          'critical-providers': [
            'src/context/theme.tsx',
            'src/context/migration.tsx',
            'src/context/schedule.tsx',
            'src/components/AllProviders/index.tsx',
          ],
          // Bundle MUI icons separately since they're used less frequently
          'mui-icons': ['@mui/icons-material', '@mui/x-date-pickers'],
          // Bundle data/state management together
          data: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/database',
            'firebase/storage',
          ],
          // Bundle utilities together
          utils: ['zustand', 'dexie', 'dexie-react-hooks', 'dayjs', 'nanoid', 'clsx', 'js-sha256'],
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
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
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
    target: ['es2018', 'safari14', 'ios14'],

    // Reduce CSS chunking to minimize requests
    cssCodeSplit: false,

    // Increase chunk size to bundle more aggressively - reduce waterfalls
    chunkSizeWarningLimit: 5000,

    // Enable minification optimizations with Safari compatibility
    minify: 'esbuild',

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

  // Additional configuration for Safari/iOS compatibility
  esbuild: {
    // Align with build target for consistency
    target: 'es2018',
    // Safari sometimes has issues with top-level await and advanced features
    supported: {
      'top-level-await': false,
    },
  },
});
