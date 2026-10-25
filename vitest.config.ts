import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure logic runs in plain node. Component tests opt in to a fake browser
    // with a `// @vitest-environment jsdom` comment at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // Starts every test file with the start menu closed (see the file).
    setupFiles: ['src/test/setup.ts'],
    // Coverage instrumentation makes the loops over all 15 stages several times slower.
    testTimeout: 20_000,
    // `pnpm test:coverage`: which code no test runs. The test helpers, the development sheets and the entry point are left out.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', 'src/test/**', 'src/dev/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'json-summary'],
    },
  },
})
