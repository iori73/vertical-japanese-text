# Vertical Japanese Text — Auto Reflow — Figma Community 公開の準備

公開フォームに貼る文面と、アセットの一覧です。**公開の申請は河野さんのアカウントで行います**（Plugins → Manage plugins → Publish）。
ソース: https://github.com/iori73/vertical-japanese-text

## 1. 公開前にやること

| # | 内容 | 状態 |
|---|---|---|
| 1 | Figma デスクトップで実機確認（README の手動チェックリスト） | ✅（2026-10-23 河野さん確認） |
| 2 | manifest.json の `id` を、Figma が発行する ID に置換（「Publish」の最初の画面で発行される） | 未（河野さん: ID を共有） |
| 3 | ライセンス（MIT） | ✅ |
| 4 | カルーセル 3 枚（下記 §3 の手順で実機を撮る） | 未（河野さん） |
| 5 | サポート連絡先の決定 | 未（河野さん） |
| 6 | GitHub リポジトリ | ✅ 公開済み |

## 2. アセット

| 用途 | ファイル | サイズ | 状態 |
|---|---|---|---|
| プラグインアイコン | `assets/icon-128.png`（元: `assets/icon.html`） | 128 × 128 | ✅ |
| カバーアート | `assets/cover.png`（元: `assets/cover.html`） | 1920 × 960 | ✅（CSS で描いた説明図。実機の画面ではない） |
| カルーセル 1〜3 | 実機のスクリーンショット | 1920 × 960 | 未（§3） |

作り直す場合は `assets/*.html` をブラウザで開き、ビューポートを 1920×960（アイコンは 128×128）にしてスクリーンショットを撮ります。

## 3. カルーセルの撮り方（実機・3 枚）

共通: 背景は無地（白かごく薄いグレー）の新規ページ。サンプル文は著作権切れの文（例: 夏目漱石『吾輩は猫である』）。クライアント案件の文は使わない。撮影後は 1920×960 に切り抜く（Figma で 1920×960 のフレームを作り、その中に配置して Export → PNG でもよい）。

| # | 見せたいこと | 撮り方 |
|---|---|---|
| 1 | 高さを引くと折り返す | 同じ縦書きブロックを 3 つ並べ、高さを 250 / 410 / 600px に変えて、幅が追従している様子を 1 枚に並べる。各ブロックの下に「250 × … Hug」などのサイズ表示（Figma の選択枠）が見えるようにする |
| 2 | パネルと設定 | ブロックを選んだ状態でプラグインのパネルを開き、キャンバスとパネルが 1 枚に収まるようにする。数字・英字・縦書き字形の設定が見えること |
| 3 | 数字・英字の見せ方の違い | 同じ文（例: 「2024年10月、TEL 03」）を、縦中横・横向き・漢数字（二〇二四）の 3 通りで並べる |

各画像にキャプションを付ける場合は、1〜2 文で「何を示すか」だけを書く（日本語の次に英語）。

## 4. 公開フォームに入れる内容

### プラグイン名 / Name
```
Vertical Japanese Text — Auto Reflow
```
日本語名: 縦書き自動折り返し

命名の根拠: Community で「vertical japanese」を検索すると Vertical Text JP（9.1k 利用）・Vertja（9.1k）などが出る。これらは「変換して終わり」型で、検索語（vertical / Japanese / text）を名前に含めつつ、競合にない「Auto Reflow」で差別化する。名前欄に長さの上限があって入らない場合は `Vertical Japanese Text` にして、Auto Reflow はタグラインに回す。

### タグライン / Tagline
Figma のフォームは欄が 1 つなので、日英を 1 行に入れる:
```
枠の高さを動かすだけで、縦書きが折り返す。 / Drag the height. Vertical Japanese text reflows.
```
長さの上限で入らない場合は、英語だけを入れる:
```
Drag the height. Vertical Japanese text reflows.
```

### 説明文 / Description
1 つの欄に、段落ごとに日本語→英語を交互に並べる（組の中は改行、組の間は空行）:
```
Figma には縦書きがありません。「横向き Auto Layout の中に、1 文字ごとに改行したテキストの列を右から左へ並べる」形で再現できますが、枠を引っぱっても折り返しません。
Figma has no vertical writing. You can fake it with a horizontal auto-layout frame holding columns of text with one character per line, but dragging the frame never reflows them.

このプラグインは、その折り返しを担います。縦書きブロックの高さのハンドルを引くだけで、列が自動で折り返され、親の幅が伸び縮みします。横書きの Auto Layout wrap と同じ感覚で、右端は動きません。
This plugin does the reflowing. Drag the height handle of a vertical block and its columns wrap automatically while the parent width hugs the result, much like auto-layout wrap for horizontal text. The right edge stays put.

■ 使い方 / How to use
1. テキスト、または縦書きの列を並べた横向き Auto Layout のフレームを選び、「縦書きブロックにする」を押す（「新しい縦書きを作る」からも作れます）
   Select a text layer, or a horizontal auto-layout frame of vertical columns, and press "Make vertical block" (or start from "Create new vertical text").
2. ブロックの高さのハンドルを引く
   Drag the block's height handle.
3. 文章は、パネルの本文欄、またはキャンバス上の列を直接直す（数字・句読点の元の文字は保たれます）
   Change the text in the panel, or edit a column directly on the canvas (original digits and punctuation are preserved).

■ 組版 / Typesetting
・禁則処理（行頭禁則・行末禁則・分割禁止）、句読点のぶら下がり
  Japanese line-break rules (kinsoku: no punctuation at the start or end of a column, no-split pairs) and hanging punctuation.
・縦書き用の句読点・括弧・長音（Unicode の縦書き字形、または回転セル）
  Vertical punctuation, brackets and the long-vowel mark (Unicode vertical forms, or rotated cells).
・数字：縦中横／横向き／漢数字（二〇二四、二千二十四）／縦に積む
  Numerals: horizontal-in-vertical (tate-chu-yoko) / sideways / kanji (二〇二四, 二千二十四) / stacked upright.
・英字：横向き／縦中横／縦に積む
  Latin: sideways / horizontal-in-vertical / stacked upright.

■ 知っておいてください / Good to know
・プラグインを開いている間だけ折り返しが効きます（Figma の仕様）。閉じると、普通のレイヤーとして残ります。
  Reflow works only while the plugin is open (a Figma limitation). When closed, the block stays as ordinary layers.
・列は右から左に読むため、レイヤーパネルの順序は逆です（列 1 = 最後の子）。
  Columns read right to left, so the layer order is reversed (column 1 = last child).
・ルビ（ふりがな）は扱いません。
  Ruby (furigana) is not supported.
```

### タグ / Tags
```
vertical text, vertical japanese, japanese typography, tategaki, auto layout, text wrap, cjk, 縦書き
```
（`tategaki` と `縦書き` は日本語ユーザーの検索用。名前・本文には使わない）

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
