#!/usr/bin/env node
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const repo=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const benchmark=path.join(repo,'benchmarks/golden-v1');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ppt-typography-'));
function run(args,ok=true){const r=cp.spawnSync(args[0],args.slice(1),{cwd:repo,encoding:'utf8'});if(ok&&r.status!==0)throw new Error(`${args.join(' ')}\n${r.stdout||''}\n${r.stderr||''}`);return r}
const manifest=JSON.parse(fs.readFileSync(path.join(benchmark,'manifest.v1.json'),'utf8'));
let slides=0,fixes=0,min=Infinity;
for(const m of manifest.decks){
  const spec=JSON.parse(fs.readFileSync(path.join(benchmark,'decks',`${m.id}.json`),'utf8'));
  const pat=path.join(tmp,`${m.id}.pattern.json`),raw=path.join(tmp,`${m.id}.raw.json`),guarded=path.join(tmp,`${m.id}.scene.json`),gr=path.join(tmp,`${m.id}.guard.json`),tr=path.join(tmp,`${m.id}.type.json`);
  fs.writeFileSync(pat,JSON.stringify(spec.golden.patternDeck));
  run(['node',path.join(repo,'tools/resolve_pattern_deck_to_scene.js'),pat,raw]);
  run(['node',path.join(repo,'tools/apply_typography_density_guard.js'),raw,guarded,gr]);
  run(['node',path.join(repo,'qa/validate_typography_density_v1.js'),guarded,tr]);
  const g=JSON.parse(fs.readFileSync(gr,'utf8')),t=JSON.parse(fs.readFileSync(tr,'utf8'));fixes+=g.operations.length;slides+=t.slides;min=Math.min(min,t.minFontPt);
}
if(slides!==manifest.slideCount)throw new Error(`slides ${slides} != ${manifest.slideCount}`);
if(min<8.5)throw new Error(`min font ${min} < 8.5`);
const bad={profile:'SCENE-DECK-v1',slides:[{id:'bad',elements:[{id:'body',type:'text',x:5,y:5,w:8,h:3,text:'過密な本文を小さな文字で無理に押し込まず、構成変更や分割を要求するための検証テキストです。'.repeat(5),style:{fontSize:7,lineHeight:1.15}}]}]};
const badIn=path.join(tmp,'bad.json'),badOut=path.join(tmp,'bad-out.json');fs.writeFileSync(badIn,JSON.stringify(bad));const br=run(['node',path.join(repo,'tools/apply_typography_density_guard.js'),badIn,badOut],false);if(br.status===0)throw new Error('overloaded fixture should be blocked');
console.log(`PASS: ${manifest.decks.length} decks / ${slides} slides / min ${min}pt / ${fixes} safe font-floor fixes; overload fixture blocked`);
