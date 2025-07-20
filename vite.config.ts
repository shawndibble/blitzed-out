import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    } as any),
  ],
  server: {
    // Reduce HTTP/2 server push overhead in dev
    fs: {
      allow: ['..']
    }
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
        manualChunks: (id) => {
          // Less aggressive bundling to prevent circular dependencies
          if (id.includes('node_modules')) {
            // Keep React and React DOM together to prevent hook ordering issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // Group MUI and Emotion together (they have tight coupling)
            if (id.includes('@mui/') || id.includes('@emotion/')) {
              return 'vendor-mui';
            }
            
            // Group all Firebase services
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            
            // Group i18n related modules
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            
            // Group utility libraries
            if (id.includes('dayjs') || id.includes('moment') || id.includes('nanoid') || 
                id.includes('js-sha256') || id.includes('clsx') || id.includes('zustand') ||
                id.includes('dexie')) {
              return 'vendor-utils';
            }
            
            // All other node_modules go to vendor
            return 'vendor';
          }
          
          // Simplified app code chunking
          if (id.includes('/locales/')) {
            return 'locales';
          }
          // Let Vite handle other app code automatically to prevent issues
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
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Reduce CSS chunking to minimize requests
    cssCodeSplit: false,
    // Increase chunk size to bundle more aggressively
    chunkSizeWarningLimit: 2000,
    // Enable minification optimizations
    minify: 'esbuild',
    // Compress assets
    assetsInlineLimit: 8192, // Inline assets < 8KB
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
      'moment',
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
