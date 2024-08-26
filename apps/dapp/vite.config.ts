import react from '@vitejs/plugin-react-swc';
import dayjs from 'dayjs';
import { visualizer } from 'rollup-plugin-visualizer';
import hash from 'string-hash';
import { fileURLToPath, URL } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import svgr from 'vite-plugin-svgr';

import { multiPagePlugin } from './multi-page';

const time = dayjs().format('YYYY-MM-DD HH:mm:ss');

const mockScript =
  '<script type="module" src="./node_modules/@sofa/services/mock/index.ts"></script>';

// cloudflare 访问配置
const cloudflareScript =
  '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>';

const VERSION = process.env.VITE_VERSION || process.env.VERSION || time;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: +loadEnv(mode, './').VITE_PORT || 8080,
    host: true,
  },
  root: './',
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/var.scss";',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@@': fileURLToPath(new URL('./public', import.meta.url)),
    },
  },
  plugins: [
    createHtmlPlugin({
      minify: false,
      inject: {
        data: {
          extraScript: `
            ${process.env.NODE_ENV === 'development' ? mockScript : ''}
            ${process.env.NODE_ENV === 'development' ? '' : cloudflareScript}
            <!-- Site Version: ${VERSION.replace(/[\s-:]/g, '_')} -->
            <!-- Site Build Time: ${time} -->
          `,
          sitekey: loadEnv(mode, './').VITE_SITE_KEY,
        },
      },
    }),
    react({ tsDecorators: true }),
    svgr({
      include: '**/*.svg',
      exclude: [/\.svg\?url$/],
      svgrOptions: {
        namedExport: 'Comp',
        exportType: 'named',
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgo: true,
        ref: true,
        svgoConfig: {
          plugins: [
            {
              // 解决 id 冲突问题
              name: 'prefixIds',
              params: {
                prefix: (node, info) => String(hash(info.path || '')),
              },
            },
            {
              name: 'removeAttributesBySelector',
              params: {
                selector: 'svg',
                attributes: ['width', 'height'],
              },
            },
          ],
        },
      },
    }),
    !process.env.ANALYZE
      ? null
      : (visualizer({
          emitFile: true,
          filename: 'analyze.html',
        }) as never),
    multiPagePlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'lodash-es': ['lodash-es'],
          react: ['react', 'react-dom'],
          ui: ['@douyinfe/semi-ui'],
          sentry: ['@sentry/integrations', '@sentry/react', '@sentry/tracing'],
        },
      },
    },
    terserOptions: {
      parse: {
        html5_comments: false,
      },
    },
  },
  optimizeDeps: {
    include: ['**/*.min.js'],
  },
  define: {
    'process.env': { ...process.env, VERSION },
  },
}));