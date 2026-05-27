# pico-shogi

Markdown ブログ記事に埋め込める、軽量な将棋盤・棋譜表示 Web Component。
`<script>` を 1 本読み込むだけで `<shogi-board>` が使えます。React 等のフレームワークには依存しません。

- SFEN（局面）／ USI（指し手列）に対応
- 盤の左右クリックで 1 手進む／戻る
- ▲ ／ △ クリックで盤を反転（先手視点 ⇄ 後手視点）
- 任意でスライダー（再生ボタン・手数カウンター付き）
- 直前手のハイライト・成り駒の赤表示
- 駒は将棋本ふうの「マス目の中に漢字一字」表示
- 棋譜パースは [tsshogi](https://github.com/sunfish-shogi/tsshogi) を利用

## 使い方

ビルドした単一ファイル `dist/pico-shogi.js` を読み込むだけです。

```html
<script src="pico-shogi.js"></script>

<!-- SFEN 局面 -->
<shogi-board
  kif="lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"
></shogi-board>

<!-- USI 棋譜・最終局面（スライダーは既定で表示） -->
<shogi-board kif="startpos moves 7g7f 3c3d 2g2f" nanteme="-1"></shogi-board>

<!-- スライダー等の操作 UI を隠す -->
<shogi-board kif="startpos moves 7g7f 3c3d 2g2f" no-slider></shogi-board>
```

## 属性

| 属性        | 値                    | 既定    | 説明                                                  |
| ----------- | --------------------- | ------- | ----------------------------------------------------- |
| `kif`       | 文字列（必須）        | —       | SFEN 局面 または USI 指し手列                          |
| `teban`     | `sente` \| `gote`     | `sente` | 盤の向き（`gote` で後手視点）                          |
| `nanteme`   | 整数                  | `0`     | 初期表示手数（何手目）。負値は末尾からの相対（`-1`=最終手, `-2`=その1手前 …） |
| `no-slider` | 属性の有無            | なし    | 付けると再生ボタン・スライダー・手数カウンターを隠す（既定は表示） |

`kif` が不正な場合は盤を表示せず、枠内にエラーメッセージを出します（ページは壊れません）。

## 操作

- 盤の **右半分クリック** → 1 手進む / **左半分クリック** → 1 手戻る
- **▲ / △ マーカークリック** → 盤を反転（視点切替）
- スライダーをドラッグ → 任意の手数へ
- **▶ / ❚❚ ボタン**（スライダー表示時）→ 自動再生の開始 / 停止（最終手で自動停止）

## 見た目のカスタマイズ

CSS カスタムプロパティで調整できます（`::part` ではなく `:host` 変数）。

```css
shogi-board {
  --ps-cell-size: 36px; /* マスの大きさ */
  --ps-board-bg: #f3d9a4; /* 盤の色 */
  --ps-line: #6b5b3e; /* 罫線の色 */
  --ps-accent: #8b2a1f; /* スライダーのアクセント色 */
  --ps-highlight: rgba(0, 0, 0, 0.12); /* 最終手ハイライト（グレー） */
  --ps-promoted: #c0392b; /* 成り駒の文字色（赤） */
  --ps-coord: #999; /* 座標（筋・段）の色 */
}
```

## 開発

```bash
pnpm install
pnpm dev      # 開発サーバ（index.html）
pnpm test     # vitest（パーサのユニットテスト）
pnpm build    # 型チェック + 単一バンドル dist/pico-shogi.js を生成
```

## 非対応（後回し）

合法手判定 / 対局 / 棋譜編集 / 分岐 / コメント / 評価値 / KIF・KI2・CSA 入力 / SVG 駒。
