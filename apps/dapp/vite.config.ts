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
            ${['development', 'demo'].includes(process.env.NODE_ENV || '') ? mockScript : ''}
            ${['development'].includes(process.env.NODE_ENV || '') ? '' : cloudflareScript}
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
        manualChunks: (id: string) => {
          const name = id.match(/[^/]+(?=@)/)?.[0].replace(/[+]/g, '/');
          if (!name) return undefined;
          if (/dayjs|date-fns|moment/.test(name)) return 'time';
          if (/axios/.test(name)) return 'axios';
          if (/lodash/.test(name)) return 'lodash';
          if (/^react$|^react-dom|^react-router/.test(name)) return 'react';
          if (/semi-|swiper/.test(name)) return 'ui';
          if (/web3modal|walletconnect|uxuycom|uniswap|ethers/.test(name))
            return 'wallet';
          if (/chart/.test(name)) return 'chart';
          if (/sentry/.test(name)) return 'sentry';
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
