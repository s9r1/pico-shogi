import {
  detectRecordFormat,
  Move,
  Position,
  Record,
  RecordFormatType,
} from "tsshogi";
import type { BoardState, HandCount } from "./types";

/** kif 文字列のパース結果。 */
export type ParseResult =
  | { ok: true; record: Record; maxPly: number }
  | { ok: false; error: string };

/**
 * SFEN 文字列から 0 手の Record を生成する。
 * 失敗時は null。
 */
function recordFromSFEN(sfen: string): Record | null {
  const position = Position.newBySFEN(sfen);
  if (!position) return null;
  return new Record(position);
}

/**
 * USI 文字列（"startpos moves ...", "position sfen ... moves ...", "sfen ..." 等）
 * から Record を生成する。失敗時は null。
 */
function recordFromUSI(usi: string): Record | null {
  const result = Record.newByUSI(usi);
  return result instanceof Error ? null : result;
}

/**
 * kif 属性の文字列（SFEN 局面 または USI 指し手列）を Record に正規化する。
 * 形式を自動判定しつつ、判定が外れても SFEN/USI 双方を試して可能な限り解釈する。
 */
export function parseKif(input: string): ParseResult {
  const data = input.trim();
  if (!data) {
    return { ok: false, error: "kif が空です" };
  }

  const fmt = detectRecordFormat(data);
  // 判定結果に応じて優先順を決め、失敗したらもう一方も試す。
  const usiFirst = fmt === RecordFormatType.USI;
  const builders = usiFirst
    ? [recordFromUSI, recordFromSFEN]
    : [recordFromSFEN, recordFromUSI];

  for (const build of builders) {
    const record = build(data);
    if (record) {
      return { ok: true, record, maxPly: record.length };
    }
  }

  if (fmt !== RecordFormatType.USI && fmt !== RecordFormatType.SFEN) {
    return {
      ok: false,
      error: "現在は SFEN と USI のみ対応しています",
    };
  }
  return { ok: false, error: "kif を解釈できませんでした" };
}

/** Hand.counts（type/count）を表示用の HandCount[] にコピーする。 */
function copyHand(counts: readonly { type: HandCount["type"]; count: number }[]): HandCount[] {
  return counts.map((c) => ({ type: c.type, count: c.count }));
}

/**
 * Record を指定手数に移動し、その局面の表示用スナップショットを返す。
 * 負値は末尾からの相対指定（-1=最終手, -2=その1手前 …）。
 * 解決後の手数は 0〜maxPly にクランプする。
 */
export function readState(record: Record, ply: number): BoardState {
  const maxPly = record.length;
  const resolved = ply < 0 ? maxPly + 1 + ply : ply;
  const target = Math.min(Math.max(resolved, 0), maxPly);
  record.goto(target);

  const pos = record.position;
  const cells: BoardState["cells"] = new Array(81).fill(null);
  for (const sq of pos.board.listNonEmptySquares()) {
    const piece = pos.board.at(sq);
    if (piece) {
      cells[sq.index] = { type: piece.type, color: piece.color };
    }
  }

  const move = record.current.move;
  const lastTo = move instanceof Move ? move.to.index : null;

  return {
    cells,
    blackHand: copyHand(pos.blackHand.counts),
    whiteHand: copyHand(pos.whiteHand.counts),
    lastTo,
    turn: pos.color,
    ply: target,
    maxPly,
  };
}
