// Western digits to kanji numerals.

const DIGITS = '〇一二三四五六七八九';
const SMALL_UNITS = ['', '十', '百', '千'];
const BIG_UNITS = ['', '万', '億', '兆'];

/** Digit-by-digit: 2024 -> 二〇二四. Non-digits are returned untouched. */
export function toKanjiDigits(s: string): string {
  let out = '';
  for (const ch of s) {
    const d = ch.charCodeAt(0) - 48;
    out += ch.length === 1 && d >= 0 && d <= 9 ? DIGITS[d] : ch;
  }
  return out;
}

function groupToKanji(n: number): string {
  // n is 1..9999. 一 is dropped before 十, 百, 千 (千百十一).
  const ds = [Math.floor(n / 1000) % 10, Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  let out = '';
  for (let i = 0; i < 4; i++) {
    const d = ds[i];
    if (d === 0) continue;
    const unit = SMALL_UNITS[3 - i];
    if (unit === '') out += DIGITS[d];
    else out += (d === 1 ? '' : DIGITS[d]) + unit;
  }
  return out;
}

/**
 * Place-value reading: 2024 -> 二千二十四, 10000 -> 一万. Returns null when the
 * input is not a plain integer (leading zero, too long) so callers can fall
 * back to digit-by-digit.
 */
export function toKanjiPlace(s: string): string | null {
  if (!/^[0-9]+$/.test(s)) return null;
  if (s === '0') return '〇';
  if (s.startsWith('0') || s.length > 16) return null;
  const groups: number[] = [];
  for (let end = s.length; end > 0; end -= 4) {
    groups.push(Number(s.slice(Math.max(0, end - 4), end)));
  }
  let out = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    // A bare 1 before 万/億/兆 keeps its 一 (一万), but 千 stays 千.
    out += (g === 1 && i > 0 ? '一' : groupToKanji(g)) + BIG_UNITS[i];
  }
  return out;
}
