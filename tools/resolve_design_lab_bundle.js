#!/usr/bin/env node
const fs=require('fs');
const input=process.argv[2];
const output=process.argv[3] || '/mnt/data/resolved-scene-deck.json';
if(!input){console.error('usage: node resolve_design_lab_bundle.js design-lab-bundle.json [scene-deck.json]');process.exit(2)}
const b=JSON.parse(fs.readFileSync(input,'utf8'));
if(b.profile!=='DESIGN-LAB-BUNDLE-v2') throw new Error('profile must be DESIGN-LAB-BUNDLE-v2');
if(!Array.isArray(b.slideOrder)||!b.slideOrder.length) throw new Error('slideOrder[] required');
if(!b.variants||!b.selections) throw new Error('variants and selections required');
const slides=b.slideOrder.map(id=>{
  const v=b.selections[id];
  if(!v) throw new Error(`slide ${id}: selection missing`);
  const variant=b.variants[v];
  if(!variant) throw new Error(`slide ${id}: unknown variant ${v}`);
  const s=(variant.slides||{})[id];
  if(!s) throw new Error(`slide ${id}: variant ${v} has no scene`);
  return {...s,id,meta:{...(s.meta||{}),selectedVariant:v}};
});
const out={version:'1.0',profile:'SCENE-DECK-v1',deck:b.deck||{},themes:b.themes||{},slides};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
