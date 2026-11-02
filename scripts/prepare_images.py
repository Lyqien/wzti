"""Generate transparent web delivery assets; original PNGs remain unchanged."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
original=optimized=0
for source in (root/'Images'/'Outputs_Images').glob('*.png'):
    with Image.open(source) as image:
        image=image.convert('RGBA')
        image.thumbnail((768,512),Image.Resampling.LANCZOS)
        target=source.with_suffix('.webp')
        image.save(target,'WEBP',quality=85,method=6)
        original+=source.stat().st_size
        optimized+=target.stat().st_size
print(f'PNG {original:,} bytes -> WebP {optimized:,} bytes ({(1-optimized/original)*100:.1f}% smaller)',flush=True)
logo=root/'Images'/'Outputs_Images'/'WZTI-logo.webp'
print(f'Logo: {logo.stat().st_size:,} bytes',flush=True)
