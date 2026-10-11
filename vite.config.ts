import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

const root = import.meta.dirname;

export default defineConfig({
  // Self-references resolve to mod.ts, so tests exercise public subpaths against source.
  resolve: { alias: { "@dldc/stack": resolve(root, "mod.ts") } },

  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.types.ts"],
    },
  },

  fmt: {
    ignorePatterns: [
      "**/__snapshots__/**",
      "**/*.md",
      ".github/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
    ],
  },

  lint: {
    options: { typeAware: true, typeCheck: true },
    rules: {
      "no-explicit-any": "off",
    },
  },

  pack: {
    entry: { mod: "mod.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
