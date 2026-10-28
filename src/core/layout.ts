// Cells + column capacity -> columns, with kinsoku and hanging punctuation.

import { sidewaysSpan } from './segment.ts';
import type { Cell, ColumnLayout, Settings } from './types.ts';

export interface LayoutOptions {
  /** Cells that fit in one column (frame height / advance). */
  capacity: number;
  fontSize: number;
  advance: number;
}

/** Split a sideways cell wider than a whole column into pieces that fit. */
function splitOversize(cell: Cell, o: LayoutOptions): Cell[] {
  if (cell.kind !== 'sideways' || cell.span <= o.capacity) return [cell];
  const out: Cell[] = [];
  let buf = '';
  const flush = () => {
    if (buf) {
      out.push({
        kind: 'sideways',
        src: buf,
        text: buf,
        span: sidewaysSpan(buf, o.fontSize, o.advance),
      });
      buf = '';
    }
  };
  for (const ch of cell.text) {
    if (buf && sidewaysSpan(buf + ch, o.fontSize, o.advance) > o.capacity) flush();
    buf += ch;
  }
  flush();
  // `text` is NFKC-normalized and may differ from `src`; keep src exact on the first piece.
  if (out.length > 0 && cell.src !== cell.text) {
    out[0].src = cell.src;
    for (let i = 1; i < out.length; i++) out[i].src = '';
  }
  return out;
}

function spanSum(cells: Cell[], from: number, to: number): number {
  let n = 0;
  for (let i = from; i < to; i++) n += cells[i].span;
  return n;
}

/** Lay out one paragraph. */
export function layoutParagraph(input: Cell[], s: Settings, o: LayoutOptions): ColumnLayout[] {
  const capacity = Math.max(1, Math.floor(o.capacity));
  const cells = input.flatMap((c) => splitOversize(c, { ...o, capacity }));
  const columns: ColumnLayout[] = [];
  let start = 0;
  while (start < cells.length) {
    // 1. Greedy fill: the first index that does not fit.
    let end = start;
    let used = 0;
    while (end < cells.length && used + cells[end].span <= capacity) {
      used += cells[end].span;
      end++;
    }
    if (end === start) {
      // A single cell wider than the column (kept alone rather than looping).
      used = cells[end].span;
      end++;
    }
    if (end < cells.length) {
      // 2. Hanging punctuation: tentatively let one 、。 overflow the column.
      if (s.hang && cells[end].hangable) end++;
      // 3. Oidashi: push cells to the next column until the break is legal
      //    (this also takes back a hang that would leave an illegal break).
      if (s.kinsoku) {
        while (end - start > 1 && violates(cells, end)) end--;
      }
    }
    used = spanSum(cells, start, end);
    const hung = used > capacity && !!cells[end - 1].hangable;
    columns.push({ cells: cells.slice(start, end), used, para: columns.length === 0, hung });
    start = end;
  }
  return columns;
}

/** Would breaking the column before cells[end] break a rule? */
function violates(cells: Cell[], end: number): boolean {
  const prev = cells[end - 1];
  const next = cells[end];
  return !!(next.noHead || prev.noEnd || (prev.noSplit && prev.src === next.src));
}

export interface ParagraphInput {
  cells: Cell[];
}

/** Lay out all paragraphs; every paragraph starts a fresh column. */
export function layoutBlock(
  paragraphs: ParagraphInput[],
  s: Settings,
  o: LayoutOptions,
): ColumnLayout[] {
  const out: ColumnLayout[] = [];
  for (const p of paragraphs) {
    const cols = layoutParagraph(p.cells, s, o);
    if (cols.length === 0) {
      // An empty paragraph keeps a blank column so the author's spacing survives.
      out.push({ cells: [], used: 0, para: true, hung: false });
    } else {
      out.push(...cols);
    }
  }
  return out;
}
