// Test harness: exposes the plugin's Figma-side logic on globalThis so it can be
// pasted into `use_figma` (which has no pluginData and cannot run plugin UI or
// event listeners). Build with: node scripts/build-harness.mjs
import { reconcile } from '../src/core/model.ts';
import { readConfig, writeConfig, defaultConfig } from '../src/figma/block.ts';
import { convertNode, createBlock } from '../src/figma/convert.ts';
import { renderBlock } from '../src/figma/render.ts';
import { memoryStore } from '../src/figma/store.ts';
import { readCurrent } from '../src/figma/watch.ts';

(globalThis as unknown as { TG: unknown }).TG = {
  store: memoryStore(),
  reconcile,
  readConfig,
  writeConfig,
  defaultConfig,
  convertNode,
  createBlock,
  renderBlock,
  readCurrent,
};
