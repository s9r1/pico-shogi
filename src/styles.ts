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

  display: inline-block;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif;
  color: var(--ps-text);
  line-height: 1;
  -webkit-user-select: none;
  user-select: none;
}

* { box-sizing: border-box; }

/* 盤・座標・操作行を縦に積むコンテナ（外枠は持たない。枠付けは利用側に委ねる） */
.ps-root {
  display: inline-flex;
  flex-direction: column;
  gap: 16px;
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
  align-items: center;
  justify-content: flex-start;
  width: calc(var(--ps-cell-size) * 1.2);
  gap: 4px;
}
.ps-side-right { justify-content: flex-end; }
/* 奥側（左）の持ち駒・マーカーが盤からやや遠いので、列の中身を盤側（右）へ寄せる。
   align-items は使わず padding-left でコンテンツごと右シフト（中央寄せ＝▲と持ち駒の
   縦中心を保ったまま盤に近づく）。padding ぶん列幅は border-box で吸収する。 */
.ps-side-left { padding-left: calc(var(--ps-cell-size) * 0.5); }
/* サイド列は「筋ラベル行＋盤」の高さなので上端は盤より上にある。
   奥側（上）マーカーは margin-top で盤上端のすぐ下まで下げる。
   手前側（下）マーカーは列下端＝盤下端なので、そのまま盤下端へ寄せる（margin なし）。 */
.ps-side-left .ps-marker { margin-top: calc(var(--ps-cell-size) * 0.5); }
.ps-side-right .ps-marker { margin-bottom: 0; }

/* ▲ / △ 先手・後手マーカー（クリックで盤反転）。手番では色を変えない。 */
.ps-marker {
  cursor: pointer;
  display: block;
  width: calc(var(--ps-cell-size) * 0.7);
  height: calc(var(--ps-cell-size) * 0.7);
  border-radius: 4px;
  transition: background-color 0.15s;
}
.ps-marker text {
  font-size: 90px;
  text-anchor: middle;
  dominant-baseline: central;
  fill: var(--ps-text);
}
.ps-marker:hover { background: rgba(0, 0, 0, 0.07); }

/* 持ち駒リスト（マーカーの上下に縦並び） */
.ps-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--ps-cell-size) * 0.08);
  font-size: calc(var(--ps-cell-size) * 0.5);
}
/* 持ち駒・「なし」とも 1 字ずつの SVG（同じ正方箱）。字形中心 (50,50) で縦中心線が揃い、
   箱サイズが同一なので駒と「なし」の縦間隔も一致する。枚数だけ右脇にはみ出して添える。 */
.ps-hand-item,
.ps-hand-empty {
  display: block;
  overflow: visible;
  width: calc(var(--ps-cell-size) * 0.6);
  height: calc(var(--ps-cell-size) * 0.6);
}
.ps-hand-char {
  font-size: 84px;
  text-anchor: middle;
  dominant-baseline: central;
  fill: var(--ps-text);
}
.ps-hand-empty .ps-hand-char {
  fill: #aaa;
}
.ps-hand-num {
  font-size: 42px;
  text-anchor: start;
  dominant-baseline: central;
  fill: var(--ps-coord);
}

/* 盤本体の包み（無装飾・盤幅ぴったり）。座標ラベルは盤 grid に含めるので特別な余白は不要。 */
.ps-board-area {
  display: inline-block;
}

/* 盤＝10x10 グリッド。行1=筋ラベル・列10=段ラベル・残り 9x9 がマス。
   ラベルもマスも同一トラックを共有するので、列・行は必ず一致する（ボーダー/端数非依存）。
   外枠と地色は 9x9 領域だけを覆うオーバーレイ/アンダーレイが担う（.ps-board 自身は無地）。 */
.ps-board {
  display: grid;
  grid-template-columns: repeat(9, var(--ps-cell-size)) auto;
  grid-template-rows: auto repeat(9, var(--ps-cell-size));
}
/* 重なり順（.ps-board の grid アイテム同士の z-index）:
   地色(0) < マス(1) < 外枠(2) < クリック層(3)。クリック層を最前面にして盤面（マス）の
   クリックで手が進む/戻るようにする（クリック層は 9x9 のみなのでラベル上では発火しない）。 */
.ps-board-bg {
  grid-area: 2 / 1 / 11 / 10;
  position: relative;
  z-index: 0;
  background: var(--ps-board-bg);
}
.ps-frame {
  grid-area: 2 / 1 / 11 / 10;
  position: relative;
  z-index: 2;
  border: 2px solid var(--ps-line);
  pointer-events: none;
}
.ps-cell {
  display: flex;
  position: relative;
  z-index: 1;
  border-right: 1px solid var(--ps-line);
  border-bottom: 1px solid var(--ps-line);
}
/* 右端・下端の罫線は外枠 .ps-frame に任せる */
.ps-cell:nth-child(9n) { border-right: none; }
.ps-cell:nth-child(n + 73) { border-bottom: none; }
.ps-cell.is-last { background: var(--ps-highlight); }

/* 筋（上端・各列中央）／段（右端・各行中央）のラベル。マスと同じトラックに乗り、
   駒と同じく SVG 字形中心 (50,50) で揃える。viewBox 100x100 が箱内で xMidYMid され、
   text-anchor:middle が字形中心を箱中央に置くので、列/行の中央に正確に重なる。 */
.ps-file {
  justify-self: center;
  align-self: end;
  width: calc(var(--ps-cell-size) * 0.7);
  height: calc(var(--ps-cell-size) * 0.5);
}
.ps-rank {
  justify-self: start;
  align-self: center;
  width: calc(var(--ps-cell-size) * 0.5);
  height: calc(var(--ps-cell-size) * 0.7);
}
.ps-file text,
.ps-rank text {
  font-size: 78px;
  text-anchor: middle;
  dominant-baseline: central;
  fill: var(--ps-coord);
}

/* 駒字は SVG で描く。text-anchor:middle + dominant-baseline:central により
   「行ボックス」ではなく「字形そのものの中心」をマス中央 (50,50) に合わせる。
   フォントのベースライン差に依存せず、180度回転しても中心が動かない。 */
.ps-piece {
  flex: 1;
  display: block;
}
.ps-piece text {
  font-size: 70px; /* viewBox 100 に対する比率（≒マスの 0.70） */
  text-anchor: middle;
  dominant-baseline: central;
  fill: var(--ps-text);
}
/* 後手側（上向きでない）駒は 180 度回転（svg ごと回す＝字形中心まわり） */
.ps-piece.is-flipped { transform: rotate(180deg); }
/* 成り駒は赤で表示 */
.ps-piece.is-promoted text { fill: var(--ps-promoted); }

/* 盤の左右クリックで 1 手戻る / 進む。9x9 マス領域だけに重なる grid アイテム
   （grid-area は board-view 側で指定）。マス(z1)・外枠(z2)より前面(z3)に置く。 */
.ps-click {
  z-index: 3;
  cursor: pointer;
}

/* 再生ボタン・スライダー・カウンターを並べる操作行。
   盤の左右に少し寄せつつ、過剰なマージンは避ける。 */
/* 操作行はセルサイズに連動して伸縮する（モバイルで過大にならないように）。
   操作系は小さくしすぎると不便なので clamp の下限で最低サイズを確保し、
   上限は従来の固定値に合わせてデスクトップは概ね据え置きにする。 */
.ps-controls {
  display: flex;
  align-items: center;
  gap: clamp(5px, calc(var(--ps-cell-size) * 0.22), 8px);
  font-family: system-ui, sans-serif;
  width: calc(100% - var(--ps-cell-size) * 2);
  align-self: center;
}

/* 再生 / 一時停止ボタン */
.ps-play {
  flex-shrink: 0;
  width: clamp(22px, calc(var(--ps-cell-size) * 0.85), 30px);
  height: clamp(22px, calc(var(--ps-cell-size) * 0.85), 30px);
  padding: 0;
  border: 1px solid rgba(26, 20, 16, 0.18);
  background: transparent;
  color: var(--ps-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(10px, calc(var(--ps-cell-size) * 0.34), 12px);
}
.ps-play:hover { background: rgba(0, 0, 0, 0.05); }

/* テーマ付きネイティブ range（参照 shogi-blog の .ms-input を移植） */
.ps-slider {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  flex: 1;
  height: clamp(22px, calc(var(--ps-cell-size) * 0.8), 28px);
  margin: 0;
  padding: 0;
  cursor: pointer;
  /* つまみ径（トラック中心合わせの margin-top でも参照する） */
  --thumb: clamp(13px, calc(var(--ps-cell-size) * 0.5), 18px);
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
  width: var(--thumb);
  height: var(--thumb);
  border-radius: 50%;
  background: var(--ps-accent);
  border: 2.5px solid #fffdf5;
  /* 3px のトラック中心につまみを合わせる */
  margin-top: calc((3px - var(--thumb)) / 2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
.ps-slider::-moz-range-thumb {
  width: var(--thumb);
  height: var(--thumb);
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
  min-width: clamp(30px, calc(var(--ps-cell-size) * 1.2), 42px);
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: clamp(10px, calc(var(--ps-cell-size) * 0.33), 12px);
  color: var(--ps-marker);
  letter-spacing: 0.5px;
}
.ps-counter .ps-counter-cur {
  color: var(--ps-text);
  font-weight: 700;
  font-size: clamp(11px, calc(var(--ps-cell-size) * 0.4), 14px);
}
.ps-counter .ps-counter-unit {
  display: block;
  font-size: clamp(8px, calc(var(--ps-cell-size) * 0.26), 9px);
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
