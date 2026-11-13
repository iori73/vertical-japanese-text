# assets

画像の元は Figma（ファイル「Plugins」）にある。ここにある PNG は、そこから書き出したもの。<br>
The source of these images is in Figma (file "Plugins"). The PNGs here are exports from it.

| フォルダ / Folder | 中身 / Contents |
|---|---|
| `publish/` | Figma Community にアップロードするファイル（英語版）: `icon-128.png`（128×128）、`cover.png`（1920×960）、`carousel1〜3.png`（1920×960）。デモ動画 `.mp4` もここに置く（git には入れない）。<br>Files to upload to Figma Community (English): icon, cover, carousel 1-3. The demo video goes here too (not tracked by git). |
| `publish-ja/` | カルーセルの日本語版。<br>Japanese versions of the carousel. |
| `note/` | note・Substack 用のカバー（1280×670、英語と日本語）。<br>Cover for note / Substack (1280x670, English and Japanese). |
| `source/` | アイコンの 5 倍書き出し（`icon-640.png`）。<br>A 5x export of the icon. |

## Figma の元 / Figma sources
過去のサムネの部品（`Thumbnail v3/…`）を使って作っている。型の元は過去の例（ノード `45:4190`）。<br>
Built with the Thumbnail v3 components; the layout comes from the past example (node `45:4190`).

| 画像 / Image | ノード / Node |
|---|---|
| cover EN / JA (1280×670) | `59:166` / `59:288` |
| carousel 1〜3, EN (1280×670) | `60:179`, `60:373`, `60:529` |
| carousel 1〜3, JA (1280×670) | `60:276`, `60:451`, `60:599` |
| Community 1920×960 (cover, carousel1 EN/JA, carousel2 EN/JA, carousel3 EN/JA) | `61:299`, `61:329`, `61:385`, `61:441`, `61:478`, `61:515`, `61:544` |
| icon (idea B) | `43:53` |

URL: `https://www.figma.com/design/26IH26Fh9F58EVqcPdyazI/Plugins?node-id=<node id with - instead of :>`

## 書き出し方 / How to export
1280×670 のフレームは、そのまま PNG に書き出す。Community 用の 1920×960 は、1280×670 のコピーを 1.5 倍にして、上に 22px ずらした枠（1920×960、はみ出しを切る）から書き出す。<br>
Export the 1280x670 frames as they are. For the 1920x960 Community images, a copy of the frame is scaled 1.5x and shifted up 22px inside a clipped 1920x960 frame.

## 配色 / Palette
黒板緑 chalkboard green `#1F3A34` · 紙 paper `#E6E7DC` · 墨 ink `#1D2226` · 罫の水色 rule blue `#8CC8DF`

## フォント / Fonts
見出し・サブタイトル: Noto Sans JP Medium（72px／80px、字間 −4%）。タグ: Space Mono Regular 32px。縦書きの例文: Noto Serif JP。<br>
Title and subtitle: Noto Sans JP Medium. Tags: Space Mono Regular 32px. Vertical sample text: Noto Serif JP.
