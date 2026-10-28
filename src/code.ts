// Vertical Japanese Text: plugin main thread.

import { findBlock, readConfig, writeConfig } from './figma/block.ts';
import { convertNode, createBlock, describeSelection, runStyleOf, unblock } from './figma/convert.ts';
import { renderBlock } from './figma/render.ts';
import { pluginStore as store } from './figma/store.ts';
import { Watcher } from './figma/watch.ts';
import type { ApplyPatch, ToCode, ToUI } from './protocol.ts';

declare const __html__: string;

figma.showUI(__html__, { width: 320, height: 640, themeColors: true });

const post = (msg: ToUI): void => figma.ui.postMessage(msg);
const toast = (level: 'info' | 'error', message: string): void => post({ type: 'toast', level, message });

const sendSelection = (): void => post({ type: 'selection', state: describeSelection(store) });
const sendAuto = (): void => post({ type: 'auto', on: watcher.active, watching: watcher.countBlocks() });

const watcher = new Watcher(
  store,
  (m) => toast('error', m),
  () => sendSelection(),
);

function selectedBlock(): FrameNode | null {
  const sel = figma.currentPage.selection;
  return sel.length === 1 ? findBlock(store, sel[0]) : null;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

async function apply(patch: ApplyPatch): Promise<void> {
  const block = selectedBlock();
  const cfg = block && readConfig(store, block);
  if (!block || !cfg) return;
  const next = {
    ...cfg,
    paragraphs: patch.paragraphs ?? cfg.paragraphs,
    settings: { ...cfg.settings, ...(patch.settings ?? {}) },
    fontSize: finite(patch.fontSize) ? patch.fontSize : cfg.fontSize,
    advance: finite(patch.advance) ? patch.advance : cfg.advance,
    pitch: finite(patch.pitch) ? patch.pitch : cfg.pitch,
  };
  writeConfig(store, block, next);
  await renderBlock(store, block, { force: true });
}

figma.ui.onmessage = async (msg: ToCode) => {
  try {
    switch (msg.type) {
      case 'ready':
        sendSelection();
        sendAuto();
        break;
      case 'apply':
        await apply(msg.patch);
        sendSelection();
        break;
      case 'convert': {
        const sel = figma.currentPage.selection;
        if (sel.length !== 1) throw new Error('1 つだけ選んでください。');
        const frame = await convertNode(store, sel[0]);
        figma.currentPage.selection = [frame];
        sendSelection();
        sendAuto();
        break;
      }
      case 'create': {
        const sel = figma.currentPage.selection;
        let style = null;
        if (sel.length === 1) {
          const b = findBlock(store, sel[0]);
          if (b) style = runStyleOf(b);
        }
        const frame = await createBlock(store, msg.paragraphs, style);
        figma.currentPage.selection = [frame];
        figma.viewport.scrollAndZoomIntoView([frame]);
        sendSelection();
        sendAuto();
        break;
      }
      case 'auto':
        if (msg.on) watcher.start();
        else watcher.stop();
        sendAuto();
        break;
      case 'unblock': {
        const block = selectedBlock();
        if (block) unblock(store, block);
        sendSelection();
        sendAuto();
        break;
      }
    }
  } catch (err) {
    toast('error', err instanceof Error ? err.message : String(err));
  }
};

figma.on('selectionchange', sendSelection);
figma.on('currentpagechange', () => {
  watcher.rebind();
  sendSelection();
  sendAuto();
});
figma.on('close', () => watcher.stop());

watcher.start();
