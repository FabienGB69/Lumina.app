#!/usr/bin/env python3
"""
Run after placing icon.png and notification-icon.png in assets/images/.

  python3 scripts/resize-icons.py

Requires Pillow:  pip install Pillow
"""
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).parent.parent / "assets" / "images"

def resize(src: Path, dst: Path, size: tuple[int, int]):
    img = Image.open(src).convert("RGBA")
    img = img.resize(size, Image.LANCZOS)
    img.save(dst, "PNG", optimize=True)
    print(f"  {dst.name}  {size[0]}×{size[1]}")

# App icon → all required sizes
icon_src = ASSETS / "icon.png"
if icon_src.exists():
    print("App icon:")
    resize(icon_src, ASSETS / "icon.png", (1024, 1024))
    resize(icon_src, ASSETS / "adaptive-icon.png", (1024, 1024))
    resize(icon_src, ASSETS / "favicon.png", (48, 48))
    resize(icon_src, ASSETS / "splash-icon.png", (200, 200))

# Notification icon → sizes
notif_src = ASSETS / "notification-icon.png"
if notif_src.exists():
    print("Notification icon:")
    resize(notif_src, ASSETS / "notification-icon.png", (1024, 1024))
    resize(notif_src, ASSETS / "notification-icon-small.png", (96, 96))

print("Done.")
