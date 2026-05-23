import { ShogiBoardElement } from "./shogi-board-element";

export { ShogiBoardElement };

/** <shogi-board> をまだ未登録なら登録する。 */
export function defineShogiBoard(tagName = "shogi-board"): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ShogiBoardElement);
  }
}

// バンドル読み込み時に自動登録する（<script> を置くだけで使える）。
defineShogiBoard();
