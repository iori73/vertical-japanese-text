# Vertical Japanese Text — Auto Reflow（縦書き自動折り返し）

縦書きブロックの高さを動かすだけで、列が自動で折り返され、親の幅が伸び縮みします。横書きの Auto Layout wrap を、縦書きに持ち込むプラグインです。<br>
Drag the height of a vertical block and its columns reflow while the width hugs the result: a wrap-like behavior for Japanese vertical text.

Figma には縦書きがありません。「横向き Auto Layout の中に、1 文字ごとに改行したテキストの列を右から左へ並べる」形で再現できますが、枠を引っぱっても折り返しません。このプラグインが、その折り返しを担います。<br>
Figma has no vertical writing. You can fake it with a horizontal auto-layout frame holding columns of text with one character per line, but dragging the frame never reflows them. This plugin does the reflowing.

## 使い方 / How to use

1. プラグインを開き、テキストレイヤー、または縦書きの列を並べた横向き Auto Layout のフレームを選んで「縦書きブロックにする」を押します。「新しい縦書きを作る」からも作れます。<br>
   Open the plugin, select a text layer or a horizontal auto-layout frame of vertical columns, and press "Make vertical block". You can also start from "Create new vertical text".
2. ブロックの**高さ**のハンドルを引きます。列の長さが変わり、折り返しと列数が決まり、幅が追従します。右端は動きません。<br>
   Drag the block's **height** handle. The column length changes, the wrap and column count follow, and the width hugs. The right edge stays put.
3. 文章は、パネルの本文欄、またはキャンバス上の列のテキストを直接直して変えます。数字・句読点などの元の文字は保たれます。<br>
   Change the text in the panel, or edit a column on the canvas. The original digits and punctuation are preserved.

## 約束事 / Things to know

- プラグインが**開いている間だけ**動きます（Figma の仕様）。閉じると、ただの普通のレイヤーとして残ります。<br>
  It only works **while the plugin is open** (a Figma limitation). When closed, the block stays as ordinary layers.
- 列は右から左に読むため、レイヤーパネルの順序は逆です（列 1 = 最後の子）。Auto Layout に右から左がないためです。<br>
  Columns read right to left, so the layer order is reversed (column 1 = last child), because auto layout has no right-to-left mode.
- 縦書き字形は、OpenType の `vert` を API から設定できないため、Unicode の縦書き用文字（︑︒﹁﹂︱ など）への置換で出します。回転セルに切り替えると、フォントに依存しません。<br>
  The OpenType `vert` feature cannot be set through the API, so vertical forms come from Unicode vertical-form characters (︑︒﹁﹂︱ and so on). The rotated-cell mode is font-independent.
- 数字・英字の縦中横・横向きは、テキストの一部だけ回転できないため、別ノード（セル）になります。<br>
  Horizontal-in-vertical (tate-chu-yoko) and sideways runs are separate nodes (cells), because part of a text layer cannot be rotated.
- ルビは扱いません。<br>
  Ruby (furigana) is not supported.

## 組版 / Typesetting

| 設定 / Setting | 選べるもの / Options |
|---|---|
| 数字 / Numerals | 縦中横（2 桁まで）· 横向き · 漢数字（二〇二四）· 漢数字（二千二十四）· 縦に積む |
| 英字 / Latin | 横向き · 縦中横（2 字まで）· 縦に積む |
| 縦書き字形 / Vertical forms | Unicode 置換 · 回転セル · そのまま |
| 禁則処理 / Line-break rules | 行頭禁則・行末禁則・分割禁止（……／——）。追い出しで処理 |
| ぶら下がり / Hanging | 句読点 `、。` を列の上限から 1 マスまで出す |

## 開発 / Development

```
npm install
npm run build        # 型チェック + code.js / ui.html を生成
npm test             # 組版コア（禁則・漢数字・縦中横・差分）の単体テスト
npm run watch
```

Figma デスクトップで、Plugins → Development → Import plugin from manifest… から `manifest.json` を読み込みます。<br>
In the Figma desktop app: Plugins → Development → Import plugin from manifest… and pick `manifest.json`.

### 構成 / Layout

- `src/core/` Figma に依存しない純関数: `kinsoku` `numerals` `segment` `layout` `model`（列→ノード、編集の取り込み）`typeset`<br>
  Pure, Figma-free functions
- `src/figma/` 薄いアダプタ: `render`（差分更新）`watch`（変更の検知）`convert`（取り込み・新規）`block`（pluginData）<br>
  Thin adapters
- `scripts/harness.ts` `use_figma` など pluginData のない環境で、同じ描画コードを動かす検証用（`node scripts/build-harness.mjs`）<br>
  Test harness for environments without pluginData

### 手動確認チェックリスト / Manual QA (Figma desktop)

自動化できない部分（イベント監視・パネル・pluginData）は、次を目で確認します。<br>
The parts that cannot be automated (event watching, panel, pluginData) are checked by hand.

- [ ] テキストを選び「縦書きブロックにする」→ 縦書きになり、元のテキストが消える（⌘Z で戻る）<br>
      Make vertical block from a text layer: it becomes vertical and the source layer is replaced (⌘Z undoes)
- [ ] 高さのハンドルをゆっくり・速く引く → 折り返しが追従し、右端が動かない<br>
      Drag the height handle slowly and quickly: columns follow and the right edge stays
- [ ] 幅のハンドルを引く → 幅が HUG に戻る<br>
      Drag the width handle: it snaps back to hug
- [ ] 列のテキストを直接直す → 全体が組み直され、数字・句読点の元の文字が保たれる<br>
      Edit a column's text directly: everything reflows and original digits/punctuation survive
- [ ] 列を 1 つ削除 → 組み直されて列が復活する（本文は削除した列ぶん減る）<br>
      Delete a column: the block reflows (the deleted column's text is gone)
- [ ] フォント・サイズ・色をレイヤーで変える → 反映される<br>
      Change font, size or color on a layer: the block follows
- [ ] 「自動で折り返す」をオフ → パネルの変更だけ反映される<br>
      Turn off Auto reflow: only panel edits apply
- [ ] ページを切り替えて戻る → 監視が続く<br>
      Switch pages and back: watching continues
- [ ] 親が Auto Layout のフレーム内に置いても壊れない<br>
      The block survives inside an auto-layout parent

## ライセンス / License

MIT（`LICENSE` を参照）。<br>
MIT (see `LICENSE`).
