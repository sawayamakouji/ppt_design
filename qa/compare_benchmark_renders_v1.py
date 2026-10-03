#!/usr/bin/env python3
import argparse, json, math
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

def image_metrics(a,b):
    ia=Image.open(a).convert('RGB'); ib=Image.open(b).convert('RGB')
    if ia.size!=ib.size:
        return {'same_size':False,'size_current':ia.size,'size_base':ib.size,'changed_ratio':1.0,'mae':255.0,'rmse':255.0}
    diff=ImageChops.difference(ia,ib)
    total=ia.size[0]*ia.size[1]
    mask=diff.point(lambda v: 255 if v else 0).convert('L')
    unchanged=mask.histogram()[0]
    stat=ImageStat.Stat(diff)
    hist=diff.histogram()
    sq=sum((i%256)**2*c for i,c in enumerate(hist))/(max(total,1)*3)
    return {'same_size':True,'changed_ratio':(total-unchanged)/max(total,1),'mae':sum(stat.mean)/3.0,'rmse':math.sqrt(sq)}

def files(root): return {p.relative_to(root).as_posix():p for p in Path(root).rglob('*.png')}

ap=argparse.ArgumentParser();ap.add_argument('current');ap.add_argument('base');ap.add_argument('--benchmark-root',required=True);ap.add_argument('--out',required=True);ap.add_argument('--golden-threshold',type=float,default=0.01);args=ap.parse_args()
cur,base=files(args.current),files(args.base);specroot=Path(args.benchmark_root)/'decks'
rows=[];blocking=[]
for rel in sorted(set(cur)|set(base)):
    deck=rel.split('/')[0] if '/' in rel else Path(rel).stem.split('-')[0]
    status='candidate-golden'
    spec=specroot/f'{deck}.json'
    if spec.exists():
        try: status=json.loads(spec.read_text(encoding='utf-8')).get('golden',{}).get('status',status)
        except Exception: pass
    if rel not in cur or rel not in base:
        m={'missing':True,'changed_ratio':1.0,'mae':255.0,'rmse':255.0}
    else:m=image_metrics(cur[rel],base[rel])
    row={'file':rel,'deck':deck,'goldenStatus':status,**m};rows.append(row)
    if status=='golden' and m.get('changed_ratio',1.0)>args.golden_threshold:blocking.append(row)
summary={'profile':'VISUAL-REGRESSION-v1','current':args.current,'base':args.base,'images':len(rows),'blocking':len(blocking),'threshold':args.golden_threshold,'rows':rows,'pass':not blocking}
out=Path(args.out);out.mkdir(parents=True,exist_ok=True);(out/'visual-diff.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
changed=[r for r in rows if r.get('changed_ratio',0)>0]
lines=['# Visual Regression Report','',f'- Result: **{"PASS" if summary["pass"] else "FAIL"}**',f'- Images compared: {len(rows)}',f'- Changed images: {len(changed)}',f'- Blocking golden regressions: {len(blocking)}',f'- Golden changed-pixel threshold: {args.golden_threshold:.2%}','','> `changed_ratio` is a regression signal, not a visual-quality percentage. Candidate-golden changes are reported but do not block CI.','','| Image | Golden status | Changed pixels | MAE |','|---|---|---:|---:|']
for r in sorted(changed,key=lambda x:x.get('changed_ratio',0),reverse=True)[:80]:lines.append(f'| {r["file"]} | {r["goldenStatus"]} | {r.get("changed_ratio",1):.2%} | {r.get("mae",255):.2f} |')
(out/'visual-diff.md').write_text('\n'.join(lines),encoding='utf-8')
print(f'{"PASS" if summary["pass"] else "FAIL"}: {len(rows)} images, {len(changed)} changed, {len(blocking)} blocking')
raise SystemExit(0 if summary['pass'] else 1)
