import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      // Prevents src/db/index.ts from throwing during module init in tests
      // that transitively import it. No queries are executed.
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
    },
  },
});
