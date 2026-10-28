// Watch the page for edits to blocks and re-typeset them.
//
// Events fired by our own writes come back through the same listener, so every
// reaction is idempotent: a re-render is skipped when the source, settings and
// frame height produce the same signature as the last render.

import { reconcile, type CurrentColumn, type CurrentNode, type NodeKind } from '../core/model.ts';
import { KEY_CONFIG, findBlock, readConfig, readModel, writeConfig, type BlockConfig } from './block.ts';
import { runStyleOf } from './convert.ts';
import { renderBlock } from './render.ts';
import type { Store } from './store.ts';

type Reason = 'resize' | 'edit' | 'style';

const FRAME_PROPS = new Set([
  'width',
  'height',
  'paddingTop',
  'paddingBottom',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'layoutMode',
  'itemSpacing',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
]);
const TEXT_EDIT_PROPS = new Set(['characters']);
const TEXT_STYLE_PROPS = new Set(['fontSize', 'fontName', 'fills']);

const FLUSH_MS = 40;

export class Watcher {
  private page: PageNode | null = null;
  private running = false;
  private pending = new Map<string, { frame: FrameNode; reasons: Set<Reason> }>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private busy = false;
  private again = false;
  private readonly handler = (e: NodeChangeEvent) => this.onChange(e);

  constructor(
    private readonly store: Store,
    private readonly onError: (message: string) => void,
    private readonly onRendered: () => void,
  ) {}

  get active(): boolean {
    return this.running;
  }

  start(): void {
    this.running = true;
    this.bind();
  }

  stop(): void {
    this.running = false;
    this.unbind();
    this.pending.clear();
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Call after the current page changes. */
  rebind(): void {
    if (!this.running) return;
    this.unbind();
    this.bind();
  }

  /** Number of blocks on the current page. */
  countBlocks(): number {
    try {
      return figma.currentPage.findAllWithCriteria({ pluginData: { keys: [KEY_CONFIG] } }).length;
    } catch {
      return 0;
    }
  }

  private bind(): void {
    this.page = figma.currentPage;
    this.page.on('nodechange', this.handler);
  }

  private unbind(): void {
    if (this.page) this.page.off('nodechange', this.handler);
    this.page = null;
  }

  private onChange(event: NodeChangeEvent): void {
    for (const change of event.nodeChanges) {
      const node = change.node;
      if ('removed' in node && node.removed) continue;
      const scene = node as SceneNode;
      const frame = findBlock(this.store, scene);
      if (!frame) continue;
      if (change.type === 'CREATE') {
        if (scene !== frame) this.queue(frame, 'edit');
        continue;
      }
      if (change.type !== 'PROPERTY_CHANGE') continue;
      const props = change.properties as string[];
      if (scene === frame) {
        if (props.some((p) => FRAME_PROPS.has(p))) this.queue(frame, 'resize');
      } else if (scene.type === 'TEXT') {
        if (props.some((p) => TEXT_EDIT_PROPS.has(p))) this.queue(frame, 'edit');
        else if (props.some((p) => TEXT_STYLE_PROPS.has(p))) this.queue(frame, 'style');
      }
    }
  }

  private queue(frame: FrameNode, reason: Reason): void {
    const entry = this.pending.get(frame.id) ?? { frame, reasons: new Set<Reason>() };
    entry.reasons.add(reason);
    this.pending.set(frame.id, entry);
    if (this.busy) {
      this.again = true;
      return;
    }
    if (!this.timer) this.timer = setTimeout(() => void this.flush(), FLUSH_MS);
  }

  private async flush(): Promise<void> {
    this.timer = null;
    if (this.busy) return;
    this.busy = true;
    try {
      do {
        this.again = false;
        const batch = [...this.pending.values()];
        this.pending.clear();
        for (const { frame, reasons } of batch) {
          if (frame.removed) continue;
          try {
            await this.process(frame, reasons);
          } catch (err) {
            this.onError(err instanceof Error ? err.message : String(err));
          }
        }
        this.onRendered();
      } while (this.again && this.running);
    } finally {
      this.busy = false;
    }
  }

  private async process(frame: FrameNode, reasons: Set<Reason>): Promise<void> {
    const cfg = readConfig(this.store, frame);
    if (!cfg) return;
    let next: BlockConfig = cfg;
    let changed = false;

    if (reasons.has('edit')) {
      const model = readModel(this.store, frame);
      if (model) {
        const paragraphs = reconcile(model, readCurrent(frame, model));
        if (paragraphs === null) {
          this.onError('文章が長いため、キャンバス上の直接編集は反映できません。パネルで編集してください。');
        } else if (JSON.stringify(paragraphs) !== JSON.stringify(cfg.paragraphs)) {
          next = { ...next, paragraphs };
          changed = true;
        }
      }
    }
    if (reasons.has('style')) {
      const style = runStyleOf(frame);
      if (style && styleDiffers(cfg, style)) {
        next = { ...next, ...style, fill: style.fill ?? next.fill };
        changed = true;
      }
    }
    if (changed) writeConfig(this.store, frame, next);
    await renderBlock(this.store, frame, { force: changed });
  }
}

function styleDiffers(cfg: BlockConfig, s: Partial<BlockConfig>): boolean {
  if (s.fontFamily !== undefined && s.fontFamily !== cfg.fontFamily) return true;
  if (s.fontStyle !== undefined && s.fontStyle !== cfg.fontStyle) return true;
  if (s.fontSize !== undefined && Math.abs(s.fontSize - cfg.fontSize) > 0.001) return true;
  if (s.fill) {
    const f = s.fill;
    const c = cfg.fill;
    if (
      Math.abs(f.r - c.r) > 0.002 ||
      Math.abs(f.g - c.g) > 0.002 ||
      Math.abs(f.b - c.b) > 0.002 ||
      Math.abs(f.opacity - c.opacity) > 0.002
    ) {
      return true;
    }
  }
  return false;
}

/** Read the columns on the canvas in reading order (rightmost first). */
export function readCurrent(frame: FrameNode, model: { cols: { nodes: { id: string; kind: NodeKind }[] }[] }): CurrentColumn[] {
  const kinds = new Map<string, NodeKind>();
  for (const c of model.cols) for (const n of c.nodes) kinds.set(n.id, n.kind);
  const textOf = (n: SceneNode): string => {
    if (n.type === 'TEXT') return n.characters;
    if ('children' in n) {
      const t = n.children.find((k) => k.type === 'TEXT') as TextNode | undefined;
      return t ? t.characters : '';
    }
    return '';
  };
  const out: CurrentColumn[] = [];
  for (const kid of [...frame.children].reverse()) {
    const nodes: CurrentNode[] = [];
    if (kid.type === 'TEXT') {
      nodes.push({ id: kid.id, kind: kinds.get(kid.id) ?? 'run', text: kid.characters });
    } else if (kid.type === 'FRAME') {
      for (const ch of kid.children) {
        nodes.push({
          id: ch.id,
          kind: kinds.get(ch.id) ?? (ch.type === 'TEXT' ? 'run' : 'tcy'),
          text: textOf(ch),
        });
      }
    }
    out.push({ id: kid.id, nodes });
  }
  return out;
}
