import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');

  return {
    // Build configuration
    build: {
      outDir: '../dashboard-dist',
      emptyOutDir: true,
      sourcemap: mode === 'development',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'charts': ['recharts'],
            'icons': ['lucide-react'],
          }
        }
      }
    },

    // Development server (only for development)
    server: {
      port: 3001,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },

    plugins: [react()],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      'process.env.VITE_API_BASE': JSON.stringify('/api'),
      'process.env.VITE_WS_BASE': JSON.stringify('ws://localhost:3000'),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
