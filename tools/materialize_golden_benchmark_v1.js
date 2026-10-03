#!/usr/bin/env node
const fs=require('fs'), path=require('path');
const root=process.argv[2]||path.resolve(__dirname,'../benchmarks/golden-v1');
const out=process.argv[3]||path.join(root,'materialized-pattern-decks');
fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.v1.json'),'utf8'));
for(const d of manifest.decks){
  const spec=JSON.parse(fs.readFileSync(path.join(root,'decks',`${d.id}.json`),'utf8'));
  const pd=spec.golden?.patternDeck;
  if(!pd||pd.profile!=='PATTERN-DECK-v1') throw new Error(`${d.id}: golden.patternDeck missing`);
  fs.writeFileSync(path.join(out,`${d.id}.pattern-deck.json`),JSON.stringify(pd,null,2),'utf8');
}
console.log(`materialized ${manifest.decks.length} pattern decks -> ${out}`);
