// Render plan (columns -> nodes) and the render model stored on a block.
// The model records, for every drawn node, the (drawn text, source text) pair of
// each cell. When the author edits a node on the canvas, `reconcile` diffs the
// node's current text against the model and rebuilds the original source, so
// digits typeset as kanji, forms swapped for 、。 and so on survive an edit.

import type { Cell, ColumnLayout } from './types.ts';
import { fromVerticalForm } from './vertical-forms.ts';

export type NodeKind = 'run' | 'tcy' | 'sideways' | 'rotchar' | 'shift';

export interface NodePlan {
  kind: NodeKind;
  cells: Cell[];
  /** Total span in advance units. */
  span: number;
}

export interface ColumnPlan {
  nodes: NodePlan[];
  para: boolean;
  used: number;
  hung: boolean;
}

/** Group consecutive plain characters into one run node; other cells stand alone. */
export function planColumn(col: ColumnLayout): ColumnPlan {
  const nodes: NodePlan[] = [];
  for (const cell of col.cells) {
    const last = nodes[nodes.length - 1];
    if (cell.kind === 'char') {
      if (last && last.kind === 'run') {
        last.cells.push(cell);
        last.span += cell.span;
      } else {
        nodes.push({ kind: 'run', cells: [cell], span: cell.span });
      }
    } else {
      nodes.push({ kind: cell.kind, cells: [cell], span: cell.span });
    }
  }
  return { nodes, para: col.para, used: col.used, hung: col.hung };
}

export type Entry = [text: string, src: string];

export interface ModelNode {
  id: string;
  kind: NodeKind;
  entries: Entry[];
}

export interface ModelColumn {
  id: string;
  para: boolean;
  nodes: ModelNode[];
}

export interface Model {
  cols: ModelColumn[];
  /** Per-cell entries were dropped to fit pluginData; canvas edits cannot be reconciled. */
  lite?: boolean;
}

// Compact storage. pluginData allows ~100KB per node, and CJK text costs 3 bytes a
// character, so an entry is stored as just its drawn text when the source is identical.
const SEP_FIELD = '\u0001';
const SEP_ENTRY = '\u0002';

/** Above this many characters the per-cell entries are dropped (edits then fall back to plain mapping). */
export const MODEL_LIMIT = 40000;

export function encodeModel(model: Model): string {
  const compact = (lite: boolean) =>
    JSON.stringify({
      lite,
      cols: model.cols.map((c) => ({
        id: c.id,
        para: c.para,
        nodes: c.nodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          e: lite
            ? ''
            : n.entries.map(([t, s]) => (t === s ? t : t + SEP_FIELD + s)).join(SEP_ENTRY),
        })),
      })),
    });
  const full = compact(false);
  return full.length <= MODEL_LIMIT ? full : compact(true);
}

export function decodeModel(raw: string): Model | null {
  try {
    const parsed = JSON.parse(raw) as {
      lite?: boolean;
      cols: { id: string; para: boolean; nodes: { id: string; kind: NodeKind; e: string }[] }[];
    };
    return {
      lite: parsed.lite === true,
      cols: parsed.cols.map((c) => ({
        id: c.id,
        para: c.para,
        nodes: c.nodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          entries:
            n.e === ''
              ? []
              : n.e.split(SEP_ENTRY).map((e): Entry => {
                  const i = e.indexOf(SEP_FIELD);
                  return i < 0 ? [e, e] : [e.slice(0, i), e.slice(i + 1)];
                }),
        })),
      })),
    };
  } catch {
    return null;
  }
}

export function entriesOf(node: NodePlan): Entry[] {
  return node.cells.map((c) => [c.text, c.src]);
}

/** The text a node must show (runs: one cell per line). */
export function nodeText(node: NodePlan): string {
  return node.kind === 'run' ? node.cells.map((c) => c.text).join('\n') : node.cells[0].text;
}

export interface CurrentNode {
  id: string;
  kind: NodeKind;
  text: string;
}

export interface CurrentColumn {
  id: string;
  nodes: CurrentNode[];
}

function newRenders(node: CurrentNode): string[] {
  if (node.kind !== 'run') return node.text === '' ? [] : [node.text];
  const out: string[] = [];
  for (const line of node.text.split('\n')) {
    // Blank lines carry no cell; a pasted multi-character line becomes one cell per character.
    for (const ch of line) out.push(ch);
  }
  return out;
}

function sameRenders(old: Entry[], now: string[]): boolean {
  return old.length === now.length && old.every((e, i) => e[0] === now[i]);
}

function diffEntries(old: Entry[], now: string[]): string[] {
  let p = 0;
  while (p < old.length && p < now.length && old[p][0] === now[p]) p++;
  let q = 0;
  while (
    q < old.length - p &&
    q < now.length - p &&
    old[old.length - 1 - q][0] === now[now.length - 1 - q]
  ) {
    q++;
  }
  const out: string[] = [];
  for (let i = 0; i < p; i++) out.push(old[i][1]);
  for (let i = p; i < now.length - q; i++) out.push(fromVerticalForm(now[i]));
  for (let i = old.length - q; i < old.length; i++) out.push(old[i][1]);
  return out;
}

/**
 * Rebuild the source paragraphs from what is on the canvas now.
 * `current` must be in reading order (rightmost column first).
 */
export function reconcile(model: Model, current: CurrentColumn[]): string[] | null {
  // Without per-cell entries an edit cannot be told apart from typesetting changes.
  if (model.lite) return null;
  const nodeById = new Map<string, ModelNode>();
  const colById = new Map<string, ModelColumn>();
  for (const c of model.cols) {
    colById.set(c.id, c);
    for (const n of c.nodes) nodeById.set(n.id, n);
  }
  const paragraphs: string[] = [];
  current.forEach((col, i) => {
    let src = '';
    for (const node of col.nodes) {
      const now = newRenders(node);
      const old = nodeById.get(node.id);
      if (!old) src += now.map(fromVerticalForm).join('');
      else if (sameRenders(old.entries, now)) src += old.entries.map((e) => e[1]).join('');
      else src += diffEntries(old.entries, now).join('');
    }
    const para = i === 0 || (colById.get(col.id)?.para ?? false);
    if (para || paragraphs.length === 0) paragraphs.push(src);
    else paragraphs[paragraphs.length - 1] += src;
  });
  return paragraphs;
}

/** Small stable string hash (djb2), used to skip re-rendering identical input. */
export function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
