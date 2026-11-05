# assets

| フォルダ / Folder | 中身 / Contents |
|---|---|
| `publish/` | Figma Community にアップロードするファイル（英語版）: `icon-128.png`（128×128）、`cover.png`（1920×960）、`carousel1〜3.png`（1920×960）。デモ動画 `.mp4` もここに置く（git には入れない）。<br>Files to upload to Figma Community (English): icon, cover, carousel 1-3. The demo video goes here too (not tracked by git). |
| `publish-ja/` | カルーセルの日本語版。<br>Japanese versions of the carousel. |
| `note/` | note・Substack 用のカバー（1280×670、英語と日本語）。過去のサムネの型（左: タグ・見出し・サブタイトル、右: 正方形の台座）。<br>Cover for note / Substack (1280x670, English and Japanese), after the past thumbnail layout. |
| `source/` | 画像の元になる HTML と CSS。ブラウザで開き、1920×960（アイコンは 128×128）で撮ると作り直せる。<br>The HTML and CSS the images are made from. Open in a browser and capture at 1920×960 (icon: 128×128). |

## アイコンについて / About the icon
`publish/icon-128.png` は Figma で作っている（ファイル Plugins、ノード `43:53`、案 B：ベタ・横長・「三」の 3 種類のブロック）。`source/icon-640.png` はその 5 倍の書き出し。<br>
The icon is drawn in Figma (file "Plugins", node `43:53`, idea B: three block kinds). `source/icon-640.png` is a 5x export of it.

## 配色 / Palette (classic direction)
黒板緑 chalkboard green `#1F3A34` · 紙 paper `#E6E7DC` · 墨 ink `#1D2226` · 罫の水色 rule blue `#8CC8DF`

## レイアウト / Layout
過去のサムネ（Figma Plugins ファイル、ノード `45:4190`）の型に合わせる: 左に「アイコン付きタグ・太いゴシックの見出し 72px・2 行のサブタイトル 36px」、右に 506×506 の正方形の台座（墨色）と、その中に画像 1 つ。共通の CSS は `source/_note.css`。<br>
Follows the past thumbnail layout: left = icon tags, bold gothic title (72px) and a two-line subtitle (36px); right = a 506x506 square mat holding one picture. Shared CSS: `source/_note.css`.
