import { Color } from "tsshogi";
import type { BoardState, HandCount, Viewpoint } from "./types";
import { HAND_ORDER, isPromoted, pieceChar } from "./piece-char";
import { STYLE } from "./styles";

/** 盤面操作のコールバック。 */
export interface BoardViewCallbacks {
  /** 盤の左半分クリック（1手戻る）。 */
  onPrev(): void;
  /** 盤の右半分クリック（1手進む）。 */
  onNext(): void;
  /** ▲/△ マーカークリック（視点反転）。 */
  onRotate(): void;
  /** スライダー操作（手数指定）。 */
  onSeek(ply: number): void;
  /** 再生 / 一時停止ボタンのクリック。 */
  onTogglePlay(): void;
}

export interface BoardViewOptions {
  viewpoint: Viewpoint;
  /** スライダー（再生ボタン・手数カウンター込み）を表示するか。 */
  showSlider: boolean;
}

/** 段の漢数字（1 段目→9 段目）。 */
const RANK_KANJI = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * 盤・持ち駒・手番マーカー・スライダーを描画する。
 * DOM 構造は一度だけ構築し、update() で内容のみ差し替える。
 */
export class BoardView {
  readonly root: HTMLElement;
  private readonly cells: HTMLElement[] = [];
  /** 各マスの駒字（SVG text）。字形中心でマス中央に揃えるため SVG で描く。 */
  private readonly pieceTexts: SVGTextElement[] = [];
  private readonly leftSide: HTMLElement;
  private readonly rightSide: HTMLElement;
  private readonly leftMarker: SVGSVGElement;
  private readonly rightMarker: SVGSVGElement;
  private readonly leftHand: HTMLElement;
  private readonly rightHand: HTMLElement;
  /** 筋・段ラベルの SVG text（駒と同じく字形中心でマスに揃える）。 */
  private readonly fileLabels: SVGTextElement[] = [];
  private readonly rankLabels: SVGTextElement[] = [];
  private slider: HTMLInputElement | null = null;
  private counter: HTMLElement | null = null;
  private counterCur: HTMLElement | null = null;
  private counterMax: HTMLElement | null = null;
  private playBtn: HTMLButtonElement | null = null;
  private viewpoint: Viewpoint;
  private lastState: BoardState | null = null;

  constructor(
    doc: Document,
    private readonly cb: BoardViewCallbacks,
    opts: BoardViewOptions,
  ) {
    this.viewpoint = opts.viewpoint;

    const style = doc.createElement("style");
    style.textContent = STYLE;

    this.root = doc.createElement("div");
    this.root.className = "ps-root";

    const main = doc.createElement("div");
    main.className = "ps-main";

    // --- 左カラム（盤の向こう側プレイヤー）: マーカー上・持ち駒下 ---
    this.leftSide = doc.createElement("div");
    this.leftSide.className = "ps-side ps-side-left";
    this.leftMarker = this.createMarker(doc);
    this.leftHand = doc.createElement("div");
    this.leftHand.className = "ps-hand";
    this.leftSide.append(this.leftMarker, this.leftHand);

    // --- 盤本体 ---
    // 座標ラベル（筋=上端 / 段=右端）を 9x9 マスと同一の grid に入れ、同じトラックを共有させる。
    // これにより列・行は box モデルやボーダーに関係なく必ずマスと一致する。盤は 10x10 グリッド
    //（行1=筋・列10=段・残り 9x9=マス）で、セル/ラベル/枠/地色を grid-area で明示配置する。
    const boardArea = doc.createElement("div");
    boardArea.className = "ps-board-area";

    const board = doc.createElement("div");
    board.className = "ps-board";

    // 81 マス（行2〜10・列1〜9）。先頭 81 子なので nth-child による右端/下端ボーダー除去が効く。
    for (let i = 0; i < 81; i++) {
      const cell = doc.createElement("div");
      cell.className = "ps-cell";
      cell.style.gridColumn = String((i % 9) + 1);
      cell.style.gridRow = String(Math.floor(i / 9) + 2);
      // 駒字は SVG で描画。viewBox 100x100 の中央 (50,50) に字形中心を合わせる。
      const svg = doc.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "ps-piece");
      svg.setAttribute("viewBox", "0 0 100 100");
      const text = doc.createElementNS(SVG_NS, "text");
      text.setAttribute("x", "50");
      text.setAttribute("y", "50");
      svg.appendChild(text);
      cell.appendChild(svg);
      this.cells.push(cell);
      this.pieceTexts.push(text);
      board.appendChild(cell);
    }

    // 9x9 マスの地色（最背面）と枠（前面・クリックは透過）。どちらもマス領域だけを覆う。
    const bg = doc.createElement("div");
    bg.className = "ps-board-bg";
    const frame = doc.createElement("div");
    frame.className = "ps-frame";
    board.append(bg, frame);

    // 筋ラベル（行1・列1〜9）／段ラベル（行2〜10・列10）。駒と同じく SVG の字形中心 (50,50)
    // でマスに重ねる（フォントの字幅・サイドベアリングに依存せず列/行中央に揃う）。
    for (let i = 0; i < 9; i++) {
      const svg = doc.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "ps-file");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.style.gridRow = "1";
      svg.style.gridColumn = String(i + 1);
      const text = doc.createElementNS(SVG_NS, "text");
      text.setAttribute("x", "50");
      text.setAttribute("y", "50");
      svg.appendChild(text);
      board.appendChild(svg);
      this.fileLabels.push(text);
    }
    for (let i = 0; i < 9; i++) {
      const svg = doc.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "ps-rank");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.style.gridRow = String(i + 2);
      svg.style.gridColumn = "10";
      const text = doc.createElementNS(SVG_NS, "text");
      text.setAttribute("x", "50");
      text.setAttribute("y", "50");
      svg.appendChild(text);
      board.appendChild(svg);
      this.rankLabels.push(text);
    }

    // 前後手移動のクリック層は 9x9 マス領域だけに重ねる grid アイテム（ラベル上では発火しない）。
    const prev = doc.createElement("div");
    prev.className = "ps-click ps-click-prev";
    prev.style.gridArea = "2 / 1 / 11 / 6";
    prev.addEventListener("click", () => this.cb.onPrev());
    const next = doc.createElement("div");
    next.className = "ps-click ps-click-next";
    next.style.gridArea = "2 / 6 / 11 / 10";
    next.addEventListener("click", () => this.cb.onNext());
    board.append(prev, next);

    boardArea.append(board);

    // --- 右カラム（盤の手前側プレイヤー）: 持ち駒上・マーカー下 ---
    this.rightSide = doc.createElement("div");
    this.rightSide.className = "ps-side ps-side-right";
    this.rightMarker = this.createMarker(doc);
    this.rightHand = doc.createElement("div");
    this.rightHand.className = "ps-hand";
    this.rightSide.append(this.rightHand, this.rightMarker);

    main.append(this.leftSide, boardArea, this.rightSide);
    this.root.appendChild(main);

    // --- 操作行（再生ボタン → スライダー → 手数カウンター） ---
    if (opts.showSlider) {
      const controls = doc.createElement("div");
      controls.className = "ps-controls";

      this.playBtn = doc.createElement("button");
      this.playBtn.type = "button";
      this.playBtn.className = "ps-play";
      this.playBtn.addEventListener("click", () => this.cb.onTogglePlay());
      controls.appendChild(this.playBtn);
      this.setPlaying(false);

      this.slider = doc.createElement("input");
      this.slider.type = "range";
      this.slider.className = "ps-slider";
      this.slider.min = "0";
      this.slider.value = "0";
      this.slider.addEventListener("input", () => {
        if (this.slider) this.cb.onSeek(Number(this.slider.value));
      });
      controls.appendChild(this.slider);

      this.counter = doc.createElement("div");
      this.counter.className = "ps-counter";
      this.counterCur = doc.createElement("span");
      this.counterCur.className = "ps-counter-cur";
      this.counterMax = doc.createElement("span");
      const unit = doc.createElement("span");
      unit.className = "ps-counter-unit";
      unit.textContent = "手目";
      this.counter.append(this.counterCur, this.counterMax, unit);
      controls.appendChild(this.counter);

      this.root.appendChild(controls);
    }

    // style は root の前に置いて Shadow DOM へまとめて attach できるようにする
    this.styleEl = style;
  }

  /** Shadow DOM へ流し込む <style> 要素。 */
  readonly styleEl: HTMLStyleElement;

  private createMarker(doc: Document): SVGSVGElement {
    // ▲/△ も SVG の字形中心で描き、持ち駒「なし」と同じ縦中心線に揃える。
    const svg = doc.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "ps-marker");
    svg.setAttribute("viewBox", "0 0 100 100");
    const text = doc.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "50");
    svg.appendChild(text);
    svg.addEventListener("click", () => this.cb.onRotate());
    return svg;
  }

  setViewpoint(v: Viewpoint): void {
    if (this.viewpoint === v) return;
    this.viewpoint = v;
    if (this.lastState) this.update(this.lastState);
  }

  /** 再生ボタンの表示（▶ / ❚❚）を切り替える。 */
  setPlaying(playing: boolean): void {
    if (!this.playBtn) return;
    this.playBtn.textContent = playing ? "❚❚" : "▶";
    this.playBtn.setAttribute("aria-label", playing ? "一時停止" : "再生");
  }

  /** 座標ラベル（上=筋・右=段）を視点に応じて描画する。 */
  private renderCoords(): void {
    const senteView = this.viewpoint === "sente";
    for (let i = 0; i < 9; i++) {
      // 先手視点は左から 9..1、後手視点は 1..9。
      this.fileLabels[i].textContent = String(senteView ? 9 - i : i + 1);
      // 先手視点は上から 一..九、後手視点は 九..一。
      this.rankLabels[i].textContent = senteView
        ? RANK_KANJI[i]
        : RANK_KANJI[8 - i];
    }
  }

  /** 盤面・持ち駒・マーカー・スライダーを最新状態に更新する。 */
  update(state: BoardState): void {
    this.lastState = state;
    const senteView = this.viewpoint === "sente";
    // 手前側（右カラム・正立表示）プレイヤーの手番。
    const bottomColor = senteView ? Color.BLACK : Color.WHITE;
    const topColor = senteView ? Color.WHITE : Color.BLACK;

    // 盤面セル
    for (let d = 0; d < 81; d++) {
      const sqIndex = senteView ? d : 80 - d;
      const cellEl = this.cells[d];
      const textEl = this.pieceTexts[d];
      // 回転・成り表示は駒字を内包する <svg> に当てる（回転は字形中心まわりで対称）。
      const svgEl = textEl.parentElement as unknown as SVGElement;
      const cell = state.cells[sqIndex];
      if (cell) {
        textEl.textContent = pieceChar(cell.type);
        svgEl.classList.toggle("is-flipped", cell.color !== bottomColor);
        svgEl.classList.toggle("is-promoted", isPromoted(cell.type));
      } else {
        textEl.textContent = "";
        svgEl.classList.remove("is-flipped");
        svgEl.classList.remove("is-promoted");
      }
      cellEl.classList.toggle("is-last", state.lastTo === sqIndex);
    }

    // マーカー（▲=先手 / △=後手）
    this.renderMarker(this.rightMarker, bottomColor);
    this.renderMarker(this.leftMarker, topColor);

    // 持ち駒（右=手前側プレイヤー、左=向こう側プレイヤー）
    this.renderHand(this.rightHand, this.handOf(state, bottomColor));
    this.renderHand(this.leftHand, this.handOf(state, topColor));

    // 座標ラベル
    this.renderCoords();

    // スライダー（トラックの塗り分け --p も更新）
    if (this.slider) {
      this.slider.max = String(state.maxPly);
      this.slider.value = String(state.ply);
      const pct = state.maxPly > 0 ? (state.ply / state.maxPly) * 100 : 0;
      this.slider.style.setProperty("--p", `${pct}%`);
    }

    // 手数カウンター
    if (this.counterCur && this.counterMax) {
      this.counterCur.textContent = String(state.ply);
      this.counterMax.textContent = ` / ${state.maxPly}`;
    }
  }

  private handOf(state: BoardState, color: Color): HandCount[] {
    return color === Color.BLACK ? state.blackHand : state.whiteHand;
  }

  private renderMarker(el: Element, color: Color): void {
    const text = el.firstElementChild;
    if (text) text.textContent = color === Color.BLACK ? "▲" : "△";
  }

  private renderHand(container: HTMLElement, hand: HandCount[]): void {
    const byType = new Map(hand.map((h) => [h.type, h.count]));
    container.textContent = "";

    // 1 マスぶんの正方箱に駒字を 1 字ずつ。駒も「なし」も同じ箱サイズなので縦間隔が揃う。
    const entries: { ch: string; n: number; cls: string }[] = [];
    for (const type of HAND_ORDER) {
      const n = byType.get(type) ?? 0;
      if (n > 0) entries.push({ ch: pieceChar(type), n, cls: "ps-hand-item" });
    }
    if (entries.length === 0) {
      entries.push({ ch: "な", n: 0, cls: "ps-hand-empty" });
      entries.push({ ch: "し", n: 0, cls: "ps-hand-empty" });
    }

    const doc = container.ownerDocument;
    for (const { ch, n, cls } of entries) {
      const svg = doc.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", cls);
      svg.setAttribute("viewBox", "0 0 100 100");
      // 駒字は字形中心 (50,50) に固定 → ▲/△ や他の駒と縦中心線が揃う。
      const text = doc.createElementNS(SVG_NS, "text");
      text.setAttribute("class", "ps-hand-char");
      text.setAttribute("x", "50");
      text.setAttribute("y", "50");
      text.textContent = ch;
      svg.appendChild(text);
      // 枚数は駒字を動かさないよう右脇に小さく添える（2 枚以上のとき）。
      if (n > 1) {
        const num = doc.createElementNS(SVG_NS, "text");
        num.setAttribute("class", "ps-hand-num");
        num.setAttribute("x", "102");
        num.setAttribute("y", "74");
        num.textContent = String(n);
        svg.appendChild(num);
      }
      container.appendChild(svg);
    }
  }
}
