// Draw a block: typeset the source into columns and diff-update the frame's children.
//
// Frame contract (matches a horizontal auto-layout, like horizontal text rotated 90 degrees):
//   - height  = column length limit (FIXED), the thing the author drags
//   - width   = HUG, follows the number of columns
//   - children are columns in reverse reading order (last child = rightmost column)
//   - a column is a TEXT when it holds only plain characters, else a vertical auto-layout FRAME

import {
  encodeModel,
  hash,
  nodeText,
  type ColumnPlan,
  type Model,
  type ModelColumn,
  type NodePlan,
} from '../core/model.ts';
import { capacityFor, typeset } from '../core/typeset.ts';
import { KEY_MODEL, KEY_SIG, readConfig, readModel, type BlockConfig } from './block.ts';
import type { Store } from './store.ts';

export interface RenderResult {
  columns: number;
  capacity: number;
  skipped: boolean;
}

const COLUMN_FLAG = 'tgcol';

const solid = (cfg: BlockConfig): SolidPaint => ({
  type: 'SOLID',
  color: { r: cfg.fill.r, g: cfg.fill.g, b: cfg.fill.b },
  opacity: cfg.fill.opacity,
});

function parentIsAutoLayout(frame: FrameNode): boolean {
  const p = frame.parent;
  return !!p && 'layoutMode' in p && p.layoutMode !== 'NONE' && frame.layoutPositioning !== 'ABSOLUTE';
}

/** Force the frame contract without changing the height the author set. */
function configureFrame(frame: FrameNode): void {
  const h = frame.height;
  if (frame.layoutMode !== 'HORIZONTAL') frame.layoutMode = 'HORIZONTAL';
  frame.itemSpacing = 0;
  frame.layoutWrap = 'NO_WRAP';
  // resize() resets the sizing modes to FIXED, so restore the height first, then set the modes.
  if (Math.abs(frame.height - h) > 0.01) frame.resize(frame.width, h);
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisAlignItems = 'MIN';
  frame.primaryAxisAlignItems = 'MIN';
}

/** Vertical text starts at the right edge: keep it fixed while the width hugs. */
function anchorRight(frame: FrameNode, right: number): void {
  if (!parentIsAutoLayout(frame) && Math.abs(frame.x + frame.width - right) > 0.01) {
    frame.x = right - frame.width;
  }
}

function signature(cfg: BlockConfig, capacity: number): string {
  return hash(
    JSON.stringify([
      cfg.paragraphs,
      cfg.settings,
      capacity,
      cfg.fontFamily,
      cfg.fontStyle,
      cfg.fontSize,
      cfg.advance,
      cfg.pitch,
      cfg.fill,
    ]),
  );
}

/** True when the frame's children are exactly the columns recorded in the model. */
function structureMatches(frame: FrameNode, model: Model | null): boolean {
  if (!model || model.cols.length !== frame.children.length) return false;
  const n = model.cols.length;
  return model.cols.every((c, i) => frame.children[n - 1 - i]?.id === c.id);
}

function styleRun(t: TextNode, np: NodePlan, cfg: BlockConfig): void {
  const font: FontName = { family: cfg.fontFamily, style: cfg.fontStyle };
  if (t.fontName === figma.mixed || (t.fontName as FontName).family !== font.family || (t.fontName as FontName).style !== font.style) {
    t.fontName = font;
  }
  if (t.fontSize !== cfg.fontSize) t.fontSize = cfg.fontSize;
  const text = nodeText(np);
  if (t.characters !== text) t.characters = text;
  t.lineHeight = { unit: 'PIXELS', value: cfg.advance };
  t.letterSpacing = { unit: 'PIXELS', value: 0 };
  t.textAlignHorizontal = 'CENTER';
  t.textAlignVertical = 'TOP';
  t.textAutoResize = 'HEIGHT';
  t.resize(cfg.pitch, t.height);
  t.textAutoResize = 'HEIGHT'; // resize() may have fallen back to a fixed size
  t.fills = [solid(cfg)];
}

function newText(cfg: BlockConfig): TextNode {
  const t = figma.createText();
  t.fontName = { family: cfg.fontFamily, style: cfg.fontStyle };
  return t;
}

/** Shrink `t` (auto-sized, horizontal) until it is at most `maxWidth` wide. */
function fitWidth(t: TextNode, maxWidth: number, size: number): void {
  if (t.width <= maxWidth) return;
  t.fontSize = Math.max(4, Math.floor(((size * maxWidth) / t.width) * 10) / 10);
}

function buildCell(np: NodePlan, cfg: BlockConfig): FrameNode {
  const cell = np.cells[0];
  const frameH = cfg.advance * np.span;
  const f = figma.createFrame();
  f.name = `${np.kind === 'tcy' ? '縦中横' : np.kind === 'sideways' ? '横向き' : np.kind === 'shift' ? '約物' : '回転'} ${cell.text}`;
  f.fills = [];
  f.clipsContent = false;
  f.resize(cfg.pitch, frameH);
  const t = newText(cfg);
  t.fontSize = cfg.fontSize;
  t.characters = cell.text;
  t.letterSpacing = { unit: 'PIXELS', value: 0 };
  t.lineHeight = { unit: 'PIXELS', value: cfg.advance };
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  t.fills = [solid(cfg)];
  f.appendChild(t);
  if (np.kind === 'tcy') {
    fitWidth(t, cfg.fontSize, cfg.fontSize);
    t.x = (cfg.pitch - t.width) / 2;
    t.y = (frameH - t.height) / 2;
  } else if (np.kind === 'shift') {
    // top-right of the cell, where vertical 、。 sit
    t.x = (cfg.pitch - t.width) / 2 + cfg.fontSize * 0.5;
    t.y = (frameH - t.height) / 2 - cfg.fontSize * 0.5;
  } else {
    // 90 degrees clockwise, centered: local box [0,w]x[0,h] maps to x in [tx-h, tx], y in [ty, ty+w]
    const w = t.width;
    const h = t.height;
    t.relativeTransform = [
      [0, -1, (cfg.pitch + h) / 2],
      [1, 0, (frameH - w) / 2],
    ];
  }
  return f;
}

function nodePlanIsPlainColumn(plan: ColumnPlan): boolean {
  return plan.nodes.length === 1 && plan.nodes[0].kind === 'run';
}

function replaceAt(frame: FrameNode, index: number, node: SceneNode): void {
  const old = frame.children[index];
  frame.insertChild(index, node);
  if (old) old.remove();
}

function ensureColumn(
  store: Store,
  frame: FrameNode,
  index: number,
  plan: ColumnPlan,
  cfg: BlockConfig,
): SceneNode {
  const existing = frame.children[index] as SceneNode | undefined;
  if (nodePlanIsPlainColumn(plan)) {
    let t: TextNode;
    if (existing && existing.type === 'TEXT') t = existing;
    else {
      t = newText(cfg);
      replaceAt(frame, index, t);
    }
    styleRun(t, plan.nodes[0], cfg);
    return t;
  }
  let col: FrameNode;
  if (existing && existing.type === 'FRAME' && store.get(existing, COLUMN_FLAG) === '1') {
    col = existing;
    for (const k of [...col.children]) k.remove();
  } else {
    col = figma.createFrame();
    col.layoutMode = 'VERTICAL';
    col.fills = [];
    col.clipsContent = false;
    store.set(col, COLUMN_FLAG, '1');
    replaceAt(frame, index, col);
  }
  col.itemSpacing = 0;
  col.paddingTop = col.paddingBottom = col.paddingLeft = col.paddingRight = 0;
  col.counterAxisAlignItems = 'CENTER';
  col.resize(cfg.pitch, Math.max(1, col.height));
  col.counterAxisSizingMode = 'FIXED';
  col.primaryAxisSizingMode = 'AUTO';
  for (const np of plan.nodes) {
    if (np.kind === 'run') {
      const t = newText(cfg);
      col.appendChild(t);
      styleRun(t, np, cfg);
    } else {
      col.appendChild(buildCell(np, cfg));
    }
  }
  return col;
}

function buildModel(frame: FrameNode, plans: ColumnPlan[]): Model {
  const n = plans.length;
  const cols: ModelColumn[] = [];
  for (let i = 0; i < n; i++) {
    const kid = frame.children[n - 1 - i];
    const plan = plans[i];
    let nodes;
    if (kid.type === 'TEXT') {
      nodes = [{ id: kid.id, kind: plan.nodes[0].kind, entries: plan.nodes[0].cells.map((c) => [c.text, c.src] as [string, string]) }];
    } else {
      const kids = (kid as FrameNode).children;
      nodes = plan.nodes.map((np, k) => ({
        id: kids[k].id,
        kind: np.kind,
        entries: np.cells.map((c) => [c.text, c.src] as [string, string]),
      }));
    }
    cols.push({ id: kid.id, para: plan.para, nodes });
  }
  return { cols };
}

export async function renderBlock(
  store: Store,
  frame: FrameNode,
  opts: { force?: boolean } = {},
): Promise<RenderResult> {
  const cfg = readConfig(store, frame);
  if (!cfg) throw new Error('not a vertical text block');
  await figma.loadFontAsync({ family: cfg.fontFamily, style: cfg.fontStyle });

  const right = frame.x + frame.width;
  configureFrame(frame);
  const inner = frame.height - frame.paddingTop - frame.paddingBottom;
  const capacity = capacityFor(inner, cfg.advance);
  const sig = signature(cfg, capacity);
  const model = readModel(store, frame);
  if (!opts.force && store.get(frame, KEY_SIG) === sig && structureMatches(frame, model)) {
    // Nothing to redraw, but configureFrame may have snapped a dragged width back to HUG.
    anchorRight(frame, right);
    return { columns: frame.children.length, capacity, skipped: true };
  }

  const plans = typeset({
    paragraphs: cfg.paragraphs,
    settings: cfg.settings,
    fontSize: cfg.fontSize,
    advance: cfg.advance,
    capacity,
  });
  // Children run in reverse reading order: child j draws plan n-1-j.
  const n = plans.length;
  for (let j = 0; j < n; j++) ensureColumn(store, frame, j, plans[n - 1 - j], cfg);
  while (frame.children.length > n) frame.children[frame.children.length - 1].remove();
  for (let j = 0; j < n; j++) frame.children[j].name = `列 ${n - j}`;

  anchorRight(frame, right);

  store.set(frame, KEY_MODEL, encodeModel(buildModel(frame, plans)));
  store.set(frame, KEY_SIG, sig);
  return { columns: n, capacity, skipped: false };
}
