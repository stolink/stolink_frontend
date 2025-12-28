import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: [
          "src/hooks/**/*.ts",
          "src/stores/**/*.ts",
          "src/services/**/*.ts",
          "src/repositories/**/*.ts",
          "src/lib/**/*.ts",
        ],
        exclude: [
          "**/*.d.ts",
          "**/*.config.ts",
          "**/index.ts",
          "**/__tests__/**",
          "**/*.test.ts",
          "**/*.spec.ts",
          "**/*.test.tsx",
          "**/*.spec.tsx",
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      testTimeout: 10000,
      hookTimeout: 10000,
    },
  }),
);
