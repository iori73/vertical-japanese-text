// Line-head / line-end prohibition (kinsoku) character classes, after JIS X 4051.

/** Must not start a column. */
const NO_HEAD =
  '、。，．・：；？！）〕］｝〉》」』】ー々ゝゞヽヾ〻ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ…‥”’)]},.:;!?';

/** Must not end a column. */
const NO_END = '（〔［｛〈《「『【“‘([{';

/** Characters that may hang past the column limit. */
const HANGABLE = '、。，．,.';

/** Characters that must not be split from an identical neighbour. */
const NO_SPLIT = '…‥―—─';

export const isNoHead = (ch: string): boolean => NO_HEAD.includes(ch);
export const isNoEnd = (ch: string): boolean => NO_END.includes(ch);
export const isHangable = (ch: string): boolean => HANGABLE.includes(ch);
export const isNoSplitChar = (ch: string): boolean => NO_SPLIT.includes(ch);
