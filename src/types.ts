import type { Color, PieceType } from "tsshogi";

/** 盤上の1マスにある駒（手番付き）。空マスは null。 */
export interface BoardCell {
  type: PieceType;
  color: Color;
}

/** 持ち駒1種類分の集計。 */
export interface HandCount {
  type: PieceType;
  count: number;
}

/**
 * ある手数における盤面の表示用スナップショット。
 * tsshogi の Position から切り出した、描画に必要な最小限の情報。
 */
export interface BoardState {
  /** index は tsshogi の Square.index（0=「9一」, 80=「1九」）。空マスは null。 */
  cells: (BoardCell | null)[];
  /** 先手の持ち駒。 */
  blackHand: HandCount[];
  /** 後手の持ち駒。 */
  whiteHand: HandCount[];
  /** 直前手の移動先マスの index。初期局面など指し手が無い場合は null。 */
  lastTo: number | null;
  /** 現在の手番。 */
  turn: Color;
  /** 現在の手数。 */
  ply: number;
  /** 総手数。 */
  maxPly: number;
}

/** 盤の表示視点。 */
export type Viewpoint = "sente" | "gote";
