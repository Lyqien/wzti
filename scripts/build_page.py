"""Build a ready-to-use page with no critical network dependencies."""
from pathlib import Path
import json,base64,re
root=Path(__file__).resolve().parents[1]
config=json.loads((root/'runtime-config.json').read_bytes())
for kind in ['icon','logo']:
    source=root/config['brand'][kind]
    config['brand'][kind+'DataURI']='data:image/webp;base64,'+base64.b64encode(source.with_suffix('.webp').read_bytes()).decode('ascii')
html=(root/'index.template.html').read_text(encoding='utf-8-sig')
css=(root/'style.css').read_text(encoding='utf-8-sig')
html=re.sub(r'<link rel="stylesheet"[^>]*>',lambda m:'<style>body{visibility:hidden}</style><style>'+css+'</style>',html)
html=re.sub(r'<script src="(?:match|app)\.js[^>]*></script>','',html)
html=html.replace('src="Images/Outputs_Images/WZTI-logo.webp"','data-brand-logo=""')
data=json.dumps(config,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
code=(root/'match.js').read_text(encoding='utf-8-sig')+'\n'+(root/'app.js').read_text(encoding='utf-8-sig')
html=html.replace('</body>','<script>globalThis.WZTI_CONFIG='+data+';</script><script>'+code+'</script></body>')
(root/'index.html').write_text(html,encoding='utf-8')
print('Self-contained page:',len(html.encode('utf-8')),'bytes; icon and quiz embedded',flush=True)
