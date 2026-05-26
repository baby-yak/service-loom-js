import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 95,
        branches: 90,
      },
    },
  },
});
