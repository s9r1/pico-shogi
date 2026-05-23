import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    // 単一バンドルJS。<script> で読み込むだけで <shogi-board> が使えるようにする。
    lib: {
      entry: "src/index.ts",
      name: "PicoShogi",
      formats: ["iife"],
      fileName: () => "pico-shogi.js",
    },
    // tsshogi はバンドルに同梱する（外部依存にしない）。
    rollupOptions: {},
    minify: "esbuild",
    target: "es2020",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
