#!/usr/bin/env python3
"""Stamp local CSS/JS references in index.html with a content hash (?v=abc123).

GitHub Pages serves every file with max-age=600, so after a deploy a browser can
combine a fresh index.html with a stale styles.css or mission.js. Changing the
query string whenever a file's content changes forces a fresh fetch.

Run before committing:  python3 tools/bust_cache.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'

def short_hash(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]

def stamp(match):
    attr, name = match.group(1), match.group(2)
    asset = ROOT / name
    if not asset.is_file():
        return match.group(0)
    return f'{attr}="{name}?v={short_hash(asset)}"'

html = INDEX.read_text()
new = re.sub(r'(href|src)="([\w./-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"', stamp, html)
if new != html:
    INDEX.write_text(new)
    print('index.html: asset versions updated')
else:
    print('index.html: already up to date')
