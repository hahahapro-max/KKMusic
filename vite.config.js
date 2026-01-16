import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Keep relative path for GitHub Pages compatibility
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-utils': ['axios', 'buffer', 'process'],
          'vendor-mmb': ['music-metadata-browser'],
          'vendor-player': ['hls.js', 'zustand', 'dexie'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/netease': {
        target: 'http://music.163.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/netease/, ''),
        headers: {
            'Referer': 'http://music.163.com/',
            'Origin': 'http://music.163.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },
      '/tunefree': {
        target: 'https://api.tunefree.fun/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tunefree/, ''),
        headers: {
             'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    }
  },
  preview: {
    host: true,
    proxy: {
      '/netease': {
        target: 'http://music.163.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/netease/, ''),
        headers: {
            'Referer': 'http://music.163.com/',
            'Origin': 'http://music.163.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },
      '/tunefree': {
        target: 'https://api.tunefree.fun/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tunefree/, ''),
        headers: {
             'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    }
  }
})
