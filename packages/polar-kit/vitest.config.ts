/// <reference types="vitest" />

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ['./src/**/*.spec.ts', './src/**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/dist/**',
      ],
      clean: true,
    },
  },
  resolve: {
    alias: {
      '@/*': resolve(__dirname, './src'),
    },
  },
});
