import { defineConfig } from 'vitest/config';

// Vitest only ever runs the framework-free domain logic under src/core and the
// pure helpers under src/lib. Neither may import React Native / Expo modules —
// keep both import-clean so this runs with `environment: 'node'` and no simulator.
export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts', 'src/lib/**/*.test.ts'],
    environment: 'node',
  },
});
