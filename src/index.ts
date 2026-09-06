import { ShogiBoardElement } from "./shogi-board-element";

export { ShogiBoardElement };

/**
 * <shogi-board>（または任意のタグ名）をまだ未登録なら登録する。
 * registry を渡すと popout ウィンドウ等、別ドキュメントのレジストリにも登録できる。
 */
export function defineShogiBoard(
  tagName = "shogi-board",
  registry?: CustomElementRegistry,
): void {
  const reg =
    registry ?? (typeof customElements === "undefined" ? undefined : customElements);
  if (!reg) return;
  if (reg.get(tagName)) return;
  try {
    reg.define(tagName, ShogiBoardElement);
  } catch {
    // 同一クラスは 1 レジストリに 1 度しか define できないため、
    // 2 つ目以降のタグ名には ShogiBoardElement のサブクラスを登録する。
    // （タグ名不正など他の理由の失敗は、この再 define が同じ例外を投げ直す。）
    reg.define(tagName, class extends ShogiBoardElement {});
  }
}

// バンドル読み込み時に自動登録する（<script> を置くだけで使える）。
defineShogiBoard();
