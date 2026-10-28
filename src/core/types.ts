// Shared types for the typesetting core. No Figma dependency.

export type NumeralMode = 'tcy' | 'sideways' | 'kanji' | 'kanji-place' | 'upright';
export type LatinMode = 'sideways' | 'tcy' | 'upright';
export type FormsMode = 'unicode' | 'rotate' | 'none';

export interface Settings {
  /** How digit runs (2024, 076-241) are set. */
  numerals: NumeralMode;
  /** How Latin words (TEL, example@example.com) are set. */
  latin: LatinMode;
  /** Longest run set as tate-chu-yoko (one horizontal cell). */
  tcyMax: number;
  /** How vertical punctuation is drawn: Unicode vertical forms, rotated cells, or untouched. */
  forms: FormsMode;
  /** Apply line-head / line-end prohibition rules. */
  kinsoku: boolean;
  /** Let 、。 hang past the column limit by one cell. */
  hang: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  numerals: 'tcy',
  latin: 'sideways',
  tcyMax: 2,
  forms: 'unicode',
  kinsoku: true,
  hang: false,
};

/**
 * One typeset unit. `src` is the original source text (concatenating all `src`
 * of a paragraph reproduces it exactly); `text` is what is drawn.
 */
export type CellKind = 'char' | 'tcy' | 'sideways' | 'rotchar' | 'shift';

export interface Cell {
  kind: CellKind;
  src: string;
  text: string;
  /** Number of advance units the cell occupies along the column. */
  span: number;
  noHead?: boolean;
  noEnd?: boolean;
  /** Must stay together with the next cell (……, ——). */
  noSplit?: boolean;
  /** May hang past the column limit (、。). */
  hangable?: boolean;
}

export interface ColumnLayout {
  cells: Cell[];
  /** Total span used (may exceed capacity by one when a hung cell is present). */
  used: number;
  /** First column of a paragraph. */
  para: boolean;
  hung: boolean;
}
