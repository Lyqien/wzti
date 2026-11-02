"""Build delivery images and embedded previews, retaining original source files."""
from pathlib import Path
from PIL import Image
import base64,io,json
root=Path(__file__).resolve().parents[1]
backup=root/'Images'/'Backup';backup.mkdir(parents=True,exist_ok=True)
config=json.loads((root/'config.json').read_bytes());previews={}
original=optimized=0
for source in (root/'Images'/'Outputs_Images').glob('*.png'):
    relative=source.relative_to(root).as_posix()
    with Image.open(source) as original_image:
        original_image=original_image.convert('RGBA')
        image=original_image.copy();image.thumbnail((768,512),Image.Resampling.LANCZOS)
        target=source.with_suffix('.webp')
        if not target.exists():image.save(target,'WEBP',quality=85,method=4)
        safety=backup/source.name
        if not safety.exists():
            safe=original_image.copy();safe.thumbnail((512,342),Image.Resampling.LANCZOS);safe.save(safety,'PNG',optimize=True)
        small=original_image.copy();small.thumbnail((64,64),Image.Resampling.LANCZOS)
        out=io.BytesIO();small.save(out,'WEBP',quality=20,method=4)
        previews[relative]='data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode('ascii')
        original+=source.stat().st_size;optimized+=target.stat().st_size
config['imagePreviews']=previews
(root/'runtime-config.json').write_text(json.dumps(config,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# Use the supplied icon without changing its design.
with Image.open(root/'Images'/'Outputs_Images'/'WZTI-icon.png') as icon:
    icon=icon.convert('RGBA');icon.resize((32,32),Image.Resampling.LANCZOS).save(root/'icon-32.png')
print(f'{len(previews)} embedded previews; PNG {original:,} -> WebP {optimized:,} bytes',flush=True)
print('Runtime config bytes:',(root/'runtime-config.json').stat().st_size,flush=True)
