import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
    css: true,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml'
    }
  },
});
