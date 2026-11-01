import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        assets: fileURLToPath(new URL('./assets.html', import.meta.url)),
      },
    },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
