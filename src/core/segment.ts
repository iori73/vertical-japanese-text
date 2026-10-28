// Source paragraph -> typeset cells.

import { isHangable, isNoEnd, isNoHead, isNoSplitChar } from './kinsoku.ts';
import { toKanjiDigits, toKanjiPlace } from './numerals.ts';
import type { Cell, Settings } from './types.ts';
import {
  ALWAYS_ROTATE,
  ROTATE_MODE_CHARS,
  SHIFT_MODE_CHARS,
  toVerticalForm,
} from './vertical-forms.ts';

/** Estimated advance width in em of one Latin character, used to size sideways cells. */
export function estimateCharWidthEm(ch: string): number {
  if ('ilj.,:;!|\'’`'.includes(ch)) return 0.3;
  if ('frt()[]{}-/\\ '.includes(ch)) return 0.4;
  if ('mwMW@%&'.includes(ch)) return 0.9;
  if (/[A-Z]/.test(ch)) return 0.68;
  if (/[0-9]/.test(ch)) return 0.56;
  return 0.56;
}

export function estimateWidthEm(text: string): number {
  let w = 0;
  for (const ch of text) w += estimateCharWidthEm(ch);
  return w;
}

/** Number of advance units a sideways run of `text` needs (at least 1). */
export function sidewaysSpan(text: string, fontSize: number, advance: number): number {
  const px = estimateWidthEm(text) * fontSize * 1.06;
  return Math.max(1, Math.ceil(px / advance - 1e-9));
}

const TOKEN_RE = /[A-Za-z0-9０-９Ａ-Ｚａ-ｚ]+(?:[.,:/\-@_+#%&=?~'’][A-Za-z0-9０-９Ａ-Ｚａ-ｚ]+)*/y;
const NUMERIC_RE = /^[0-9]+(?:[.,:/-][0-9]+)*$/;
const PAIR_RE = /^[!?！？]{2}/;

const normalize = (s: string): string => s.normalize('NFKC');

export interface SegmentOptions {
  fontSize: number;
  advance: number;
}

function charCell(src: string, text: string, s: Settings): Cell {
  return {
    kind: 'char',
    src,
    text,
    span: 1,
    noHead: s.kinsoku && isNoHead(src),
    noEnd: s.kinsoku && isNoEnd(src),
    noSplit: s.kinsoku && isNoSplitChar(src),
    hangable: isHangable(src),
  };
}

/** One source character -> cell, applying the vertical-forms policy. */
function punctuationCell(ch: string, s: Settings): Cell {
  if (s.forms !== 'none' && ALWAYS_ROTATE.includes(ch)) {
    return { ...charCell(ch, ch, s), kind: 'rotchar' };
  }
  if (s.forms === 'unicode') return charCell(ch, toVerticalForm(ch), s);
  if (s.forms === 'rotate') {
    if (ROTATE_MODE_CHARS.includes(ch)) return { ...charCell(ch, ch, s), kind: 'rotchar' };
    if (SHIFT_MODE_CHARS.includes(ch)) return { ...charCell(ch, ch, s), kind: 'shift' };
  }
  // 'none', or a character that needs no special form
  if (ch === '!' || ch === '?') return charCell(ch, ch === '!' ? '！' : '？', s);
  return charCell(ch, ch, s);
}

function uprightChars(src: string, s: Settings): Cell[] {
  return [...src].map((ch) => {
    const n = normalize(ch);
    return n === '-' ? charCell(ch, toVerticalForm('ー'), s) : charCell(ch, n, s);
  });
}

function digitCells(token: string, s: Settings, o: SegmentOptions): Cell[] {
  const norm = normalize(token);
  const pure = /^[0-9]+$/.test(norm);
  switch (s.numerals) {
    case 'tcy':
      if (pure && norm.length > 1 && norm.length <= s.tcyMax) {
        return [{ kind: 'tcy', src: token, text: norm, span: 1 }];
      }
      return uprightChars(token, s);
    case 'sideways':
      return [
        { kind: 'sideways', src: token, text: norm, span: sidewaysSpan(norm, o.fontSize, o.advance) },
      ];
    case 'kanji-place': {
      // 1,500 reads as a plain integer; 076-241 or 3.14 do not.
      const plain = /^[0-9]{1,3}(?:,[0-9]{3})+$/.test(norm) ? norm.replace(/,/g, '') : norm;
      const place = /^[0-9]+$/.test(plain) ? toKanjiPlace(plain) : null;
      if (place !== null) {
        // First cell owns the whole source so `src` still concatenates exactly.
        return [...place].map((ch, i) => charCell(i === 0 ? token : '', ch, s));
      }
      return kanjiDigitCells(token, s);
    }
    case 'kanji':
      return kanjiDigitCells(token, s);
    case 'upright':
    default:
      return uprightChars(token, s);
  }
}

function kanjiDigitCells(token: string, s: Settings): Cell[] {
  const out: Cell[] = [];
  for (const ch of token) {
    const n = normalize(ch);
    if (n === ',' && out.length > 0) {
      // A thousands separator is not drawn; its source rides on the previous cell.
      out[out.length - 1].src += ch;
      continue;
    }
    if (/[0-9]/.test(n)) out.push(charCell(ch, toKanjiDigits(n), s));
    else if (n === '.') out.push(charCell(ch, '・', s));
    else if (n === '-') out.push(charCell(ch, toVerticalForm('ー'), s));
    else out.push(charCell(ch, n, s));
  }
  return out;
}

function latinCells(token: string, s: Settings, o: SegmentOptions): Cell[] {
  const norm = normalize(token);
  if (s.latin === 'upright') return uprightChars(token, s);
  if (s.latin === 'tcy' && [...norm].length <= s.tcyMax) {
    return [{ kind: 'tcy', src: token, text: norm, span: 1 }];
  }
  return [
    { kind: 'sideways', src: token, text: norm, span: sidewaysSpan(norm, o.fontSize, o.advance) },
  ];
}

export function segment(paragraph: string, s: Settings, o: SegmentOptions): Cell[] {
  const cells: Cell[] = [];
  let i = 0;
  while (i < paragraph.length) {
    TOKEN_RE.lastIndex = i;
    const m = TOKEN_RE.exec(paragraph);
    if (m && m.index === i) {
      const token = m[0];
      const norm = normalize(token);
      cells.push(...(NUMERIC_RE.test(norm) ? digitCells(token, s, o) : latinCells(token, s, o)));
      i += token.length;
      continue;
    }
    const rest = paragraph.slice(i);
    const pair = PAIR_RE.exec(rest);
    if (pair && s.forms !== 'none') {
      const text = normalize(pair[0]);
      cells.push({ kind: 'tcy', src: pair[0], text, span: 1 });
      i += 2;
      continue;
    }
    const cp = paragraph.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    cells.push(punctuationCell(ch, s));
    i += ch.length;
  }
  return cells;
}
