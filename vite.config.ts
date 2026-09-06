import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    // iife: <script> で読み込むだけで <shogi-board> が使える単一バンドル。
    // es:   バンドラ経由の import 用（package.json の exports.import が指す）。
    lib: {
      entry: "src/index.ts",
      name: "PicoShogi",
      formats: ["es", "iife"],
      fileName: (format) => (format === "es" ? "pico-shogi.mjs" : "pico-shogi.js"),
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
