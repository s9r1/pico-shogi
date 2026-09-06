// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { defineShogiBoard, ShogiBoardElement } from "../src/index";

const STANDARD_SFEN =
  "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";

function mount(html: string): ShogiBoardElement {
  document.body.innerHTML = html;
  const el = document.body.querySelector("shogi-board");
  if (!(el instanceof ShogiBoardElement)) throw new Error("upgrade failed");
  return el;
}

function shadow(el: ShogiBoardElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error("no shadow root");
  return root;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("defineShogiBoard", () => {
  it("既定タグ名は自動登録されている", () => {
    expect(customElements.get("shogi-board")).toBeDefined();
  });

  it("別タグ名でも例外を投げずに登録できる", () => {
    expect(() => defineShogiBoard("test-shogi")).not.toThrow();
    const el = document.createElement("test-shogi");
    expect(el).toBeInstanceOf(ShogiBoardElement);
  });

  it("登録済みタグ名の再呼び出しは no-op", () => {
    expect(() => {
      defineShogiBoard();
      defineShogiBoard("test-shogi");
    }).not.toThrow();
  });
});

describe("ShogiBoardElement", () => {
  it("SFEN 局面から盤を描画し、駒が 40 枚表示される", () => {
    const el = mount(`<shogi-board kif="${STANDARD_SFEN}"></shogi-board>`);
    const pieces = [...shadow(el).querySelectorAll(".ps-piece text")].filter(
      (t) => (t.textContent ?? "").length > 0,
    );
    expect(pieces.length).toBe(40);
  });

  it("不正な kif は盤を出さずエラー表示する", () => {
    const el = mount(`<shogi-board kif="これは将棋ではありません"></shogi-board>`);
    expect(shadow(el).querySelector(".ps-error")).not.toBeNull();
    expect(shadow(el).querySelector(".ps-board")).toBeNull();
  });

  it("no-slider で操作行が消える", () => {
    const el = mount(`<shogi-board kif="${STANDARD_SFEN}" no-slider></shogi-board>`);
    expect(shadow(el).querySelector(".ps-controls")).toBeNull();
    const el2 = mount(`<shogi-board kif="${STANDARD_SFEN}"></shogi-board>`);
    expect(shadow(el2).querySelector(".ps-controls")).not.toBeNull();
  });

  it("nanteme=-1 で最終手が初期表示される", () => {
    const el = mount(
      `<shogi-board kif="startpos moves 7g7f 3c3d 2g2f" nanteme="-1"></shogi-board>`,
    );
    expect(shadow(el).querySelector(".ps-counter-cur")?.textContent).toBe("3");
  });

  it("盤の右半分クリックで 1 手進む", () => {
    const el = mount(`<shogi-board kif="startpos moves 7g7f 3c3d"></shogi-board>`);
    const next = shadow(el).querySelector(".ps-click-next");
    (next as HTMLElement).click();
    expect(shadow(el).querySelector(".ps-counter-cur")?.textContent).toBe("1");
  });

  it("属性が同じままの再接続では表示手数を維持する", () => {
    const el = mount(`<shogi-board kif="startpos moves 7g7f 3c3d"></shogi-board>`);
    (shadow(el).querySelector(".ps-click-next") as HTMLElement).click();
    expect(shadow(el).querySelector(".ps-counter-cur")?.textContent).toBe("1");

    el.remove();
    document.body.appendChild(el);
    expect(shadow(el).querySelector(".ps-counter-cur")?.textContent).toBe("1");
  });

  it("kif 属性の変更で盤を作り直す", () => {
    const el = mount(`<shogi-board kif="${STANDARD_SFEN}"></shogi-board>`);
    el.setAttribute("kif", "startpos moves 7g7f");
    expect(shadow(el).querySelector(".ps-counter-cur")).not.toBeNull();
    expect(shadow(el).querySelectorAll(".ps-board").length).toBe(1);
  });
});
