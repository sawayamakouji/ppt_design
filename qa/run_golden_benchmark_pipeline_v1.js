#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const repo=path.resolve(process.argv[2]||process.cwd());
const out=path.resolve(process.argv[3]||path.join(repo,'.artifacts/golden-v1'));
const benchmark=path.join(repo,'benchmarks/golden-v1');
const dirs={patterns:path.join(out,'pattern-decks'),scenes:path.join(out,'scenes'),html:path.join(out,'html'),pptx:path.join(out,'pptx'),qa:path.join(out,'qa')};
Object.values(dirs).forEach(d=>fs.mkdirSync(d,{recursive:true}));
function run(label,args,opts={}){const t=Date.now();const r=cp.spawnSync(args[0],args.slice(1),{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts});const ms=Date.now()-t;if(r.status!==0){const err=new Error(`${label} failed (${r.status})\n${r.stdout||''}\n${r.stderr||''}`);err.ms=ms;throw err;}return {ms,stdout:(r.stdout||'').trim(),stderr:(r.stderr||'').trim()};}
const manifest=JSON.parse(fs.readFileSync(path.join(benchmark,'manifest.v1.json'),'utf8'));
const typographyGuard=path.join(repo,'tools/apply_typography_density_guard.js');
const typographyValidator=path.join(repo,'qa/validate_typography_density_v1.js');
const typographyEnabled=fs.existsSync(typographyGuard)&&fs.existsSync(typographyValidator);
const readabilityGuard=path.join(repo,'tools/apply_readability_guard.js');
const readabilityValidator=path.join(repo,'qa/validate_readability_v1.js');
const readabilityEnabled=fs.existsSync(readabilityGuard)&&fs.existsSync(readabilityValidator);
const summary={profile:'GOLDEN-CI-RUN-v1',startedAt:new Date().toISOString(),repo,out,deckCount:manifest.decks.length,slideCount:manifest.slideCount,decks:[],errors:[]};
try{run('benchmark contract',['node',path.join(repo,'qa/test_golden_benchmark_v1.js'),benchmark]);run('materialize',['node',path.join(repo,'tools/materialize_golden_benchmark_v1.js'),benchmark,dirs.patterns]);}catch(e){console.error(e.message);process.exit(1)}
for(const d of manifest.decks){
  const row={id:d.id,title:d.title,status:'PASS',steps:{},warnings:0,typographyWarnings:0,fontFixes:0,readabilityWarnings:0,readabilityFixes:0};
  const pat=path.join(dirs.patterns,`${d.id}.pattern-deck.json`),rawScene=path.join(dirs.qa,`${d.id}.raw-scene.json`),typographyScene=path.join(dirs.qa,`${d.id}.typography-scene.json`),scene=path.join(dirs.scenes,`${d.id}.scene-deck.json`),html=path.join(dirs.html,`${d.id}.html`),pptx=path.join(dirs.pptx,`${d.id}.pptx`),qaj=path.join(dirs.qa,`${d.id}.scene-qa.json`),guardj=path.join(dirs.qa,`${d.id}.typography-guard.json`),typej=path.join(dirs.qa,`${d.id}.typography-density.json`),readguardj=path.join(dirs.qa,`${d.id}.readability-guard.json`),readj=path.join(dirs.qa,`${d.id}.readability.json`);
  try{
    row.steps.resolve=run(`${d.id} resolve`,['node',path.join(repo,'tools/resolve_pattern_deck_to_scene.js'),pat,rawScene]).ms;
    if(typographyEnabled){
      row.steps.typographyGuard=run(`${d.id} typography guard`,['node',typographyGuard,rawScene,typographyScene,guardj]).ms;
      const gr=JSON.parse(fs.readFileSync(guardj,'utf8'));row.fontFixes=gr.operations.length;row.typographyWarnings=gr.warnings.length;
    }else{fs.copyFileSync(rawScene,typographyScene);row.typographyMode='legacy-base';}
    if(readabilityEnabled){
      row.steps.readabilityGuard=run(`${d.id} readability guard`,['node',readabilityGuard,typographyScene,scene,readguardj]).ms;
      const rr=JSON.parse(fs.readFileSync(readguardj,'utf8'));row.readabilityFixes=rr.operations.length;row.readabilityWarnings=rr.warnings.length;
    }else{fs.copyFileSync(typographyScene,scene);row.readabilityMode='legacy-base';}
    row.steps.geometry=run(`${d.id} geometry`,['node',path.join(__dirname,'validate_scene_deck_v1.js'),scene,qaj]).ms;
    const qr=JSON.parse(fs.readFileSync(qaj,'utf8'));let warnings=qr.warnings.length;
    if(typographyEnabled){row.steps.typography=run(`${d.id} typography`,['node',typographyValidator,scene,typej]).ms;const tr=JSON.parse(fs.readFileSync(typej,'utf8'));warnings+=tr.warnings.length;row.minFontPt=tr.minFontPt;}else{row.minFontPt=qr.minFontPt;}
    if(readabilityEnabled){row.steps.readability=run(`${d.id} readability`,['node',readabilityValidator,scene,readj]).ms;const rr=JSON.parse(fs.readFileSync(readj,'utf8'));warnings+=rr.warnings.length;row.minContentPt=rr.minContentPt;}
    row.warnings=warnings;
    row.steps.html=run(`${d.id} html`,['node',path.join(repo,'tools/render_scene_deck_to_html.js'),scene,html]).ms;
    row.steps.pptx=run(`${d.id} pptx`,['node',path.join(repo,'tools/compile_scene_deck_to_ppt.js'),scene,pptx]).ms;
    const sd=JSON.parse(fs.readFileSync(scene,'utf8'));row.slides=sd.slides.length;
  }catch(e){row.status='FAIL';row.error=e.message;summary.errors.push({deck:d.id,error:e.message});}
  summary.decks.push(row);console.log(`${row.status} ${d.id} ${d.title}${row.warnings?` (${row.warnings} warnings)`:''}`);
}
summary.finishedAt=new Date().toISOString();summary.pass=summary.errors.length===0;fs.writeFileSync(path.join(out,'pipeline-report.json'),JSON.stringify(summary,null,2),'utf8');
const md=['# Golden Benchmark CI — render pipeline','',`- Result: **${summary.pass?'PASS':'FAIL'}**`,`- Decks: ${summary.decks.filter(x=>x.status==='PASS').length}/${summary.deckCount}`,`- Slides: ${summary.slideCount}`,'','| Deck | Status | Slides | 8.5pt fixes | Readability fixes | Min content | Warnings |','|---|---:|---:|---:|---:|---:|---:|',...summary.decks.map(x=>`| ${x.id} ${x.title} | ${x.status} | ${x.slides??'-'} | ${x.fontFixes??0} | ${x.readabilityFixes??0} | ${x.minContentPt??'-'} | ${x.warnings??0} |`)];if(summary.errors.length)md.push('','## Errors','',...summary.errors.map(e=>`- **${e.deck}**: ${String(e.error).split('\n')[0]}`));fs.writeFileSync(path.join(out,'pipeline-report.md'),md.join('\n'),'utf8');
if(!summary.pass) process.exit(1);
