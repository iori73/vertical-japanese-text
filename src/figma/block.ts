// A "block" is a horizontal auto-layout frame whose columns this plugin owns.
// Its configuration (source text, typesetting settings, font metrics) lives in
// pluginData on the frame; the columns are only a drawn result.

import { decodeModel, type Model } from '../core/model.ts';
import { DEFAULT_SETTINGS, type Settings } from '../core/types.ts';
import type { Store } from './store.ts';

export const KEY_CONFIG = 'tg';
export const KEY_MODEL = 'tgm';
export const KEY_SIG = 'tgs';

export interface BlockFill {
  r: number;
  g: number;
  b: number;
  opacity: number;
}

export interface BlockConfig {
  v: 1;
  paragraphs: string[];
  settings: Settings;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  /** Distance between characters along a column (px). */
  advance: number;
  /** Column width (px): the distance between columns. */
  pitch: number;
  fill: BlockFill;
}

export function defaultConfig(over: Partial<BlockConfig> = {}): BlockConfig {
  const fontSize = over.fontSize ?? 16;
  return {
    v: 1,
    paragraphs: [''],
    settings: { ...DEFAULT_SETTINGS },
    fontFamily: 'Noto Sans JP',
    fontStyle: 'Regular',
    fontSize,
    advance: Math.round(fontSize * 1.04 * 100) / 100,
    pitch: Math.round(fontSize * 1.85 * 100) / 100,
    fill: { r: 0.1, g: 0.1, b: 0.1, opacity: 1 },
    ...over,
  };
}

export function readConfig(store: Store, node: BaseNode): BlockConfig | null {
  const raw = store.get(node, KEY_CONFIG);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BlockConfig>;
    if (parsed.v !== 1 || !Array.isArray(parsed.paragraphs)) return null;
    const base = defaultConfig();
    return {
      ...base,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      fill: { ...base.fill, ...(parsed.fill ?? {}) },
    } as BlockConfig;
  } catch {
    return null;
  }
}

export function writeConfig(store: Store, node: BaseNode, cfg: BlockConfig): void {
  store.set(node, KEY_CONFIG, JSON.stringify(cfg));
}

export function readModel(store: Store, node: BaseNode): Model | null {
  const raw = store.get(node, KEY_MODEL);
  return raw ? decodeModel(raw) : null;
}

export function isBlock(store: Store, node: BaseNode): node is FrameNode {
  return node.type === 'FRAME' && store.get(node, KEY_CONFIG) !== '';
}

/** The block a node belongs to (itself or an ancestor within three levels). */
export function findBlock(store: Store, node: BaseNode | null): FrameNode | null {
  let cur: BaseNode | null = node;
  for (let depth = 0; cur && depth < 4; depth++) {
    if (cur.type === 'PAGE' || cur.type === 'DOCUMENT') return null;
    if (isBlock(store, cur)) return cur;
    cur = cur.parent;
  }
  return null;
}
