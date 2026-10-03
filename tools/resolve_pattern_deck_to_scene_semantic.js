#!/usr/bin/env node
const fs=require('fs');
const os=require('os');
const path=require('path');
const cp=require('child_process');

const input=process.argv[2];
const output=process.argv[3]||'/mnt/data/scene-deck.from-pattern.semantic.json';
if(!input){console.error('usage: node resolve_pattern_deck_to_scene_semantic.js pattern-deck.json [scene-deck.json]');process.exit(2)}
const req=JSON.parse(fs.readFileSync(input,'utf8'));
const baseResolver=path.resolve(__dirname,'resolve_pattern_deck_to_scene.js');
const tmp=path.join(os.tmpdir(),`scene-${process.pid}-${Date.now()}.json`);
const r=cp.spawnSync(process.execPath,[baseResolver,input,tmp],{encoding:'utf8'});
if(r.status!==0)throw new Error((r.stderr||r.stdout||'base pattern resolver failed').trim());
const scene=JSON.parse(fs.readFileSync(tmp,'utf8'));
try{fs.unlinkSync(tmp)}catch{}
const reqById=new Map((req.slides||[]).map(s=>[s.id,s]));
for(const slide of scene.slides||[]){
  const src=reqById.get(slide.id);if(!src)continue;
  const m=String(src.pattern||'').toUpperCase().match(/^(ED06)(?:-([A-Z]))?$/);if(!m)continue;
  const variant=m[2]||'A';const c=src.content||{};
  const objs=variant==='B'?[c.problem,c.cause,c.solution]:variant==='C'?[c.pain,c.idea,c.value]:[c.problem,c.solution];
  objs.forEach((obj,i)=>{if(!obj||typeof obj!=='object'||!obj.label)return;const el=(slide.elements||[]).find(e=>e.id===`lab${i}`);if(el)el.text=String(obj.label)});
}
fs.writeFileSync(output,JSON.stringify(scene,null,2),'utf8');
console.log(output);
