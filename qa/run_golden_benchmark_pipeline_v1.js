#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const repo=path.resolve(process.argv[2]||process.cwd());
const out=path.resolve(process.argv[3]||path.join(repo,'.artifacts/golden-v1'));
const benchmark=path.join(repo,'benchmarks/golden-v1');
const dirs={patterns:path.join(out,'pattern-decks'),scenes:path.join(out,'scenes'),html:path.join(out,'html'),pptx:path.join(out,'pptx'),qa:path.join(out,'qa')};
Object.values(dirs).forEach(d=>fs.mkdirSync(d,{recursive:true}));
function run(label,args,opts={}){const t=Date.now();const r=cp.spawnSync(args[0],args.slice(1),{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts});const ms=Date.now()-t;if(r.status!==0){const err=new Error(`${label} failed (${r.status})\n${r.stdout||''}\n${r.stderr||''}`);err.ms=ms;throw err;}return {ms,stdout:(r.stdout||'').trim(),stderr:(r.stderr||'').trim()};}
const manifest=JSON.parse(fs.readFileSync(path.join(benchmark,'manifest.v1.json'),'utf8'));
const summary={profile:'GOLDEN-CI-RUN-v1',startedAt:new Date().toISOString(),repo,out,deckCount:manifest.decks.length,slideCount:manifest.slideCount,decks:[],errors:[]};
try{run('benchmark contract',['node',path.join(repo,'qa/test_golden_benchmark_v1.js'),benchmark]);run('materialize',['node',path.join(repo,'tools/materialize_golden_benchmark_v1.js'),benchmark,dirs.patterns]);}catch(e){console.error(e.message);process.exit(1)}
for(const d of manifest.decks){
  const row={id:d.id,title:d.title,status:'PASS',steps:{},warnings:0};
  const pat=path.join(dirs.patterns,`${d.id}.pattern-deck.json`),scene=path.join(dirs.scenes,`${d.id}.scene-deck.json`),html=path.join(dirs.html,`${d.id}.html`),pptx=path.join(dirs.pptx,`${d.id}.pptx`),qaj=path.join(dirs.qa,`${d.id}.scene-qa.json`);
  try{
    row.steps.resolve=run(`${d.id} resolve`,['node',path.join(repo,'tools/resolve_pattern_deck_to_scene.js'),pat,scene]).ms;
    row.steps.geometry=run(`${d.id} geometry`,['node',path.join(__dirname,'validate_scene_deck_v1.js'),scene,qaj]).ms;
    const qr=JSON.parse(fs.readFileSync(qaj,'utf8'));row.warnings=qr.warnings.length;row.minFontPt=qr.minFontPt;
    row.steps.html=run(`${d.id} html`,['node',path.join(repo,'tools/render_scene_deck_to_html.js'),scene,html]).ms;
    row.steps.pptx=run(`${d.id} pptx`,['node',path.join(repo,'tools/compile_scene_deck_to_ppt.js'),scene,pptx]).ms;
    const sd=JSON.parse(fs.readFileSync(scene,'utf8'));row.slides=sd.slides.length;
  }catch(e){row.status='FAIL';row.error=e.message;summary.errors.push({deck:d.id,error:e.message});}
  summary.decks.push(row);console.log(`${row.status} ${d.id} ${d.title}${row.warnings?` (${row.warnings} warnings)`:''}`);
}
summary.finishedAt=new Date().toISOString();summary.pass=summary.errors.length===0;fs.writeFileSync(path.join(out,'pipeline-report.json'),JSON.stringify(summary,null,2),'utf8');
const md=['# Golden Benchmark CI — render pipeline','',`- Result: **${summary.pass?'PASS':'FAIL'}**`,`- Decks: ${summary.decks.filter(x=>x.status==='PASS').length}/${summary.deckCount}`,`- Slides: ${summary.slideCount}`,'','| Deck | Status | Slides | Warnings | Min font |','|---|---:|---:|---:|---:|',...summary.decks.map(x=>`| ${x.id} ${x.title} | ${x.status} | ${x.slides??'-'} | ${x.warnings??0} | ${x.minFontPt??'-'} |`)];if(summary.errors.length)md.push('','## Errors','',...summary.errors.map(e=>`- **${e.deck}**: ${String(e.error).split('\n')[0]}`));fs.writeFileSync(path.join(out,'pipeline-report.md'),md.join('\n'),'utf8');
if(!summary.pass) process.exit(1);
