"""Overlay the caption cards on a demo recording (the recording itself is not changed).

usage: python3 make-video.py <en|ja> <captions dir> <output.mp4>

<captions dir> holds cap1.png, cap2.png, ... rendered from caption.html (3466x1710, transparent).
Timings, texts and the source recording come from captions.json next to this file.
"""
import json
import os
import subprocess
import sys

lang, cap_dir, out = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
spec = json.load(open(os.path.join(here, 'captions.json')))[lang]
src = os.path.expanduser(spec['source'])
caps = spec['captions']

cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src]
parts, chain = [], []
for n, c in enumerate(caps, start=1):
    d = round(c['end'] - c['start'], 2)
    cmd += ['-framerate', '60', '-loop', '1', '-t', str(d), '-i', os.path.join(cap_dir, f'cap{n}.png')]
    # fade each card in and out over 0.4 s, and shift it to its start time
    parts.append(f'[{n}:v]format=rgba,fade=t=in:st=0:d=0.4:alpha=1,'
                 f'fade=t=out:st={round(d - 0.4, 2)}:d=0.4:alpha=1,setpts=PTS+{c["start"]}/TB[c{n}]')
prev = '0:v'
for n in range(1, len(caps) + 1):
    chain.append(f'[{prev}][c{n}]overlay=0:0:eof_action=pass[v{n}]')
    prev = f'v{n}'
filt = ';'.join(parts + chain) + f';[{prev}]format=yuv420p[v]'
cmd += ['-filter_complex', filt, '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '20',
        '-preset', 'medium', '-r', '60', '-movflags', '+faststart', out]
r = subprocess.run(cmd, capture_output=True, text=True)
print('exit', r.returncode, r.stderr[-400:])
sys.exit(r.returncode)
