/**
 * Shadow DOM 内に注入する CSS。ブログ側の CSS と干渉しないよう :host に閉じる。
 * 駒は「四角いマス目の中に漢字一字」の将棋本スタイル。
 */
export const STYLE = /* css */ `
:host {
  --ps-line: #6b5b3e;
  --ps-board-bg: transparent;
  --ps-cell-size: 30px;
  --ps-text: #1a1a1a;
  /* アクセント色（スライダー専用）。 */
  --ps-accent: #8b2a1f;
  /* 最終手ハイライト（スライダーとは独立したグレー）。 */
  --ps-highlight: rgba(0, 0, 0, 0.12);
  /* 成り駒の文字色（赤）。 */
  --ps-promoted: #c0392b;
  --ps-marker: #555;
  --ps-coord: #999;
  /* 図版フレーム（盤を囲む淡い枠）。 */
  --ps-frame: rgba(26, 20, 16, 0.18);

  display: inline-block;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif;
  color: var(--ps-text);
  line-height: 1;
  -webkit-user-select: none;
  user-select: none;
}

* { box-sizing: border-box; }

/* 盤一式を囲む淡い枠の図版フレーム */
.ps-root {
  display: inline-flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid var(--ps-frame);
  padding: 12px 12px;
}

.ps-main {
  display: flex;
  align-items: stretch;
  gap: 3px;
}

/* 盤の左右に置く手番マーカー＋持ち駒のカラム（左右同幅・盤に密着）。
   コンテンツは中央寄せにして ▲/△ と持ち駒の縦ラインを揃える。 */
.ps-side {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: calc(var(--ps-cell-size) * 1.2);
  gap: 4px;
}
.ps-side-right { justify-content: flex-end; }
/* 奥側（上側プレイヤー）のマーカーは盤上端から少し下げる */
.ps-side-left .ps-marker { margin-top: calc(var(--ps-cell-size) * 0.4); }

/* ▲ / △ 先手・後手マーカー（クリックで盤反転）。手番では色を変えない。 */
.ps-marker {
  cursor: pointer;
  font-size: calc(var(--ps-cell-size) * 0.7);
  text-align: center;
  color: var(--ps-text);
  padding: 2px 0;
  border-radius: 4px;
  transition: background-color 0.15s;
}
.ps-marker:hover { background: rgba(0, 0, 0, 0.07); }

/* 持ち駒リスト（マーカーの上下に縦並び） */
.ps-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--ps-cell-size) * 0.16);
  font-size: calc(var(--ps-cell-size) * 0.5);
}
.ps-hand-item { white-space: nowrap; }
.ps-hand-empty { color: #aaa; }

/* 盤＋座標（上=筋・右=段）を並べる小グリッド。段ラベルは盤の右に置く。 */
.ps-board-area {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  grid-template-areas:
    "files corner"
    "board ranks";
  gap: 3px;
}
/* 筋の数字（盤の上、各列の中央に揃える） */
.ps-files {
  grid-area: files;
  display: grid;
  grid-template-columns: repeat(9, var(--ps-cell-size));
  justify-self: center;
}
.ps-files > span {
  text-align: center;
  font-size: calc(var(--ps-cell-size) * 0.34);
  color: var(--ps-coord);
}
/* 段の漢数字（盤の右、各行の中央に揃える） */
.ps-ranks {
  grid-area: ranks;
  display: grid;
  grid-template-rows: repeat(9, var(--ps-cell-size));
  align-self: center;
}
.ps-ranks > span {
  display: flex;
  align-items: center;
  padding-left: 3px;
  font-size: calc(var(--ps-cell-size) * 0.36);
  color: var(--ps-coord);
}

/* クリック層が盤だけを覆うよう、盤をこのラッパに閉じる */
.ps-board-inner {
  grid-area: board;
  position: relative;
}

/* 9x9 盤 */
.ps-board {
  display: grid;
  grid-template-columns: repeat(9, var(--ps-cell-size));
  grid-template-rows: repeat(9, var(--ps-cell-size));
  background: var(--ps-board-bg);
  border: 2px solid var(--ps-line);
}
.ps-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--ps-line);
  border-bottom: 1px solid var(--ps-line);
  font-size: calc(var(--ps-cell-size) * 0.72);
}
/* 右端・下端の罫線は盤の border に任せる */
.ps-cell:nth-child(9n) { border-right: none; }
.ps-cell:nth-child(n + 73) { border-bottom: none; }
.ps-cell.is-last { background: var(--ps-highlight); }

/* 後手側（上向きでない）駒は 180 度回転 */
.ps-piece.is-flipped { transform: rotate(180deg); }
/* 成り駒は赤で表示 */
.ps-piece.is-promoted { color: var(--ps-promoted); }

/* 盤の左右クリックで 1 手戻る / 進む */
.ps-click {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  cursor: pointer;
}
.ps-click-prev { left: 0; }
.ps-click-next { right: 0; }

/* 再生ボタン・スライダー・カウンターを並べる操作行。
   盤の左右に少し寄せつつ、過剰なマージンは避ける。 */
.ps-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: system-ui, sans-serif;
  width: calc(100% - var(--ps-cell-size) * 2);
  align-self: center;
}

/* 再生 / 一時停止ボタン */
.ps-play {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--ps-frame);
  background: transparent;
  color: var(--ps-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.ps-play:hover { background: rgba(0, 0, 0, 0.05); }

/* テーマ付きネイティブ range（参照 shogi-blog の .ms-input を移植） */
.ps-slider {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  flex: 1;
  height: 28px;
  margin: 0;
  padding: 0;
  cursor: pointer;
}
.ps-slider::-webkit-slider-runnable-track {
  height: 3px;
  background: linear-gradient(
    to right,
    var(--ps-accent) 0 var(--p, 0%),
    rgba(0, 0, 0, 0.18) var(--p, 0%) 100%
  );
  border-radius: 1.5px;
}
.ps-slider::-moz-range-track {
  height: 3px;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 1.5px;
}
.ps-slider::-moz-range-progress {
  height: 3px;
  background: var(--ps-accent);
  border-radius: 1.5px;
}
.ps-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ps-accent);
  border: 2.5px solid #fffdf5;
  margin-top: -8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
.ps-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ps-accent);
  border: 2.5px solid #fffdf5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
.ps-slider:focus { outline: none; }

/* 手数カウンター（N / 総数 手目） */
.ps-counter {
  flex-shrink: 0;
  min-width: 42px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--ps-marker);
  letter-spacing: 0.5px;
}
.ps-counter .ps-counter-cur {
  color: var(--ps-text);
  font-weight: 700;
  font-size: 14px;
}
.ps-counter .ps-counter-unit {
  display: block;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--ps-coord);
  margin-top: 1px;
}

.ps-error {
  padding: 8px 12px;
  border: 1px solid #d99;
  background: #fdecec;
  color: #a33;
  font-family: sans-serif;
  font-size: 13px;
  border-radius: 4px;
}
`;
