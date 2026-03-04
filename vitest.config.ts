import { defineConfig } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  test: {
    // Test environment
    environment: "node",

    // Include test files
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
    ],

    // Exclude patterns
    exclude: [
      "node_modules",
      "dist",
      ".nitro",
      ".tanstack",
      "tests/e2e/**/*", // E2E tests use Playwright
    ],

    // Setup files
    setupFiles: ["./tests/setup.ts"],

    // Global test timeout
    testTimeout: 30000,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/server/**/*.ts",
        "src/lib/server/repositories/**/*.ts",
        "src/lib/validation/**/*.ts",
        "src/lib/utils.ts",
        "src/database/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "node_modules",
        "tests",
      ],
      // Coverage thresholds for critical paths
      thresholds: {
        global: {
          statements: 60,
          branches: 50,
          functions: 60,
          lines: 60,
        },
      },
    },

    // Reporter configuration
    reporters: ["verbose"],

    // Pool configuration for parallel execution
    pool: "forks",
    isolate: true,

    // Environment variables for tests
    env: {
      NODE_ENV: "test",
    },

    // Globals (if needed)
    globals: true,
  },
});
