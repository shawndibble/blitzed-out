import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Use '@' as an alias for 'src'
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
