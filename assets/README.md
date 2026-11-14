# assets

画像の元は Figma のファイル「Thumbnail/Icon」（`t1TmZXTMJG8QpnIyEwnXBu`）の、ページ「07 Lab / Figma Plugins」にある。ここにある PNG は、そこから書き出したもの。2026-11-14 に、前のファイル「Plugins」（`26IH26Fh9F58EVqcPdyazI`）から移した（Plugins 側は削除）。<br>
The source of these images is the Figma file "Thumbnail/Icon" (`t1TmZXTMJG8QpnIyEwnXBu`), page "07 Lab / Figma Plugins". The PNGs here are exports from it. Moved there from the "Plugins" file on 2026-11-14 (deleted from Plugins).

| フォルダ / Folder | 中身 / Contents |
|---|---|
| `publish/` | Figma Community にアップロードするファイル（英語版）: `icon-128.png`（128×128）、`cover.png`（1920×960）、`carousel1〜3.png`（1920×960）。デモ動画 `.mp4` もここに置く（git には入れない）。<br>Files to upload to Figma Community (English): icon, cover, carousel 1-3. The demo video goes here too (not tracked by git). |
| `publish-ja/` | カルーセルの日本語版。<br>Japanese versions of the carousel. |
| `note/` | note・Substack 用のカバー（1280×670、英語と日本語）。<br>Cover for note / Substack (1280x670, English and Japanese). |
| `source/` | アイコンの 5 倍書き出し（`icon-640.png`）と、カバー用に動画から切り出した 2 枚（`video-block-*.png`）。<br>A 5x export of the icon, and the two crops from the demo video used on the cover. |

## Figma の元 / Figma sources
過去のサムネの部品（`Thumbnail v3/…`）を使って作っている。<br>
Built with the Thumbnail v3 components.

セクション「Vertical Japanese Text」（`1384:5875`）の中を、3 つに分けている。「公開版」`1384:5876`（いま使っている素材）/「制作素材」`1384:10224`（デモ動画を録画したシーンと台本）/「アーカイブ」`1384:6568`（公開版に使わなかったもの。A1〜A6 に分類）。<br>
Section `1384:5875` holds three sections: Published `1384:5876`, Production `1384:10224` (scenes and script for the demo recording), Archive `1384:6568` (everything not used, grouped A1–A6).

**公開版 / Published（`1384:5876`）**

| 画像 / Image | ノード / Node |
|---|---|
| Community cover 1920×960 → `publish/cover.png` | `1384:5877` |
| icon（logo L1 — stacked cards）→ `publish/icon-128.png` | `1384:5976` |
| carousel 1〜3 1920×960, EN / JA | `1384:6201`, `1384:6277`, `1384:6334` / `1384:6383`, `1384:6459`, `1384:6516` |
| note / Substack cover EN / JA (1280×670) → `note/` | `1384:5996` / `1384:6095` |
| 状況メモ / status memo | `1384:6565` |

**アーカイブ / Archive（`1384:6568`）のグループ**

| グループ / Group | 中身 / Contents |
|---|---|
| A1 | 最初の版のセット（えんじ・緑、PNG を並べたもの）/ the first two sets as PNGs |
| A2 | アイコンの検討（10月の案 A〜D、ロゴ L2・L3）/ icon studies, logo ideas L2–L3 |
| A3 | 縦書きの出力の試作と画面の切り抜き / vertical-text output tests and crops |
| A4 | 前の版のカバー・カルーセル（Thumbnail v3 の 1280×670 と 1920×960。公開版のカルーセルはここの 1920 版の複製）/ the previous cover and carousels |
| A5 | カバーの検討（参考資料・カバー案 A〜E）/ cover studies and references |
| A6 | デモ動画のコマ / stills from the demo video |

URL: `https://www.figma.com/design/t1TmZXTMJG8QpnIyEwnXBu/Thumbnail-Icon?node-id=<node id with - instead of :>`

## 書き出し方 / How to export
1280×670 のフレームは、そのまま PNG に書き出す。Community 用の 1920×960 は、1280×670 のコピーを 1.5 倍にして、上に 22px ずらした枠（1920×960、はみ出しを切る）から書き出す。<br>
Export the 1280x670 frames as they are. For the 1920x960 Community images, a copy of the frame is scaled 1.5x and shifted up 22px inside a clipped 1920x960 frame.

## 配色 / Palette
黒板緑 chalkboard green `#1F3A34` · 紙 paper `#E6E7DC` · 墨 ink `#1D2226` · 罫の水色 rule blue `#8CC8DF`

## フォント / Fonts
見出し・サブタイトル: Noto Sans JP Medium（72px／80px、字間 −4%）。タグ: Space Mono Regular 32px。縦書きの例文: Noto Serif JP。<br>
Title and subtitle: Noto Sans JP Medium. Tags: Space Mono Regular 32px. Vertical sample text: Noto Serif JP.

## Community のカバー / Community cover
`publish/cover.png` は `1384:5877`（Plugins ファイルでは 77:1402 だった）の書き出し。同じブロックの 4 つの状態（高さ 560 → 466 → 405 → 347）を、右上の角をそろえて重ね（奥ほど薄く）、目盛りつきの縦横の矢印で「高さが縮み、幅が伸びる」を示す。フレームには外側に 8px の線があるので、1936×976 で書き出して周りを 8px 切る。<br>
`publish/cover.png` is exported from `1384:5877` (77:1402 in the old Plugins file): four states of the same block (height 560 → 466 → 405 → 347) stacked on a shared top-right corner, older ones paler, with ticked height/width arrows. The frame has an 8px outside stroke, so export at 1936x976 and crop 8px from each side.

## 前のカバーの実画面 / Real screens on the earlier covers
前のカバー（アーカイブの A4 にある 1280×670 の英・日と 1920×960）の台座には、デモ動画（`publish/Vertical Japanese Text demo - EN panel.mp4`）から切り出した実画面を 2 つ置いている（レイヤー `picture: video frames`）。同じブロックの、3.2 秒（252 × 560、5 列）と 11.6 秒（453.6 × 347、9 列）。カーソルが写らないコマを選び、キャンバス外の薄い灰色は白にそろえた。切り出した画像は `source/video-block-tall.png`・`source/video-block-wide.png`。前の絵（`picture: notebook`）は非表示で残している。動画を撮り直したら、同じ時刻で切り出し直す。<br>
The mat on the covers holds two real screens cut from the demo video (layer `picture: video frames`): the same block at 3.2 s (252 x 560, 5 columns) and 11.6 s (453.6 x 347, 9 columns), picked where the cursor is out of the way, with the light grey outside the canvas turned white. The crops are `source/video-block-tall.png` and `source/video-block-wide.png`. The previous drawing (`picture: notebook`) is kept, hidden. Re-cut at the same times if the video is re-recorded.
