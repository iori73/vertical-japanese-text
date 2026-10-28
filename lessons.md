# Vertical Japanese Text — 学び

## [2026-10-23] OpenType の `vert` は API から設定できない

**事象**: 縦書き字形（︑︒﹁﹂ー）を OpenType の `vert` で出すつもりだった。型定義に `'VERT'` はある。

**原因**: `openTypeFeatures` と `getRangeOpenTypeFeatures` は**読み取り専用**で、設定する API（`setRange...`）がない。

**対処**: Unicode の縦書き用文字（U+FE10〜FE48）に置換する。スパイクで日本語フォント 10 種（BIZ UD・Noto・Shippori・Zen・Kaisei・Klee・Sawarabi・M PLUS）を並べて、すべて縦書きの形に出ることを確認。`〜～` だけは縦書き字形がないので、回転セルにする。

**学び**: 型定義に名前があることと、書き込めることは別。設計の前提にする前に、書き込み用の API が実在するかを `grep "setRange"` で確かめる。

## [2026-10-23] 縦中横は、フォントを縮めすぎない

スパイクで 2 桁を 0.62 倍にしたら小さすぎた。「1 マス幅に収まる大きさを実測して決める」のが正しい（`fitWidth`）。半角の 2 桁は、ほとんどのフォントで 1 em 前後に収まる。

## [2026-10-23] Figma のサイズは float32

`24 × 16.64 = 399.36` を `resize` して読み戻すと `399.35998`。`floor(h / advance)` が 23 になり、1 字ぶん少なく折り返した。容量の計算に 0.01px の許容誤差を入れる（`capacityFor`）。

## [2026-10-23] `resize()` は Auto Layout のサイズ指定を FIXED に戻す

`primaryAxisSizingMode = 'AUTO'` を先に設定して `resize()` すると、HUG が外れる。**先に resize、あとでサイズ指定**。テキストも同じで、`resize()` のあとに `textAutoResize = 'HEIGHT'` を設定し直す。

## [2026-10-23] 新しい API は型定義に無いことがある

`figma.createAutoLayout()` は、入れた `@figma/plugin-typings` 1.100 には無かった。`createFrame()` + `layoutMode` で書けば、古い環境でも動く。

## [2026-10-23] dynamic-page では `getNodeById` が使えない

同期版は使えない。フレームの子を直接たどる（`runStyleOf`）か、`getNodeByIdAsync`。変更の検知は `figma.on('documentchange')`（全ページ読み込みが要る）ではなく `figma.currentPage.on('nodechange')`。

## [2026-10-23] 検証のやり方（`use_figma` では pluginData が使えない）

描画のコードは `Store` を注入する形にして、検証用には `memoryStore()` を渡す。`scripts/harness.ts` を束ねて貼り付ければ、本物の描画（取り込み・高さ変更・直接編集の取り込み）を実ファイルで確かめられる。**イベント監視・パネル・pluginData は自動化できない**ので、README の手動確認チェックリストで見る。

貼り付けた束の中身を書き換えると壊れる（`readCurrent` の戻り値を直して `TypeError` になった）。束は一字も直さず貼る。


## 命名は先に Community で競合を検索する（2026-10-23）
- 当初の名前 Tategaki Flow は日本人にしか通じず、「vertical japanese」の検索に出ない。公開前に Figma Community を検索して、先行プラグイン（Vertical Text JP / Vertja など）と検索語を確認する。
- 名前には英語の一般語（Vertical Japanese Text）、差別化（Auto Reflow）を入れる。tategaki はタグにだけ残す。


## Figma Community への公開で詰まった所（2026-10-28）
- **Plugin ID は、公開フォームを開くたびに「Generate ID」で発行される。** ID を manifest.json に入れて、Figma で `Import plugin from manifest…` を取り込み直すまで、ステップ 4 に「Invalid ID in manifest.json」が出る。フォームは閉じずに、取り込み直すと警告が消える。
- **ID の食い違い（仮の ID を置いていた旧フォルダを取り込んでいた）に注意。** 公開に使うフォルダの manifest を取り込む。
- **Data security の質問 4:** `node.setPluginData` を使うなら「Yes, ... stores data ... locally」を選ぶ（「No」は誤り）。ネットワーク・認証・バックエンドは「なし」。
- **ステップ 4 のどこかに「Author (Share as)」の選択があり、未選択だと Publish が進まない。** エラー表示が出ないので、押せないときはフォームを最後までスクロールして、未選択の項目を探す。
- 画像（アイコン・カバー・カルーセル）は HTML を headless Chrome で撮った PNG で足りた。実機のスクリーンショットは必須ではない。
