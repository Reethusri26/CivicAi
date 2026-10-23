import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret-0123456789-0123456789-abcdef",
      GEMINI_API_KEY: "",
    },
  },
});
