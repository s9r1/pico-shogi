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
 *  - teban:     "sente" | "gote"（盤の向き。既定 sente）
 *  - nanteme:   初期表示手数。負値は末尾からの相対（-1=最終手, -2=その1手前 …）（既定 0）
 *  - no-slider: 属性が在れば再生ボタン・スライダー・手数カウンターを隠す（既定は表示）
 */
export class ShogiBoardElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["kif", "teban", "nanteme", "no-slider"];
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
      case "no-slider":
        // 入力や構造（操作行の有無）が変わるので作り直す。
        this.rebuild();
        break;
      case "teban":
        this.view?.setViewpoint(this.viewpoint());
        break;
      case "nanteme":
        this.seek(this.initialPly());
        break;
    }
  }

  // --- 属性の読み取り ---

  private viewpoint(): Viewpoint {
    return this.getAttribute("teban") === "gote" ? "gote" : "sente";
  }

  private initialPly(): number {
    const raw = this.getAttribute("nanteme");
    if (raw === null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
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
        onTogglePlay: () => this.togglePlay(),
      },
      {
        viewpoint: this.viewpoint(),
        showSlider: !this.hasAttribute("no-slider"),
      },
    );
    this.shadow.append(this.view.styleEl, this.view.root);

    // 初期手数を反映してから描画。自動再生は再生ボタンが押されるまで開始しない。
    const state = readState(this.record, this.initialPly());
    this.currentPly = state.ply;
    this.view.update(state);
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

  /** 手数を移動して再描画（範囲外はクランプ）。 */
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

  // --- 自動再生（再生ボタンで開始・停止） ---

  /** 再生ボタンのトグル。停止中なら再生開始、再生中なら停止。 */
  private togglePlay(): void {
    if (this.autoplayTimer !== null) {
      this.stopAutoplay();
      return;
    }
    if (!this.record) return;
    const interval = DEFAULT_AUTOPLAY_MS;
    // 最終手で押されたら先頭から再生し直す。
    if (this.currentPly >= this.record.length) this.seek(0);
    this.view?.setPlaying(true);
    this.autoplayTimer = setInterval(() => {
      if (!this.record) return;
      // 最終手に達したら停止する。
      if (this.currentPly >= this.record.length) {
        this.stopAutoplay();
        return;
      }
      this.seek(this.currentPly + 1);
    }, interval);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer !== null) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
    this.view?.setPlaying(false);
  }
}
