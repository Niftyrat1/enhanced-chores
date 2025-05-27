import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      legacy({
        targets: ['defaults', 'not IE 11']
      })
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        external: ['chart.js', 'chartjs-plugin-datalabels'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }
    },
    server: {
      proxy: {
        '/api/supabase': {
          target: env.VITE_SUPABASE_URL || 'http://localhost:54321',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/supabase/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  };
});
