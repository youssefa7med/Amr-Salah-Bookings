import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        strictPort: false,
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui-libs': ['framer-motion', 'lucide-react', 'react-hot-toast'],
                    'i18n': ['i18next', 'react-i18next'],
                    'supabase': ['@supabase/supabase-js'],
                    'vercel': ['@vercel/analytics', '@vercel/speed-insights'],
                },
            },
        },
    },
});
