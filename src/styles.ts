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
  --ps-highlight: #ffe27a;
  --ps-marker: #555;

  display: inline-block;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif;
  color: var(--ps-text);
  line-height: 1;
  -webkit-user-select: none;
  user-select: none;
}

* { box-sizing: border-box; }

.ps-root {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
}

.ps-main {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

/* 盤の左右に置く手番マーカー＋持ち駒のカラム */
.ps-side {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: calc(var(--ps-cell-size) * 1.2);
  gap: 4px;
}
.ps-side-right { justify-content: flex-end; }

/* ▲ / ▽ 手番マーカー（クリックで盤反転） */
.ps-marker {
  cursor: pointer;
  font-size: calc(var(--ps-cell-size) * 0.7);
  text-align: center;
  color: var(--ps-marker);
  padding: 2px 0;
  border-radius: 4px;
  transition: background-color 0.15s;
}
.ps-marker:hover { background: rgba(0, 0, 0, 0.07); }
.ps-marker.is-turn { color: var(--ps-text); font-weight: bold; }

/* 持ち駒リスト（マーカーの上下に縦並び） */
.ps-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: calc(var(--ps-cell-size) * 0.5);
}
.ps-hand-item { white-space: nowrap; }
.ps-hand-empty { color: #aaa; }

.ps-board-wrap { position: relative; }

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

.ps-slider {
  width: 100%;
  cursor: pointer;
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
