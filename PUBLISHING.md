# Vertical Japanese Text — Auto Reflow — Figma Community 公開の準備

公開フォームに貼る文面と、アセットの一覧です。**公開の申請は河野さんのアカウントで行います**（Plugins → Manage plugins → Publish）。
ソース: https://github.com/iori73/vertical-japanese-text

## 1. 公開前にやること

| # | 内容 | 状態 |
|---|---|---|
| 1 | Figma デスクトップで実機確認（README の手動チェックリスト） | ✅（2026-10-23 河野さん確認） |
| 2 | manifest.json の `id` を、Figma が発行する ID に置換 | ✅（1697269654969306192、2026-10-28） |
| 3 | ライセンス（MIT） | ✅ |
| 4 | カルーセル 3 枚 | ✅（§3） |
| 5 | サポート連絡先の決定 | ✅（フォーム入力済み） |
| 6 | GitHub リポジトリ | ✅ 公開済み |

## 2. アセット

| 用途 | ファイル | サイズ | 状態 |
|---|---|---|---|
| プラグインアイコン | `assets/icon-128.png`（元: `assets/icon.html`） | 128 × 128 | ✅ |
| カバーアート | `assets/cover.png`（元: `assets/cover.html`） | 1920 × 960 | ✅（CSS で描いた説明図。実機の画面ではない） |
| カルーセル 1〜3 | `assets/carousel1〜3.png`（日本語版は `-ja`） | 1920 × 960 | ✅（HTML で描いた説明図） |

作り直す場合は `assets/*.html` をブラウザで開き、ビューポートを 1920×960（アイコンは 128×128）にしてスクリーンショットを撮ります。

## 3. カルーセル（HTML で描いた説明図）

`assets/carousel1〜3.png`（英語）と `assets/carousel1〜3-ja.png`（日本語）を用意済み。元は同名の `.html`（共通 CSS は `_carousel.css`）。サンプル文は夏目漱石『吾輩は猫である』（著作権切れ）。

| # | 内容 |
|---|---|
| 1 | 高さ 640 / 430 / 300px で列が折り返す（幅が追従する） |
| 2 | パネルの設定（数字・英字・縦書き字形・禁則処理・ぶら下がり） |
| 3 | 数字の 4 通りの組み方（縦中横・横向き・漢数字・縦に積む） |

実機のスクリーンショットに差し替えたい場合は、同じ内容を 1920×960 で撮る。

## 4. 公開フォームに入れる内容

### プラグイン名 / Name
```
Vertical Japanese Text — Auto Reflow
```
日本語名: 縦書き自動折り返し

命名の根拠: 海外のユーザーは「縦書き」「tategaki」を知らないので、名前は英語の一般語だけにする。Community で「vertical japanese」を検索すると Vertical Text JP（9.1k 利用）・Vertja（9.1k）などが出る。これらは「変換して終わり」型で、検索語（vertical / Japanese / text）を名前に含めつつ、競合にない「Auto Reflow」で差別化する。名前欄に長さの上限があって入らない場合は `Vertical Japanese Text` にして、Auto Reflow はタグラインに回す。

### タグライン / Tagline
海外のユーザーが対象なので、**英語を先頭**にする（一覧や検索結果で最初に見えるのは先頭だけ）。欄が 1 つなので 1 行に入れる:
```
Vertical Japanese writing in Figma: drag the height and the columns reflow. / 縦書きが折り返す
```
長さの上限で入らない場合は、英語だけを入れる:
```
Vertical Japanese writing in Figma: drag the height and the columns reflow.
```

### 説明文 / Description
1 つの欄に、段落ごとに**英語→日本語**の順で交互に並べる（組の中は改行、組の間は空行）。冒頭は検索語（vertical Japanese text / vertical writing）を含む英語にする:
```
Vertical Japanese text for Figma. Drag the height of a vertical writing block and its columns reflow automatically, like auto-layout wrap for horizontal text.
縦書きブロックの高さを引くだけで、列が自動で折り返されます。横書きの Auto Layout wrap と同じ感覚です。

Figma has no vertical writing. You can fake it with a horizontal auto-layout frame holding columns of text with one character per line, but dragging the frame never reflows them. This plugin does the reflowing, and the parent width hugs the result. The right edge stays put.
Figma には縦書きがありません。1 文字ごとに改行した列を右から左へ並べる形で再現できますが、枠を引っぱっても折り返しません。このプラグインがその折り返しを担い、親の幅も追従します。右端は動きません。

HOW TO USE / 使い方
1. Select a text layer, or a horizontal auto-layout frame of vertical columns, and press "Make vertical block" (or start from "Create new vertical text").
   テキスト、または縦書きの列を並べたフレームを選び、「縦書きブロックにする」を押す（「新しい縦書きを作る」からも作れます）。
2. Drag the block's height handle.
   ブロックの高さのハンドルを引く。
3. Change the text in the panel, or edit a column directly on the canvas (original digits and punctuation are preserved).
   パネルの本文欄、またはキャンバス上の列を直接直す（数字・句読点の元の文字は保たれます）。

TYPESETTING / 組版
- Japanese line-break rules (kinsoku: no punctuation at the start or end of a column, no-split pairs) and hanging punctuation.
  禁則処理（行頭禁則・行末禁則・分割禁止）、句読点のぶら下がり。
- Vertical punctuation, brackets and the long-vowel mark (Unicode vertical forms, or rotated cells).
  縦書き用の句読点・括弧・長音（Unicode の縦書き字形、または回転セル）。
- Numerals: horizontal-in-vertical (tate-chu-yoko) / sideways / kanji (二〇二四, 二千二十四) / stacked upright.
  数字：縦中横／横向き／漢数字／縦に積む。
- Latin: sideways / horizontal-in-vertical / stacked upright.
  英字：横向き／縦中横／縦に積む。

GOOD TO KNOW / 知っておいてください
- Reflow works only while the plugin is open (a Figma limitation). When closed, the block stays as ordinary layers.
  プラグインを開いている間だけ折り返しが効きます（Figma の仕様）。閉じると普通のレイヤーとして残ります。
- Columns read right to left. The Layers panel lists them from the top in reading order: the first column is the rightmost one, at the top of the list.
  列は右から左に読みます。レイヤーパネルでは、読む順に上から並びます（1 列目 = 右端 = 一番上のレイヤー）。
- Ruby (furigana) is not supported.
  ルビ（ふりがな）は扱いません。
```

### タグ / Tags
```
vertical text, vertical japanese, japanese vertical writing, japanese typography, japanese text, auto layout, text wrap, cjk, 縦書き, tategaki
```
（`縦書き` と `tategaki` は日本語ユーザー・日本語を知る人の検索用で、最後に置く。海外ユーザーは tategaki を知らないので、名前・タグライン・説明の冒頭には使わない）

### リリースノート / Release notes（初回）
```
初公開。縦書きブロックの高さを引くと列が折り返し、幅が追従します。
First release. Drag the height of a vertical block and its columns reflow while the width follows.
```

### 開発者向けの欄 / Other fields
| 項目 | 入れる内容 |
|---|---|
| カテゴリ | 「Fonts & typography」系（検索の関連コレクションに合わせる） |
| ネットワークアクセス | なし（`allowedDomains: ["none"]`） |
| サポート連絡先 | 河野さんが決める（メール or GitHub Issues: https://github.com/iori73/vertical-japanese-text/issues） |
| ライセンス | プラグイン本体は MIT（GitHub）。Community 側の表示は Figma 既定のライセンスになる |
| 価格 | 無料 |
