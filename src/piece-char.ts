import { PieceType } from "tsshogi";

/**
 * 駒種 → 漢字一字。成駒も将棋本で一般的な一字表記を用いる。
 * （成香=杏, 成桂=圭, 成銀=全, 馬, 龍）
 */
const PIECE_CHAR: Record<PieceType, string> = {
  [PieceType.PAWN]: "歩",
  [PieceType.LANCE]: "香",
  [PieceType.KNIGHT]: "桂",
  [PieceType.SILVER]: "銀",
  [PieceType.GOLD]: "金",
  [PieceType.BISHOP]: "角",
  [PieceType.ROOK]: "飛",
  [PieceType.KING]: "玉",
  [PieceType.PROM_PAWN]: "と",
  [PieceType.PROM_LANCE]: "杏",
  [PieceType.PROM_KNIGHT]: "圭",
  [PieceType.PROM_SILVER]: "全",
  [PieceType.HORSE]: "馬",
  [PieceType.DRAGON]: "龍",
};

/** 駒種に対応する漢字一字を返す。 */
export function pieceChar(type: PieceType): string {
  return PIECE_CHAR[type] ?? "";
}

/** 持ち駒の表示順（飛・角・金・銀・桂・香・歩）。 */
export const HAND_ORDER: PieceType[] = [
  PieceType.ROOK,
  PieceType.BISHOP,
  PieceType.GOLD,
  PieceType.SILVER,
  PieceType.KNIGHT,
  PieceType.LANCE,
  PieceType.PAWN,
];
