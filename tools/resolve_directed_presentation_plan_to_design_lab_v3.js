#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const input=process.argv[2],output=process.argv[3]||'/mnt/data/design-lab.directed.v3.json',workdir=process.argv[4]||path.dirname(output);
if(!input){console.error('usage: node resolve_directed_presentation_plan_to_design_lab_v3.js directed-plan.json [bundle.json] [workdir]');process.exit(2)}
fs.mkdirSync(workdir,{recursive:true});
const plan=JSON.parse(fs.readFileSync(input,'utf8'));
if(plan.profile!=='PRESENTATION-PLAN-v1')throw new Error('profile must be PRESENTATION-PLAN-v1');
const prepared={...plan,slides:plan.slides.map(s=>{const headline=s.deckDirection?.headline||s.claim;return {...s,claim:headline,payload:{...(s.payload||{}),title:headline}}})};
const tmp=path.join(workdir,'.directed-v3.prepared.json');fs.writeFileSync(tmp,JSON.stringify(prepared,null,2),'utf8');
const tool=path.resolve(__dirname,'resolve_directed_presentation_plan_to_design_lab_v2.js');
const r=cp.spawnSync(process.execPath,[tool,tmp,output,workdir],{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());
const bundle=JSON.parse(fs.readFileSync(output,'utf8'));bundle.deck.deckDirector={...(bundle.deck.deckDirector||{}),profile:'DECK-DIRECTOR-v3',arc:plan.deckDirector?.arc,originalOrder:plan.deckDirector?.originalOrder,finalOrder:plan.deckDirector?.finalOrder,titleSequence:plan.deckDirector?.titleSequence,quality:plan.deckDirector?.quality};
fs.writeFileSync(output,JSON.stringify(bundle,null,2),'utf8');try{fs.unlinkSync(tmp)}catch{};console.log(output);
