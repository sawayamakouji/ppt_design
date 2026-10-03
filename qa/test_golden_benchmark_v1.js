#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=process.argv[2]||path.resolve(__dirname,'../benchmarks/golden-v1');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.v1.json'),'utf8'));
const rubric=JSON.parse(fs.readFileSync(path.join(root,'evaluation-rubric.v1.json'),'utf8'));
const errors=[]; let slides=0; const families=new Set(), types=new Set(), themes=new Set();
if(manifest.profile!=='GOLDEN-BENCHMARK-SUITE-v1')errors.push('manifest profile mismatch');
if(manifest.decks.length!==10)errors.push(`deckCount=${manifest.decks.length}`);
for(const m of manifest.decks){
  const f=path.join(root,'decks',`${m.id}.json`); if(!fs.existsSync(f)){errors.push(`missing ${m.id}.json`);continue;}
  const d=JSON.parse(fs.readFileSync(f,'utf8')); types.add(d.type); themes.add(d.theme);
  if(d.privacy!=='synthetic/anonymized')errors.push(`${m.id}: not public-safe`);
  if(d.golden?.status!=='candidate-golden'&&d.golden?.status!=='golden')errors.push(`${m.id}: bad golden status`);
  const pd=d.golden?.patternDeck; if(!pd||pd.profile!=='PATTERN-DECK-v1'){errors.push(`${m.id}: pattern deck missing`);continue;}
  if(pd.slides.length!==d.targetSlides)errors.push(`${m.id}: targetSlides mismatch`);
  slides+=pd.slides.length;
  for(const s of pd.slides){const fam=s.pattern.split('-')[0];families.add(fam);if(!/^ED\d{2}-[A-Z]$/.test(s.pattern))errors.push(`${m.id}: invalid ${s.pattern}`);}
}
if(slides!==manifest.slideCount)errors.push(`slides ${slides} != ${manifest.slideCount}`);
if(types.size<8)errors.push(`type diversity too low: ${types.size}`);
if(themes.size<6)errors.push(`theme diversity too low: ${themes.size}`);
if(families.size<12)errors.push(`pattern family coverage too low: ${families.size}`);
const weight=(rubric.criteria||[]).reduce((a,x)=>a+Number(x.weight||0),0);if(weight!==100)errors.push(`rubric weight=${weight}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`PASS: 10 decks / ${slides} slides / ${types.size} deck types / ${themes.size} themes / ${families.size} ED families`);
