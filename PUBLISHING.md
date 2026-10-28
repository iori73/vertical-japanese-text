# Vertical Japanese Text — Auto Reflow — Figma Community 公開の準備

公開フォームに貼る文面と、アセットの一覧です。**公開の申請は河野さんのアカウントで行います**（Plugins → Manage plugins → Publish）。

## 1. 公開前にやること

| # | 内容 | 状態 |
|---|---|---|
| 1 | Figma デスクトップで実機確認（README の手動チェックリスト） | ✅（2026-10-23 河野さん確認） |
| 2 | manifest.json の `id` を、Figma が発行する ID に置換（「Publish」の最初の画面で発行される） | 未 |
| 3 | ライセンスを決める（README の末尾に書く。LICENSE ファイルも置く） | ✅ MIT |
| 4 | カルーセル用に、実機のスクリーンショットを撮る（下記） | 未 |
| 5 | git init と初回コミット | ✅ |

## 2. アセット

| 用途 | ファイル | サイズ | 状態 |
|---|---|---|---|
| プラグインアイコン | `assets/icon-128.png`（元: `assets/icon.html`） | 128 × 128 | ✅ |
| カバーアート | `assets/cover.png`（元: `assets/cover.html`） | 1920 × 960 | ✅（CSS で描いた説明図。実機の画面ではない） |
| カルーセル 1 | 実機: 高さを引いて折り返しが変わる 3 コマ | 1920 × 960 | 未（実機で撮る） |
| カルーセル 2 | 実機: パネルと設定（数字・英字・縦書き字形） | 1920 × 960 | 未（実機で撮る） |
| カルーセル 3 | 実機: 縦中横・横向き・漢数字の違い | 1920 × 960 | 未（実機で撮る） |

作り直す場合は `assets/*.html` をブラウザで開き、ビューポートを 1920×960（アイコンは 128×128）にしてスクリーンショットを撮ります。

## 3. 公開フォームに入れる内容

### プラグイン名
```
Vertical Japanese Text — Auto Reflow
```
日本語名（説明文の冒頭に併記）: 縦書き自動折り返し

命名の根拠: Community で「vertical japanese」を検索すると Vertical Text JP（9.1k 利用）・Vertja（9.1k）などが出る。これらは「変換して終わり」型で、検索語（vertical / Japanese / text）を名前に含めつつ、競合にない「Auto Reflow」で差別化する。

### タグライン（日本語）
```
枠の高さを動かすだけで、縦書きが折り返す。（Vertical Japanese Text — Auto Reflow）
```

### Tagline (English)
```
Drag the height. Vertical Japanese text reflows.
```

### 説明文（日本語）
```
Figma には縦書きがありません。「横向き Auto Layout の中に、1 文字ごとに改行したテキストの列を右から左へ並べる」形で再現できますが、枠を引っぱっても折り返しません。

縦書きフローは、その折り返しを担います。縦書きブロックの高さのハンドルを引くだけで、列が自動で折り返され、親の幅が伸び縮みします。横書きの Auto Layout wrap と同じ感覚です。右端は動きません。

■ 使い方
1. テキスト、または縦書きの列を並べた横向き Auto Layout のフレームを選び、「縦書きブロックにする」を押す（「新しい縦書きを作る」からも作れます）
2. ブロックの高さのハンドルを引く
3. 文章は、パネルの本文欄、またはキャンバス上の列を直接直す（数字・句読点の元の文字は保たれます）

■ 組版
・禁則処理（行頭禁則・行末禁則・分割禁止）、句読点のぶら下がり
・縦書き用の句読点・括弧・長音（Unicode の縦書き字形、または回転セル）
・数字：縦中横／横向き／漢数字（二〇二四、二千二十四）／縦に積む
・英字：横向き／縦中横／縦に積む

■ 知っておいてください
・プラグインを開いている間だけ折り返しが効きます（Figma の仕様）。閉じると、普通のレイヤーとして残ります。
・列は右から左に読むため、レイヤーパネルの順序は逆です（列 1 = 最後の子）。
・ルビは扱いません。
```

### Description (English)
```
Figma has no vertical writing. You can fake it with a horizontal auto-layout frame holding columns of text with one character per line, but dragging the frame never reflows them.

This plugin does the reflowing. Drag the height handle of a vertical block and its columns wrap automatically while the parent width hugs the result, much like auto-layout wrap for horizontal text. The right edge stays put.

HOW TO USE
1. Select a text layer, or a horizontal auto-layout frame of vertical columns, and press "Make vertical block" (or start from "Create new vertical text")
2. Drag the block's height handle
3. Change the text in the panel, or edit a column directly on the canvas (original digits and punctuation are preserved)

TYPESETTING
- Japanese line-break rules (kinsoku: no punctuation at the start or end of a column, no-split pairs) and hanging punctuation
- Vertical punctuation, brackets and the long-vowel mark (Unicode vertical forms, or rotated cells)
- Numerals: horizontal-in-vertical (tate-chu-yoko) / sideways / kanji (二〇二四, 二千二十四) / stacked upright
- Latin: sideways / horizontal-in-vertical / stacked upright

GOOD TO KNOW
- Reflow works only while the plugin is open (a Figma limitation). When closed, the block stays as ordinary layers.
- Columns read right to left, so the layer order is reversed (column 1 = last child).
- Ruby (furigana) is not supported.
```

### タグ / Tags
```
vertical text, vertical japanese, japanese typography, tategaki, auto layout, text wrap, cjk, 縦書き
```

### サポート連絡先 / Support contact
河野さんの連絡先（公開フォームで入力）。

### ネットワークアクセス / Network access
なし（`allowedDomains: ["none"]`）。
