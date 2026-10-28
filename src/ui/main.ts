// Plugin panel. Plain DOM, no framework.

import type { FormsMode, LatinMode, NumeralMode, Settings } from '../core/types.ts';
import type { ApplyPatch, BlockInfo, SelectionState, ToCode, ToUI } from '../protocol.ts';

const ja = (navigator.language || 'en').toLowerCase().startsWith('ja');

const T = {
  title: ['縦書き自動折り返し', 'Vertical Japanese Text'],
  auto: ['自動で折り返す', 'Auto reflow'],
  watching: ['監視中のブロック', 'Blocks watched'],
  lead: [
    '縦書きブロックの高さを動かすと、列が自動で折り返されます。',
    'Drag the height of a vertical block and its columns reflow.',
  ],
  none: [
    'テキスト、または横向き Auto Layout の縦書きフレームを選ぶと、縦書きブロックにできます。',
    'Select a text layer, or a horizontal auto-layout frame of vertical columns, to make a vertical block.',
  ],
  convert: ['縦書きブロックにする', 'Make vertical block'],
  convertText: [
    '選んだテキストを、縦書きブロックに置き換えます（元に戻すは ⌘Z）。',
    'Replaces the selected text with a vertical block (undo with ⌘Z).',
  ],
  convertFrame: [
    '選んだフレームの列を読み取り、その場で縦書きブロックにします。',
    'Reads the columns of the selected frame and turns it into a vertical block in place.',
  ],
  create: ['新しい縦書きを作る', 'Create new vertical text'],
  createBtn: ['作成', 'Create'],
  source: ['本文（段落は空行で区切る）', 'Text (separate paragraphs with a blank line)'],
  size: ['文字サイズ', 'Font size'],
  advance: ['字送り', 'Advance'],
  pitch: ['行送り（列の幅）', 'Column pitch'],
  numerals: ['数字', 'Numerals'],
  latin: ['英字', 'Latin'],
  forms: ['縦書き字形', 'Vertical forms'],
  kinsoku: ['禁則処理', 'Line-break rules (kinsoku)'],
  hang: ['句読点のぶら下がり', 'Hang 、。 past the limit'],
  stats: ['{c} 列 ・ 1 列 {n} 字 ・ 高さ {h}px', '{c} columns · {n} per column · height {h}px'],
  unblock: ['ブロックを解除（普通のレイヤーに戻す）', 'Release block (back to plain layers)'],
  fontNote: ['フォント', 'Font'],
  hintBlock: [
    '高さのハンドルを引くと折り返しが変わります。列の文字を直接直しても反映されます。',
    'Drag the height handle to reflow. Editing a column directly also works.',
  ],
  autoOff: [
    '「自動で折り返す」がオフです。パネルの変更だけが反映されます。',
    'Auto reflow is off. Only panel changes are applied.',
  ],
} as const;

const NUMERALS: [NumeralMode, string, string][] = [
  ['tcy', '縦中横（2 桁まで）', 'Horizontal in vertical (up to 2 digits)'],
  ['sideways', '横向き', 'Sideways'],
  ['kanji', '漢数字（二〇二四）', 'Kanji, digit by digit (二〇二四)'],
  ['kanji-place', '漢数字（二千二十四）', 'Kanji, place values (二千二十四)'],
  ['upright', '縦に積む', 'Stacked upright'],
];
const LATIN: [LatinMode, string, string][] = [
  ['sideways', '横向き', 'Sideways'],
  ['tcy', '縦中横（2 字まで）', 'Horizontal in vertical (up to 2 letters)'],
  ['upright', '縦に積む', 'Stacked upright'],
];
const FORMS: [FormsMode, string, string][] = [
  ['unicode', '縦書き用の文字に置換', 'Unicode vertical forms'],
  ['rotate', '回転（どのフォントでも）', 'Rotated cells (any font)'],
  ['none', 'そのまま', 'As typed'],
];

const t = (k: keyof typeof T): string => T[k][ja ? 0 : 1];

const root = document.getElementById('app')!;
const send = (msg: ToCode): void => parent.postMessage({ pluginMessage: msg }, '*');

let auto = true;
let watching = 0;
let state: SelectionState = { kind: 'none' };
let builtFor = '';

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function options<V extends string>(list: [V, string, string][], cur: V): string {
  return list
    .map(([v, a, b]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(ja ? a : b)}</option>`)
    .join('');
}

function shell(inner: string): string {
  return `
    <div class="head">
      <h1>${t('title')}</h1>
      <label class="switch"><input type="checkbox" id="auto" ${auto ? 'checked' : ''}/> ${t('auto')}</label>
    </div>
    <p class="sub">${t('lead')}${watching ? ` · ${t('watching')}: ${watching}` : ''}</p>
    <div id="body">${inner}</div>
    <div id="toast"></div>`;
}

function createCard(): string {
  return `
    <div class="card">
      <h2>${t('create')}</h2>
      <div class="stack">
        <textarea id="newText" rows="4" placeholder="${esc(ja ? '縦書きにしたい文章' : 'Text to set vertically')}"></textarea>
        <button id="createBtn" class="primary">${t('createBtn')}</button>
      </div>
    </div>`;
}

function blockCard(i: BlockInfo): string {
  const s = i.settings;
  return `
    <div class="card">
      <h2>${t('source')}</h2>
      <textarea id="source">${esc(i.paragraphs.join('\n\n'))}</textarea>
    </div>
    <div class="card">
      <p class="stats" id="stats"></p>
      <div class="row">
        <div class="field"><label class="t">${t('size')}</label><input type="number" id="fontSize" min="1" step="0.5" value="${i.fontSize}"></div>
        <div class="field"><label class="t">${t('advance')}</label><input type="number" id="advance" min="1" step="0.1" value="${i.advance}"></div>
        <div class="field"><label class="t">${t('pitch')}</label><input type="number" id="pitch" min="1" step="0.1" value="${i.pitch}"></div>
        <div class="field"><label class="t">${t('fontNote')}</label><input type="text" disabled value="${esc(i.fontFamily)} ${esc(i.fontStyle)}" style="width:100%;font:inherit;padding:5px 6px;border:0;background:var(--figma-color-bg-secondary,#f5f5f5);color:inherit;border-radius:4px"></div>
        <div class="field full"><label class="t">${t('numerals')}</label><select id="numerals">${options(NUMERALS, s.numerals)}</select></div>
        <div class="field full"><label class="t">${t('latin')}</label><select id="latin">${options(LATIN, s.latin)}</select></div>
        <div class="field full"><label class="t">${t('forms')}</label><select id="forms">${options(FORMS, s.forms)}</select></div>
      </div>
      <div class="checks">
        <label><input type="checkbox" id="kinsoku" ${s.kinsoku ? 'checked' : ''}/> ${t('kinsoku')}</label>
        <label><input type="checkbox" id="hang" ${s.hang ? 'checked' : ''}/> ${t('hang')}</label>
      </div>
      <p class="hint">${t('hintBlock')}</p>
    </div>
    <div class="stack">
      <button id="unblock" class="quiet">${t('unblock')}</button>
    </div>
    <div style="height:12px"></div>
    ${createCard()}`;
}

function stats(i: BlockInfo): string {
  return t('stats')
    .replace('{c}', String(i.columns))
    .replace('{n}', String(i.capacity))
    .replace('{h}', String(i.height));
}

function paragraphsOf(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((p) => p.replace(/\n/g, ''));
}

let applyTimer: number | undefined;
function queueApply(): void {
  window.clearTimeout(applyTimer);
  applyTimer = window.setTimeout(() => {
    const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;
    const num = (id: string) => Number($<HTMLInputElement>(id).value);
    const settings: Partial<Settings> = {
      numerals: $<HTMLSelectElement>('numerals').value as NumeralMode,
      latin: $<HTMLSelectElement>('latin').value as LatinMode,
      forms: $<HTMLSelectElement>('forms').value as FormsMode,
      kinsoku: $<HTMLInputElement>('kinsoku').checked,
      hang: $<HTMLInputElement>('hang').checked,
    };
    const patch: ApplyPatch = {
      paragraphs: paragraphsOf($<HTMLTextAreaElement>('source').value),
      settings,
      fontSize: num('fontSize'),
      advance: num('advance'),
      pitch: num('pitch'),
    };
    send({ type: 'apply', patch });
  }, 250);
}

function wire(): void {
  const $ = (id: string) => document.getElementById(id);
  $('auto')?.addEventListener('change', (e) => send({ type: 'auto', on: (e.target as HTMLInputElement).checked }));
  $('convert')?.addEventListener('click', () => send({ type: 'convert' }));
  $('unblock')?.addEventListener('click', () => send({ type: 'unblock' }));
  $('createBtn')?.addEventListener('click', () => {
    const text = ($('newText') as HTMLTextAreaElement).value.trim();
    if (text) send({ type: 'create', paragraphs: paragraphsOf(text) });
  });
  for (const id of ['source', 'fontSize', 'advance', 'pitch', 'numerals', 'latin', 'forms', 'kinsoku', 'hang']) {
    $(id)?.addEventListener('input', queueApply);
    $(id)?.addEventListener('change', queueApply);
  }
}

function bodyFor(s: SelectionState): string {
  switch (s.kind) {
    case 'block':
      return blockCard(s.info);
    case 'convertible':
      return `
        <div class="card">
          <p style="margin:0 0 10px">${esc(s.name)}</p>
          <button id="convert" class="primary">${t('convert')}</button>
          <p class="hint">${s.what === 'text' ? t('convertText') : t('convertFrame')}</p>
        </div>
        ${createCard()}`;
    case 'unsupported':
      return `<div class="card"><p style="margin:0">${esc(s.reason)}</p></div>${createCard()}`;
    default:
      return `<div class="card"><p style="margin:0">${t('none')}</p></div>${createCard()}`;
  }
}

function render(): void {
  const key = state.kind === 'block' ? `block:${state.info.id}` : state.kind;
  if (key !== builtFor || !document.getElementById('body')) {
    builtFor = key;
    root.innerHTML = shell(bodyFor(state));
    wire();
  }
  const header = root.querySelector('.sub');
  if (header) header.textContent = `${t('lead')}${watching ? ` · ${t('watching')}: ${watching}` : ''}`;
  const autoBox = document.getElementById('auto') as HTMLInputElement | null;
  if (autoBox) autoBox.checked = auto;
  if (state.kind === 'block') {
    const info = state.info;
    const set = (id: string, v: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el && document.activeElement !== el && el.value !== v) el.value = v;
    };
    const stat = document.getElementById('stats');
    if (stat) stat.textContent = stats(info) + (auto ? '' : `  ·  ${t('autoOff')}`);
    set('source', info.paragraphs.join('\n\n'));
    set('fontSize', String(info.fontSize));
    set('advance', String(info.advance));
    set('pitch', String(info.pitch));
  }
}

let toastTimer: number | undefined;
function toast(level: 'info' | 'error', message: string): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = `<div class="toast ${level}">${esc(message)}</div>`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.innerHTML = ''), 4000);
}

window.onmessage = (e: MessageEvent) => {
  const msg = e.data.pluginMessage as ToUI | undefined;
  if (!msg) return;
  if (msg.type === 'selection') {
    state = msg.state;
    render();
  } else if (msg.type === 'auto') {
    auto = msg.on;
    watching = msg.watching;
    render();
  } else if (msg.type === 'toast') {
    toast(msg.level, msg.message);
  }
};

render();
send({ type: 'ready' });
