import { describe, expect, it } from "vitest";
import { Color, PieceType } from "tsshogi";
import { parseKif, readState } from "../src/parser";

const STANDARD_SFEN =
  "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";

describe("parseKif", () => {
  it("SFEN 局面をパースできる（0手）", () => {
    const r = parseKif(STANDARD_SFEN);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.maxPly).toBe(0);
  });

  it("USI 指し手列をパースできる", () => {
    const r = parseKif("startpos moves 7g7f 3c3d 8h2b+");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.maxPly).toBe(3);
  });

  it("position sfen 形式の USI もパースできる", () => {
    const r = parseKif(`position sfen ${STANDARD_SFEN} moves 7g7f`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.maxPly).toBe(1);
  });

  it("空文字はエラー", () => {
    const r = parseKif("   ");
    expect(r.ok).toBe(false);
  });

  it("不正な文字列はエラー（例外を投げない）", () => {
    const r = parseKif("これは将棋ではありません");
    expect(r.ok).toBe(false);
  });
});

describe("readState", () => {
  it("初期局面の盤面・手番を取得できる", () => {
    const r = parseKif(STANDARD_SFEN);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = readState(r.record, 0);
    // 駒は計40枚。
    expect(s.cells.filter((c) => c !== null).length).toBe(40);
    // index 0 = 「9一」は後手の香。
    expect(s.cells[0]).toEqual({ type: PieceType.LANCE, color: Color.WHITE });
    expect(s.turn).toBe(Color.BLACK);
    expect(s.lastTo).toBeNull();
    expect(s.maxPly).toBe(0);
  });

  it("goto で指定手数の局面と最終手が取れる", () => {
    const r = parseKif("startpos moves 7g7f 3c3d");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s1 = readState(r.record, 1);
    expect(s1.ply).toBe(1);
    expect(s1.lastTo).not.toBeNull(); // 7六に歩
    expect(s1.turn).toBe(Color.WHITE);
    const s2 = readState(r.record, 2);
    expect(s2.ply).toBe(2);
    expect(s2.turn).toBe(Color.BLACK);
  });

  it("負値は末尾からの相対指定に解決される（-1=最終手, -2=その1手前）", () => {
    const r = parseKif("startpos moves 7g7f 3c3d 2g2f");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(readState(r.record, -1).ply).toBe(3); // 最終手
    expect(readState(r.record, -2).ply).toBe(2);
    expect(readState(r.record, -3).ply).toBe(1);
    expect(readState(r.record, -100).ply).toBe(0); // 範囲外は 0 にクランプ
  });

  it("駒を取ると持ち駒が増える", () => {
    // 角交換で先手が角を取る。
    const r = parseKif("startpos moves 7g7f 3c3d 8h2b+");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = readState(r.record, 3);
    const bishop = s.blackHand.find((h) => h.type === PieceType.BISHOP);
    expect(bishop?.count).toBe(1);
  });
});
