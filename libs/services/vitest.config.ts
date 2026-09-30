import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      // Transaction tests do not require the generated WASM package.
      '@sofa/alg': fileURLToPath(
        new URL('./test/mocks/alg.ts', import.meta.url),
      ),
    },
  },
});
