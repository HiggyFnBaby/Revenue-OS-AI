import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests all share one database and each clears the tables it
    // touches. Running files concurrently would let one file's cleanup delete
    // another file's fixtures mid-assertion, so files run one at a time.
    fileParallelism: false,
    testTimeout: 20000,
  },
  resolve: {
    alias: { "@": new URL("./src/", import.meta.url).pathname },
  },
});
