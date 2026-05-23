import { Color } from "tsshogi";
import type { BoardState, HandCount, Viewpoint } from "./types";
import { HAND_ORDER, pieceChar } from "./piece-char";
import { STYLE } from "./styles";

/** 盤面操作のコールバック。 */
export interface BoardViewCallbacks {
  /** 盤の左半分クリック（1手戻る）。 */
  onPrev(): void;
  /** 盤の右半分クリック（1手進む）。 */
  onNext(): void;
  /** ▲/▽ マーカークリック（視点反転）。 */
  onRotate(): void;
  /** スライダー操作（手数指定）。 */
  onSeek(ply: number): void;
}

export interface BoardViewOptions {
  viewpoint: Viewpoint;
  showSlider: boolean;
}

/**
 * 盤・持ち駒・手番マーカー・スライダーを描画する。
 * DOM 構造は一度だけ構築し、update() で内容のみ差し替える。
 */
export class BoardView {
  readonly root: HTMLElement;
  private readonly cells: HTMLElement[] = [];
  private readonly leftSide: HTMLElement;
  private readonly rightSide: HTMLElement;
  private readonly leftMarker: HTMLElement;
  private readonly rightMarker: HTMLElement;
  private readonly leftHand: HTMLElement;
  private readonly rightHand: HTMLElement;
  private slider: HTMLInputElement | null = null;
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
    const boardWrap = doc.createElement("div");
    boardWrap.className = "ps-board-wrap";
    const board = doc.createElement("div");
    board.className = "ps-board";
    for (let i = 0; i < 81; i++) {
      const cell = doc.createElement("div");
      cell.className = "ps-cell";
      const piece = doc.createElement("span");
      piece.className = "ps-piece";
      cell.appendChild(piece);
      this.cells.push(cell);
      board.appendChild(cell);
    }
    const prev = doc.createElement("div");
    prev.className = "ps-click ps-click-prev";
    prev.addEventListener("click", () => this.cb.onPrev());
    const next = doc.createElement("div");
    next.className = "ps-click ps-click-next";
    next.addEventListener("click", () => this.cb.onNext());
    boardWrap.append(board, prev, next);

    // --- 右カラム（盤の手前側プレイヤー）: 持ち駒上・マーカー下 ---
    this.rightSide = doc.createElement("div");
    this.rightSide.className = "ps-side ps-side-right";
    this.rightMarker = this.createMarker(doc);
    this.rightHand = doc.createElement("div");
    this.rightHand.className = "ps-hand";
    this.rightSide.append(this.rightHand, this.rightMarker);

    main.append(this.leftSide, boardWrap, this.rightSide);
    this.root.appendChild(main);

    if (opts.showSlider) {
      this.slider = doc.createElement("input");
      this.slider.type = "range";
      this.slider.className = "ps-slider";
      this.slider.min = "0";
      this.slider.value = "0";
      this.slider.addEventListener("input", () => {
        if (this.slider) this.cb.onSeek(Number(this.slider.value));
      });
      this.root.appendChild(this.slider);
    }

    // style は root の前に置いて Shadow DOM へまとめて attach できるようにする
    this.styleEl = style;
  }

  /** Shadow DOM へ流し込む <style> 要素。 */
  readonly styleEl: HTMLStyleElement;

  private createMarker(doc: Document): HTMLElement {
    const el = doc.createElement("div");
    el.className = "ps-marker";
    el.addEventListener("click", () => this.cb.onRotate());
    return el;
  }

  setViewpoint(v: Viewpoint): void {
    if (this.viewpoint === v) return;
    this.viewpoint = v;
    if (this.lastState) this.update(this.lastState);
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
      const pieceEl = cellEl.firstElementChild as HTMLElement;
      const cell = state.cells[sqIndex];
      if (cell) {
        pieceEl.textContent = pieceChar(cell.type);
        pieceEl.classList.toggle("is-flipped", cell.color !== bottomColor);
      } else {
        pieceEl.textContent = "";
        pieceEl.classList.remove("is-flipped");
      }
      cellEl.classList.toggle("is-last", state.lastTo === sqIndex);
    }

    // マーカー（▲=先手 / ▽=後手、現在手番を強調）
    this.renderMarker(this.rightMarker, bottomColor, state.turn);
    this.renderMarker(this.leftMarker, topColor, state.turn);

    // 持ち駒（右=手前側プレイヤー、左=向こう側プレイヤー）
    this.renderHand(this.rightHand, this.handOf(state, bottomColor));
    this.renderHand(this.leftHand, this.handOf(state, topColor));

    // スライダー
    if (this.slider) {
      this.slider.max = String(state.maxPly);
      this.slider.value = String(state.ply);
    }
  }

  private handOf(state: BoardState, color: Color): HandCount[] {
    return color === Color.BLACK ? state.blackHand : state.whiteHand;
  }

  private renderMarker(el: HTMLElement, color: Color, turn: Color): void {
    el.textContent = color === Color.BLACK ? "▲" : "▽";
    el.classList.toggle("is-turn", color === turn);
  }

  private renderHand(container: HTMLElement, hand: HandCount[]): void {
    const byType = new Map(hand.map((h) => [h.type, h.count]));
    const items: string[] = [];
    for (const type of HAND_ORDER) {
      const n = byType.get(type) ?? 0;
      if (n > 0) items.push(pieceChar(type) + (n > 1 ? String(n) : ""));
    }
    container.textContent = "";
    if (items.length === 0) {
      const empty = container.ownerDocument.createElement("span");
      empty.className = "ps-hand-empty";
      empty.textContent = "なし";
      container.appendChild(empty);
      return;
    }
    for (const text of items) {
      const span = container.ownerDocument.createElement("span");
      span.className = "ps-hand-item";
      span.textContent = text;
      container.appendChild(span);
    }
  }
}
