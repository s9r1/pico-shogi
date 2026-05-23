## 概要

Markdown ブログに埋め込める軽量な将棋盤・棋譜表示 Web Component。`<script>` 1 本で `<shogi-board kif="...">` が使える（フレームワーク非依存）。`kif` は SFEN 局面 / USI 指し手列。属性・操作・カスタマイズ等の利用者向け仕様は README.md を参照。

## 構成

- `src/index.ts` — エントリ。`ShogiBoardElement` を `customElements` に自動登録。
- `src/shogi-board-element.ts` — Web Component 本体。属性（kif/teban/nanteme/no-slider）の監視、Shadow DOM 管理、手数・視点・自動再生の状態を持ち、BoardView を駆動。
- `src/board-view.ts` — Shadow DOM 内の DOM 構築と描画。盤・持ち駒・スライダーを生成し、クリック/シーク/再生のコールバックを発火。
- `src/parser.ts` — tsshogi で `kif` をパースし `Record` 化（`parseKif`）。各手数の盤面を描画用 `BoardState` に変換（`readState`）。
- `src/piece-char.ts` — 駒種 → 漢字一字（成駒含む）、成判定・持ち駒並び順。
- `src/styles.ts` — Shadow DOM に注入する CSS（`:host` の CSS 変数でカスタマイズ）。
- `src/types.ts` — 描画用の型（`BoardState` / `BoardCell` / `HandCount` / `Viewpoint`）。tsshogi の `Position` から描画に必要な最小情報を切り出した形。
- `tests/parser.test.ts` — パーサのユニットテスト（vitest）。

依存は将棋ロジックを担う [tsshogi](https://github.com/sunfish-shogi/tsshogi) のみ。ビルドは Vite で単一ファイル `dist/pico-shogi.js` を出力。

データフロー: 属性 `kif` → `parseKif` → `Record` →（手数指定）`readState` → `BoardState` → `BoardView` が描画。

## 検証

変更後の確認は `pnpm build`（型チェック + バンドル）と `pnpm test` のみ。ブラウザでの目視確認は不要。
