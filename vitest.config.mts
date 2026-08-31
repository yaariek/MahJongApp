import { defineConfig } from 'vitest/config';

// Vitest only ever runs the framework-free domain logic under src/core.
// It must NOT pull in React Native / Expo modules — keep src/core import-clean.
export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts'],
    environment: 'node',
  },
});
