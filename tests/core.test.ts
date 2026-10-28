import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toKanjiDigits, toKanjiPlace } from '../src/core/numerals.ts';
import { segment } from '../src/core/segment.ts';
import { capacityFor, typeset } from '../src/core/typeset.ts';
import { DEFAULT_SETTINGS, type Settings } from '../src/core/types.ts';
import {
  decodeModel,
  encodeModel,
  entriesOf,
  MODEL_LIMIT,
  nodeText,
  reconcile,
  type Model,
} from '../src/core/model.ts';

const S = (over: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...over });
const seg = { fontSize: 16, advance: 16.64 };
const texts = (src: string, s: Settings) => segment(src, s, seg).map((c) => c.text);
const colsOf = (src: string, capacity: number, s = S()) =>
  typeset({ paragraphs: [src], settings: s, fontSize: 16, advance: 16.64, capacity }).map((c) =>
    c.nodes.flatMap((n) => n.cells.map((x) => x.text)).join(''),
  );

test('kanji digits', () => {
  assert.equal(toKanjiDigits('2024'), '二〇二四');
  assert.equal(toKanjiDigits('076'), '〇七六');
});

test('kanji place values', () => {
  assert.equal(toKanjiPlace('2024'), '二千二十四');
  assert.equal(toKanjiPlace('10'), '十');
  assert.equal(toKanjiPlace('100'), '百');
  assert.equal(toKanjiPlace('1000'), '千');
  assert.equal(toKanjiPlace('1111'), '千百十一');
  assert.equal(toKanjiPlace('10000'), '一万');
  assert.equal(toKanjiPlace('12345'), '一万二千三百四十五');
  assert.equal(toKanjiPlace('100000'), '十万');
  assert.equal(toKanjiPlace('0'), '〇');
  assert.equal(toKanjiPlace('076'), null);
  assert.equal(toKanjiPlace('1.5'), null);
});

test('vertical forms replace punctuation', () => {
  assert.deepEqual(texts('あ、い。', S()), ['あ', '︑', 'い', '︒']);
  assert.deepEqual(texts('「夏」', S()), ['﹁', '夏', '﹂']);
  assert.deepEqual(texts('ー', S()), ['︱']);
  assert.deepEqual(texts('、', S({ forms: 'none' })), ['、']);
});

test('wave dash is always a rotated cell unless forms are off', () => {
  const [c] = segment('〜', S(), seg);
  assert.equal(c.kind, 'rotchar');
  const [d] = segment('〜', S({ forms: 'none' }), seg);
  assert.equal(d.kind, 'char');
});

test('rotate mode: brackets rotate, comma shifts', () => {
  const kinds = segment('「、」', S({ forms: 'rotate' }), seg).map((c) => c.kind);
  assert.deepEqual(kinds, ['rotchar', 'shift', 'rotchar']);
});

test('numerals: tate-chu-yoko up to 2 digits, longer stacks upright', () => {
  const two = segment('18', S(), seg);
  assert.equal(two.length, 1);
  assert.equal(two[0].kind, 'tcy');
  const four = segment('2024', S(), seg);
  assert.deepEqual(four.map((c) => c.kind), ['char', 'char', 'char', 'char']);
  const one = segment('9', S(), seg);
  assert.equal(one[0].kind, 'char');
});

test('numerals: sideways keeps a phone number as one cell', () => {
  const [c, ...rest] = segment('076-241', S({ numerals: 'sideways' }), seg);
  assert.equal(rest.length, 0);
  assert.equal(c.kind, 'sideways');
  assert.equal(c.src, '076-241');
});

test('numerals: kanji modes', () => {
  assert.deepEqual(texts('2024年', S({ numerals: 'kanji' })), ['二', '〇', '二', '四', '年']);
  assert.deepEqual(texts('2024年', S({ numerals: 'kanji-place' })), [
    '二', '千', '二', '十', '四', '年',
  ]);
  // source still reproduces exactly
  const cells = segment('2024年', S({ numerals: 'kanji-place' }), seg);
  assert.equal(cells.map((c) => c.src).join(''), '2024年');
  // 1,500 is read as an integer; a phone number falls back to digit-by-digit
  assert.deepEqual(texts('1,500', S({ numerals: 'kanji-place' })), ['千', '五', '百']);
  assert.deepEqual(texts('076', S({ numerals: 'kanji-place' })), ['〇', '七', '六']);
  assert.equal(
    segment('1,500', S({ numerals: 'kanji-place' }), seg).map((c) => c.src).join(''),
    '1,500',
  );
});

test('numerals: fullwidth digits are normalized', () => {
  const [c] = segment('１８', S(), seg);
  assert.equal(c.kind, 'tcy');
  assert.equal(c.text, '18');
  assert.equal(c.src, '１８');
});

test('latin: sideways by default, tcy and upright on request', () => {
  assert.equal(segment('TEL', S(), seg)[0].kind, 'sideways');
  assert.equal(segment('ab', S({ latin: 'tcy' }), seg)[0].kind, 'tcy');
  assert.equal(segment('abc', S({ latin: 'tcy' }), seg)[0].kind, 'sideways');
  assert.equal(segment('TEL', S({ latin: 'upright' }), seg).length, 3);
});

test('latin token keeps an email address in one cell', () => {
  const cells = segment('example@example.com', S(), seg);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].kind, 'sideways');
  assert.ok(cells[0].span > 5);
});

test('!? pairs become tate-chu-yoko', () => {
  const [c] = segment('！？', S(), seg);
  assert.equal(c.kind, 'tcy');
});

test('capacity from frame height', () => {
  assert.equal(capacityFor(400, 16.64), 24);
  assert.equal(capacityFor(10, 16.64), 1);
});

test('layout: plain wrap by capacity', () => {
  assert.deepEqual(colsOf('あいうえおかきくけこ', 4), ['あいうえ', 'おかきく', 'けこ']);
});

test('layout: oidashi keeps 、。 off the column head', () => {
  // capacity 4: あいうえ | 、おか -> the comma would lead column 2, so え moves down
  const cols = colsOf('あいうえ、おか', 4);
  assert.ok(!cols[1].startsWith('︑'));
  assert.deepEqual(cols, ['あいう', 'え︑おか']);
});

test('layout: closing bracket never leads a column', () => {
  const cols = colsOf('あいう」えお', 3);
  assert.ok(!cols.some((c) => c.startsWith('﹂')));
});

test('layout: opening bracket never ends a column', () => {
  const cols = colsOf('あいう「えお', 4);
  assert.ok(!cols.some((c) => c.endsWith('﹁')));
  assert.deepEqual(cols, ['あいう', '﹁えお']);
});

test('layout: ellipsis pair is not split', () => {
  const cols = colsOf('あい……う', 3, S({ forms: 'none' }));
  assert.ok(cols.every((c) => c !== 'あい…'));
});

test('layout: hanging lets 、 overflow by one cell', () => {
  const plain = colsOf('あいうえ、おか', 4, S({ hang: false }));
  const hung = colsOf('あいうえ、おか', 4, S({ hang: true }));
  assert.deepEqual(hung, ['あいうえ︑', 'おか']);
  assert.notDeepEqual(plain, hung);
});

test('layout: kinsoku off allows a comma at the head', () => {
  const cols = colsOf('あいうえ、おか', 4, S({ kinsoku: false }));
  assert.equal(cols[1][0], '︑');
});

test('layout: paragraphs always start a new column', () => {
  const plans = typeset({
    paragraphs: ['あい', 'うえ'],
    settings: S(),
    fontSize: 16,
    advance: 16.64,
    capacity: 10,
  });
  assert.equal(plans.length, 2);
  assert.deepEqual(plans.map((p) => p.para), [true, true]);
});

test('layout: a sideways cell wider than a column is split, source preserved', () => {
  const cells = typeset({
    paragraphs: ['sample_user_address@example.com'],
    settings: S(),
    fontSize: 16,
    advance: 16.64,
    capacity: 3,
  });
  assert.ok(cells.length > 1);
  const src = cells.flatMap((c) => c.nodes.flatMap((n) => n.cells.map((x) => x.src))).join('');
  assert.equal(src, 'sample_user_address@example.com');
});

test('layout: every column holds at least one cell and nothing is lost', () => {
  const text = '「あ」、（い）。……う、、、。。。えお';
  for (const cap of [1, 2, 3, 4, 5, 7]) {
    for (const hang of [false, true]) {
      const cols = typeset({
        paragraphs: [text],
        settings: S({ hang }),
        fontSize: 16,
        advance: 16.64,
        capacity: cap,
      });
      assert.ok(cols.every((c) => c.nodes.length > 0), `cap ${cap}`);
      const src = cols.flatMap((c) => c.nodes.flatMap((n) => n.cells.map((x) => x.src))).join('');
      assert.equal(src, text, `cap ${cap} hang ${hang}`);
    }
  }
});

// ---- reconcile (canvas edits -> source) ----

function modelFor(paragraphs: string[], s: Settings, capacity: number): Model {
  const plans = typeset({ paragraphs, settings: s, fontSize: 16, advance: 16.64, capacity });
  let id = 0;
  return {
    cols: plans.map((p) => ({
      id: `c${id++}`,
      para: p.para,
      nodes: p.nodes.map((n) => ({ id: `n${id++}`, kind: n.kind, entries: entriesOf(n) })),
    })),
  };
}

function currentFrom(model: Model, plansText: (nodeId: string) => string | undefined) {
  return model.cols.map((c) => ({
    id: c.id,
    nodes: c.nodes.map((n) => ({
      id: n.id,
      kind: n.kind,
      text: plansText(n.id) ?? (n.kind === 'run' ? n.entries.map((e) => e[0]).join('\n') : n.entries[0][0]),
    })),
  }));
}

test('reconcile: untouched canvas returns the source exactly', () => {
  const src = ['あ、い。2024年のTEL076-241です'];
  const s = S({ numerals: 'kanji-place' });
  const model = modelFor(src, s, 6);
  assert.deepEqual(reconcile(model, currentFrom(model, () => undefined)), src);
});

test('reconcile: editing one character keeps digits and punctuation intact', () => {
  const src = ['あい、うえ2024おか'];
  const model = modelFor(src, S({ numerals: 'kanji' }), 20);
  const run = model.cols[0].nodes[0];
  // change "う" to "ゔ"; everything else (、 and kanji-typeset 2024) must stay source-true
  const edited = run.entries.map((e) => (e[1] === 'う' ? 'ゔ' : e[0])).join('\n');
  const out = reconcile(model, currentFrom(model, (id) => (id === run.id ? edited : undefined)));
  assert.deepEqual(out, ['あい、ゔえ2024おか']);
});

test('reconcile: a typed vertical-form comma maps back to 、', () => {
  const model = modelFor(['あい'], S(), 5);
  const run = model.cols[0].nodes[0];
  const out = reconcile(
    model,
    currentFrom(model, (id) => (id === run.id ? 'あ\n︑\nい' : undefined)),
  );
  assert.deepEqual(out, ['あ、い']);
});

test('reconcile: deleting a node drops its text; blank lines are ignored', () => {
  const model = modelFor(['あいう'], S(), 5);
  const run = model.cols[0].nodes[0];
  const out = reconcile(model, currentFrom(model, (id) => (id === run.id ? 'あ\n\nう' : undefined)));
  assert.deepEqual(out, ['あう']);
});

test('reconcile: paragraph boundaries survive and columns of one paragraph join', () => {
  const model = modelFor(['あいうえお', 'かき'], S(), 3);
  const out = reconcile(model, currentFrom(model, () => undefined));
  assert.deepEqual(out, ['あいうえお', 'かき']);
});

test('nodeText draws one cell per line', () => {
  const plans = typeset({
    paragraphs: ['あい'],
    settings: S(),
    fontSize: 16,
    advance: 16.64,
    capacity: 5,
  });
  assert.equal(nodeText(plans[0].nodes[0]), 'あ\nい');
});

test('model encoding round-trips, including cells whose source differs or is empty', () => {
  const model = modelFor(['2024年のTEL、あ。'], S({ numerals: 'kanji-place' }), 8);
  const back = decodeModel(encodeModel(model));
  assert.deepEqual(back?.cols.map((c) => c.nodes.map((n) => n.entries)), model.cols.map((c) => c.nodes.map((n) => n.entries)));
  assert.equal(back?.lite, false);
  // an empty source (the tail of 二千二十四) survives
  assert.ok(back!.cols.flatMap((c) => c.nodes).some((n) => n.entries.some((e) => e[1] === '')));
});

test('a model that is too long for pluginData is stored lite and refuses canvas reconcile', () => {
  const long = 'あ、'.repeat(10000); // 20,000 characters, about 830 columns
  const model = modelFor([long], S(), 24);
  const raw = encodeModel(model);
  assert.ok(raw.length > MODEL_LIMIT / 2);
  assert.ok(raw.length < 100000, 'lite encoding stays under the pluginData limit');
  const back = decodeModel(raw)!;
  assert.equal(back.lite, true);
  assert.equal(reconcile(back, currentFrom(back, () => undefined)), null);
});
