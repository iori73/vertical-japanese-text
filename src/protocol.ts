// Messages between the plugin panel (UI) and the plugin code. No Figma dependency.

import type { Settings } from './core/types.ts';

export interface BlockInfo {
  id: string;
  name: string;
  paragraphs: string[];
  settings: Settings;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  advance: number;
  pitch: number;
  columns: number;
  capacity: number;
  height: number;
}

export type SelectionState =
  | { kind: 'none' }
  | { kind: 'block'; info: BlockInfo }
  | { kind: 'convertible'; what: 'text' | 'frame'; name: string }
  | { kind: 'unsupported'; reason: string };

export type ToUI =
  | { type: 'selection'; state: SelectionState }
  | { type: 'auto'; on: boolean; watching: number }
  | { type: 'toast'; level: 'info' | 'error'; message: string };

export interface ApplyPatch {
  paragraphs?: string[];
  settings?: Partial<Settings>;
  fontSize?: number;
  advance?: number;
  pitch?: number;
}

export type ToCode =
  | { type: 'ready' }
  | { type: 'apply'; patch: ApplyPatch }
  | { type: 'convert' }
  | { type: 'create'; paragraphs: string[] }
  | { type: 'auto'; on: boolean }
  | { type: 'unblock' };
