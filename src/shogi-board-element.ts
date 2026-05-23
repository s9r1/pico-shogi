import type { Record } from "tsshogi";
import { BoardView } from "./board-view";
import { parseKif, readState } from "./parser";
import type { Viewpoint } from "./types";

const DEFAULT_AUTOPLAY_MS = 1000;

/**
 * <shogi-board kif="..."> Web Component。
 *
 * 属性:
 *  - kif:      SFEN 局面 または USI 指し手列（必須）
 *  - teban:    "sente" | "gote"（盤の向き。既定 sente）
 *  - ply:      初期表示手数。-1 で最終局面（既定 0）
 *  - slider:   属性が在ればスライダーを表示
 *  - autoplay: 属性が在れば自動再生（値があれば間隔 ms、既定 1000）
 */
export class ShogiBoardElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["kif", "teban", "ply", "slider", "autoplay"];
  }

  private shadow: ShadowRoot;
  private view: BoardView | null = null;
  private record: Record | null = null;
  private currentPly = 0;
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private reflecting = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.rebuild();
  }

  disconnectedCallback(): void {
    this.stopAutoplay();
  }

  attributeChangedCallback(name: string): void {
    if (this.reflecting) return;
    if (!this.isConnected) return;
    switch (name) {
      case "kif":
      case "slider":
        // 入力や構造が変わるので作り直す。
        this.rebuild();
        break;
      case "teban":
        this.view?.setViewpoint(this.viewpoint());
        break;
      case "ply":
        this.seek(this.initialPly());
        break;
      case "autoplay":
        this.restartAutoplay();
        break;
    }
  }

  // --- 属性の読み取り ---

  private viewpoint(): Viewpoint {
    return this.getAttribute("teban") === "gote" ? "gote" : "sente";
  }

  private initialPly(): number {
    const raw = this.getAttribute("ply");
    if (raw === null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  private autoplayInterval(): number | null {
    if (!this.hasAttribute("autoplay")) return null;
    const raw = this.getAttribute("autoplay");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_AUTOPLAY_MS;
  }

  // --- 構築・描画 ---

  private rebuild(): void {
    this.stopAutoplay();
    this.shadow.textContent = "";
    this.view = null;

    const kif = this.getAttribute("kif") ?? "";
    const result = parseKif(kif);
    if (!result.ok) {
      this.renderError(result.error);
      return;
    }
    this.record = result.record;

    this.view = new BoardView(
      this.ownerDocument,
      {
        onPrev: () => this.seek(this.currentPly - 1),
        onNext: () => this.seek(this.currentPly + 1),
        onRotate: () => this.toggleViewpoint(),
        onSeek: (ply) => this.seek(ply),
      },
      { viewpoint: this.viewpoint(), showSlider: this.hasAttribute("slider") },
    );
    this.shadow.append(this.view.styleEl, this.view.root);

    // 初期手数を反映してから描画。
    const state = readState(this.record, this.initialPly());
    this.currentPly = state.ply;
    this.view.update(state);

    this.restartAutoplay();
  }

  private renderError(message: string): void {
    const div = this.ownerDocument.createElement("div");
    div.className = "ps-error";
    div.textContent = `[pico-shogi] ${message}`;
    const style = this.ownerDocument.createElement("style");
    style.textContent =
      ".ps-error{padding:8px 12px;border:1px solid #d99;background:#fdecec;color:#a33;font-family:sans-serif;font-size:13px;border-radius:4px}";
    this.shadow.append(style, div);
  }

  /** 手数を移動して再描画（範囲外はクランプ。autoplay 中の手動操作は停止）。 */
  private seek(ply: number): void {
    if (!this.record || !this.view) return;
    const state = readState(this.record, ply);
    this.currentPly = state.ply;
    this.view.update(state);
  }

  private toggleViewpoint(): void {
    const next: Viewpoint = this.viewpoint() === "sente" ? "gote" : "sente";
    this.reflecting = true;
    this.setAttribute("teban", next);
    this.reflecting = false;
    this.view?.setViewpoint(next);
  }

  // --- 自動再生 ---

  private restartAutoplay(): void {
    this.stopAutoplay();
    const interval = this.autoplayInterval();
    if (interval === null || !this.record) return;
    this.autoplayTimer = setInterval(() => {
      if (!this.record) return;
      // 最終手まで進んだら先頭に戻して繰り返す。
      const nextPly =
        this.currentPly >= this.record.length ? 0 : this.currentPly + 1;
      this.seek(nextPly);
    }, interval);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer !== null) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}
