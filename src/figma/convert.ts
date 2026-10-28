// Turn existing nodes into blocks, create new blocks, and describe the selection.

import { capacityFor } from '../core/typeset.ts';
import { fromVerticalForm } from '../core/vertical-forms.ts';
import type { BlockInfo, SelectionState } from '../protocol.ts';
import {
  KEY_CONFIG,
  KEY_MODEL,
  KEY_SIG,
  defaultConfig,
  findBlock,
  readConfig,
  writeConfig,
  type BlockConfig,
  type BlockFill,
} from './block.ts';
import { renderBlock } from './render.ts';
import type { Store } from './store.ts';

const DEFAULT_FONT = { family: 'Noto Sans JP', style: 'Regular' };

function collectTexts(node: SceneNode, out: TextNode[] = []): TextNode[] {
  if (node.type === 'TEXT') out.push(node);
  else if ('children' in node) for (const c of node.children) collectTexts(c, out);
  return out;
}

function solidFill(t: TextNode): BlockFill | null {
  const f = t.fills;
  if (f === figma.mixed || f.length === 0) return null;
  const p = f[0];
  if (p.type !== 'SOLID') return null;
  return { r: p.color.r, g: p.color.g, b: p.color.b, opacity: p.opacity ?? 1 };
}

function lineHeightPx(t: TextNode, fontSize: number): number | null {
  const lh = t.lineHeight;
  if (lh === figma.mixed || lh.unit === 'AUTO') return null;
  return lh.unit === 'PIXELS' ? lh.value : (lh.value / 100) * fontSize;
}

/** Style fields read from a TEXT node, or null when the node has mixed styling. */
function styleFrom(t: TextNode): Partial<BlockConfig> | null {
  const fontName = t.fontName;
  const fontSize = t.fontSize;
  if (fontName === figma.mixed || fontSize === figma.mixed) return null;
  const out: Partial<BlockConfig> = {
    fontFamily: fontName.family,
    fontStyle: fontName.style,
    fontSize,
  };
  const fill = solidFill(t);
  if (fill) out.fill = fill;
  return out;
}

/** Style of the first plain-character run in a block (cells are frames, so they are skipped). */
export function runStyleOf(block: FrameNode): Partial<BlockConfig> | null {
  for (const kid of block.children) {
    if (kid.type === 'TEXT') return styleFrom(kid);
    if (kid.type === 'FRAME') {
      for (const inner of kid.children) if (inner.type === 'TEXT') return styleFrom(inner);
    }
  }
  return null;
}

function linesOf(t: TextNode): string[] {
  const out: string[] = [];
  for (const line of t.characters.split('\n')) for (const ch of line) out.push(fromVerticalForm(ch));
  return out;
}

/** Read an existing "horizontal frame of vertical columns" into paragraphs. */
function adoptColumns(frame: FrameNode): string[] {
  // Children run in reverse reading order (last child = rightmost column).
  const cols = [...frame.children].reverse().map((c) => collectTexts(c).flatMap(linesOf));
  const max = Math.max(1, ...cols.map((c) => c.length));
  const paragraphs: string[] = [];
  let cur = '';
  cols.forEach((cells, i) => {
    cur += cells.join('');
    // A column shorter than the fullest one ends its paragraph.
    if (cells.length < max && i < cols.length - 1) {
      paragraphs.push(cur);
      cur = '';
    }
  });
  paragraphs.push(cur);
  return paragraphs;
}

async function loadAvailable(cfg: BlockConfig): Promise<BlockConfig> {
  try {
    await figma.loadFontAsync({ family: cfg.fontFamily, style: cfg.fontStyle });
    return cfg;
  } catch {
    await figma.loadFontAsync(DEFAULT_FONT);
    return { ...cfg, fontFamily: DEFAULT_FONT.family, fontStyle: DEFAULT_FONT.style };
  }
}

export function adoptsAsFrame(node: SceneNode): node is FrameNode {
  return node.type === 'FRAME' && node.layoutMode === 'HORIZONTAL' && node.children.length > 0;
}

/** Selection -> block. Replaces a plain TEXT, or adopts a horizontal frame of columns in place. */
export async function convertNode(store: Store, node: SceneNode): Promise<FrameNode> {
  if (node.type === 'TEXT') return convertText(store, node);
  if (adoptsAsFrame(node)) return convertFrame(store, node);
  throw new Error('縦書きブロックにできるのは、テキスト、または横向き Auto Layout のフレームです。');
}

async function convertText(store: Store, t: TextNode): Promise<FrameNode> {
  const style = styleFrom(t) ?? {};
  const fontSize = style.fontSize ?? 16;
  const lh = lineHeightPx(t, fontSize);
  const base = defaultConfig({ fontSize });
  const cfg = await loadAvailable({
    ...base,
    ...style,
    paragraphs: t.characters.split(/\r?\n/),
    pitch: lh ?? base.pitch,
  });
  const parent = t.parent as (BaseNode & ChildrenMixin) | null;
  if (!parent) throw new Error('親が見つかりません。');
  const index = parent.children.indexOf(t);
  const frame = figma.createFrame();
  frame.name = `縦書き: ${t.characters.replace(/\s+/g, ' ').slice(0, 12)}`;
  frame.fills = [];
  frame.clipsContent = false;
  parent.insertChild(index, frame);
  frame.x = t.x;
  frame.y = t.y;
  // Rotate the intuition by 90 degrees: the text's width becomes the column length.
  const height = Math.min(2000, Math.max(cfg.advance * 6, t.width > 0 ? t.width : cfg.advance * 20));
  frame.resize(Math.max(1, cfg.pitch), height);
  writeConfig(store, frame, cfg);
  t.remove();
  await renderBlock(store, frame, { force: true });
  return frame;
}

async function convertFrame(store: Store, frame: FrameNode): Promise<FrameNode> {
  const texts = collectTexts(frame);
  const first = texts[0];
  const style = (first && styleFrom(first)) ?? {};
  const fontSize = style.fontSize ?? 16;
  const base = defaultConfig({ fontSize });
  const lh = first ? lineHeightPx(first, fontSize) : null;
  const cfg = await loadAvailable({
    ...base,
    ...style,
    paragraphs: adoptColumns(frame),
    advance: lh ?? base.advance,
    pitch: first && first.width > 0 ? Math.round(first.width * 100) / 100 : base.pitch,
  });
  writeConfig(store, frame, cfg);
  store.set(frame, KEY_MODEL, '');
  store.set(frame, KEY_SIG, '');
  await renderBlock(store, frame, { force: true });
  return frame;
}

/** New block at the center of the viewport. */
export async function createBlock(
  store: Store,
  paragraphs: string[],
  style: Partial<BlockConfig> | null,
): Promise<FrameNode> {
  const base = defaultConfig(style?.fontSize ? { fontSize: style.fontSize } : {});
  const cfg = await loadAvailable({ ...base, ...(style ?? {}), paragraphs });
  const frame = figma.createFrame();
  frame.name = '縦書き';
  frame.fills = [];
  frame.clipsContent = false;
  figma.currentPage.appendChild(frame);
  const height = cfg.advance * 20;
  frame.resize(Math.max(1, cfg.pitch), height);
  const c = figma.viewport.center;
  frame.x = Math.round(c.x - frame.width / 2);
  frame.y = Math.round(c.y - height / 2);
  writeConfig(store, frame, cfg);
  await renderBlock(store, frame, { force: true });
  return frame;
}

export function unblock(store: Store, frame: FrameNode): void {
  for (const key of [KEY_CONFIG, KEY_MODEL, KEY_SIG]) store.set(frame, key, '');
}

export function blockInfo(store: Store, frame: FrameNode): BlockInfo | null {
  const cfg = readConfig(store, frame);
  if (!cfg) return null;
  const inner = frame.height - frame.paddingTop - frame.paddingBottom;
  return {
    id: frame.id,
    name: frame.name,
    paragraphs: cfg.paragraphs,
    settings: cfg.settings,
    fontFamily: cfg.fontFamily,
    fontStyle: cfg.fontStyle,
    fontSize: cfg.fontSize,
    advance: cfg.advance,
    pitch: cfg.pitch,
    columns: frame.children.length,
    capacity: capacityFor(inner, cfg.advance),
    height: Math.round(frame.height),
  };
}

export function describeSelection(store: Store): SelectionState {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) return { kind: 'none' };
  if (sel.length > 1) return { kind: 'unsupported', reason: '1 つだけ選んでください。' };
  const node = sel[0];
  const block = findBlock(store, node);
  if (block) {
    const info = blockInfo(store, block);
    if (info) return { kind: 'block', info };
  }
  if (node.type === 'TEXT') return { kind: 'convertible', what: 'text', name: node.name };
  if (adoptsAsFrame(node)) return { kind: 'convertible', what: 'frame', name: node.name };
  return {
    kind: 'unsupported',
    reason: 'テキスト、または横向き Auto Layout のフレームを選んでください。',
  };
}
