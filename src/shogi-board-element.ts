import type { Record } from "tsshogi";
import { BoardView } from "./board-view";
import { parseKif, readState } from "./parser";
import { STYLE } from "./styles";
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
  private connectedOnce = false;
  /** 最後に表示へ反映した属性一式（再接続時の rebuild 要否判定用）。 */
  private builtFor: string | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.connectedOnce = true;
    // 属性が変わらないままの再接続（DOM 移動など）は現在の表示・手数を維持する。
    if (this.view && this.builtFor === this.attrSignature()) return;
    this.rebuild();
  }

  disconnectedCallback(): void {
    this.stopAutoplay();
  }

  attributeChangedCallback(name: string): void {
    if (this.reflecting) {
      this.builtFor = this.attrSignature();
      return;
    }
    // アップグレード時は attributeChangedCallback → connectedCallback の順で呼ばれる。
    // 初回の構築は connectedCallback の rebuild に任せ、二重構築を避ける。
    if (!this.connectedOnce || !this.isConnected) return;
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
    this.builtFor = this.attrSignature();
  }

  /** 観測対象の属性ぜんぶを 1 つの文字列に畳む（比較専用）。 */
  private attrSignature(): string {
    return JSON.stringify([
      this.getAttribute("kif"),
      this.getAttribute("teban"),
      this.getAttribute("nanteme"),
      this.hasAttribute("no-slider"),
    ]);
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
      this.record = null;
      this.builtFor = this.attrSignature();
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
    this.builtFor = this.attrSignature();
  }

  private renderError(message: string): void {
    const div = this.ownerDocument.createElement("div");
    div.className = "ps-error";
    div.textContent = `[pico-shogi] ${message}`;
    const style = this.ownerDocument.createElement("style");
    style.textContent = STYLE;
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
