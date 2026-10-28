// Vertical presentation forms. Figma's API cannot switch the OpenType `vert`
// feature on, so punctuation is swapped for the Unicode vertical-form code
// points (U+FE10-FE48). Spike result: these render correctly in the ten
// Japanese families we tried (BIZ UD, Noto, Shippori, Zen, Kaisei, Klee, ...).

export const VERTICAL_FORMS: Readonly<Record<string, string>> = {
  '、': '︑',
  '。': '︒',
  '，': '︐',
  '「': '﹁',
  '」': '﹂',
  '『': '﹃',
  '』': '﹄',
  '（': '︵',
  '）': '︶',
  '｛': '︷',
  '｝': '︸',
  '〔': '︹',
  '〕': '︺',
  '【': '︻',
  '】': '︼',
  '《': '︽',
  '》': '︾',
  '〈': '︿',
  '〉': '﹀',
  '［': '﹇',
  '］': '﹈',
  'ー': '︱',
  '―': '︱',
  '—': '︱',
  '…': '︙',
  '‥': '︰',
};

/** Reverse lookup; the first source character wins for ambiguous forms. */
export const FORMS_REVERSE: Readonly<Record<string, string>> = (() => {
  const out: Record<string, string> = {};
  for (const [src, form] of Object.entries(VERTICAL_FORMS)) {
    if (!(form in out)) out[form] = src;
  }
  return out;
})();

/** Characters with no vertical form: drawn as a 90 degree rotated cell. */
export const ALWAYS_ROTATE = '〜～〰';

/** Punctuation drawn rotated in the `rotate` fallback mode. */
export const ROTATE_MODE_CHARS = '「」『』（）｛｝〔〕【】《》〈〉［］ー―—…‥';

/** Punctuation shifted to the top-right of the cell in the `rotate` fallback mode. */
export const SHIFT_MODE_CHARS = '、。，．';

export function toVerticalForm(ch: string): string {
  return VERTICAL_FORMS[ch] ?? ch;
}

export function fromVerticalForm(ch: string): string {
  return FORMS_REVERSE[ch] ?? ch;
}
