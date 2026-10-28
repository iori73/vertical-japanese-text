// Paragraphs + settings + column capacity -> column plans. The one entry point the
// Figma adapter calls.

import { layoutBlock } from './layout.ts';
import { planColumn, type ColumnPlan } from './model.ts';
import { segment } from './segment.ts';
import type { Settings } from './types.ts';

export interface TypesetInput {
  paragraphs: string[];
  settings: Settings;
  fontSize: number;
  /** Distance between characters along a column (px). */
  advance: number;
  /** Cells that fit in one column. */
  capacity: number;
}

export function typeset(input: TypesetInput): ColumnPlan[] {
  const { paragraphs, settings, fontSize, advance, capacity } = input;
  const seg = { fontSize, advance };
  const cols = layoutBlock(
    paragraphs.map((p) => ({ cells: segment(p, settings, seg) })),
    settings,
    { capacity, fontSize, advance },
  );
  return cols.map(planColumn);
}

/**
 * Cells per column for a frame of the given inner height. Figma stores sizes as
 * float32, so 24 x 16.64 comes back as 399.35998; a 0.01px tolerance keeps that a 24.
 */
export function capacityFor(innerHeight: number, advance: number): number {
  return Math.max(1, Math.floor((innerHeight + 0.01) / advance));
}
