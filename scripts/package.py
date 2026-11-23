"""Create a V3-only submission archive with a SHA256 manifest. No credentials are read."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import hashlib,json
R=Path(__file__).resolve().parents[1]
roots=['contracts','test','scripts','ui','deployment','audit','evidence','docs','reference','.github']
top=['README.md','package.json','package-lock.json','hardhat.config.js','.solcover.js','.env.example','.gitignore','.gitattributes']
files=[p for folder in roots if (R/folder).exists() for p in (R/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts and not p.name.startswith('~$')]
files += [R/n for n in top if (R/n).exists()]
files=sorted(set(files));rows=[{'path':p.relative_to(R).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files]
manifest=R/'package-manifest.json';manifest.write_text(json.dumps({'version':'V3','files':rows},indent=2),encoding='utf-8');files.append(manifest)
out=R/'submission';out.mkdir(exist_ok=True);target=out/'21317896_ZhangShihan_CSIT5760_FinalProject.zip'
with ZipFile(target,'w',ZIP_DEFLATED) as z:
 for p in files:z.write(p,'21317896_ZhangShihan_CSIT5760_FinalProject/'+p.relative_to(R).as_posix())
with ZipFile(target) as z:
 assert z.testzip() is None
 for row in rows:
  data=z.read('21317896_ZhangShihan_CSIT5760_FinalProject/'+row['path'])
  assert hashlib.sha256(data).hexdigest()==row['sha256']
print(json.dumps({'archive':str(target),'fileCount':len(files),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'crcAndManifest':'Pass'}))
