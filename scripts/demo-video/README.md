# デモ動画のキャプション / Demo video captions

デモ動画（英語版・日本語版）は、画面の録画にキャプションの帯を重ねて作る。録画そのものは変えない。<br>
The demo videos (EN and JA) are screen recordings with caption cards overlaid. The recordings themselves are not changed.

| ファイル / File | 中身 / Contents |
|---|---|
| `captions.json` | 元の録画、出力のファイル名、各キャプションの時刻と文言（英・日）。<br>Source recording, output name, and each caption's timing and text. |
| `caption.html` | キャプション 1 枚。`caption.html?lang=en&i=0` で開くと、`captions.json` の文言が入る。<br>One caption card; `?lang=en&i=0` fills it from `captions.json`. |
| `make-video.py` | キャプションの PNG を、時刻どおりに録画へ重ねる（0.4 秒のフェード）。<br>Overlays the caption PNGs on the recording at their times (0.4 s fades). |

## 書体 / Fonts
Figma の部品（Thumbnail v3）と同じ。本文は Noto Sans JP Medium、タグ「FIGMA PLUGIN」と「1 / 6」は Space Mono。この Mac には入っていないので、`caption.html` は Google Fonts から読み込む（撮るときにネットが要る）。<br>
Same as the Figma Thumbnail v3 parts: Noto Sans JP Medium for text, Space Mono for the tag and step number. They are not installed on this Mac, so `caption.html` loads them from Google Fonts (network needed when rendering).

## 作り直し方 / How to rebuild
1. このフォルダを配信する（例: `python3 -m http.server 8765`）。`fetch('captions.json')` を使うので、ファイルを直接開くのでは動かない。<br>
   Serve this folder (e.g. `python3 -m http.server 8765`); `caption.html` fetches `captions.json`, so `file://` does not work.
2. ブラウザで 3466×1710 のビューポートにして、各キャプションを背景を透明にして撮る（Playwright なら `page.screenshot({ omitBackground: true })`）。英語は 7 枚、日本語は 5 枚。`out/captions/en/cap1.png …` のように保存する。<br>
   Render each card at a 3466x1710 viewport with a transparent background (Playwright: `omitBackground: true`): 7 for EN, 5 for JA, saved as `out/captions/en/cap1.png …`.
3. 重ねる。<br>
   Overlay:
   ```
   python3 scripts/demo-video/make-video.py en out/captions/en "out/Vertical Japanese Text demo - EN panel.mp4"
   python3 scripts/demo-video/make-video.py ja out/captions/ja "out/Vertical Japanese Text demo - JA panel.mp4"
   ```
4. できた動画を `assets/publish/` に置く（git には入れない）。<br>
   Put the videos in `assets/publish/` (not tracked by git).

録画を撮り直したら、`captions.json` の時刻を合わせ直す。<br>
If the recording is redone, re-time `captions.json`.
