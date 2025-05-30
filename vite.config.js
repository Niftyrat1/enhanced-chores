import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    // Load environment variables
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321', // Default to local Supabase
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'anon.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.X-CqUQXWQs1jZJ0K6Ldwz07Q287p0Ox30XHj9XzNpsM', // Default anon key
      VITE_WEATHER_API_KEY: process.env.VITE_WEATHER_API_KEY || ''
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'http://localhost:54321'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'anon.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.X-CqUQXWQs1jZJ0K6Ldwz07Q287p0Ox30XHj9XzNpsM'),
      'import.meta.env.VITE_WEATHER_API_KEY': JSON.stringify(process.env.VITE_WEATHER_API_KEY || '')
    },
    plugins: [
      react(),
      legacy({
        targets: ['defaults', 'not IE 11']
      })
    ],
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      sourcemapFileNames: mode !== 'production' ? '[file].map' : undefined,
      sourcemapBaseUrl: mode !== 'production' ? '/' : undefined,
      rollupOptions: {
        external: ['chart.js', 'chartjs-plugin-datalabels', 'react', 'react-dom'],
        output: {
          globals: {
            'chart.js': 'Chart',
            'chartjs-plugin-datalabels': 'ChartDataLabels',
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
