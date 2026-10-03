#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const input=process.argv[2],output=process.argv[3]||'/mnt/data/design-lab.directed.v2.json',workdir=process.argv[4]||path.dirname(output);
if(!input){console.error('usage: node resolve_directed_presentation_plan_to_design_lab_v2.js directed-plan.json [bundle.json] [workdir]');process.exit(2)}
fs.mkdirSync(workdir,{recursive:true});
const plan=JSON.parse(fs.readFileSync(input,'utf8'));
if(plan.profile!=='PRESENTATION-PLAN-v1')throw new Error('profile must be PRESENTATION-PLAN-v1');
const run=(args)=>{const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());return(r.stdout||'').trim()};
const baseResolver=path.resolve(__dirname,'resolve_presentation_plan_to_design_lab.js');
const patternResolver=path.resolve(__dirname,'resolve_pattern_deck_to_scene.js');
const baseBundle=path.join(workdir,'design-lab.base.v2.json');
run([baseResolver,input,baseBundle,workdir]);
const bundle=JSON.parse(fs.readFileSync(baseBundle,'utf8'));
for(const d of ['A','B','C']){
  const pfile=path.join(workdir,`pattern-deck.presentation.${d}.json`);
  if(!fs.existsSync(pfile))continue;
  const pd=JSON.parse(fs.readFileSync(pfile,'utf8'));
  pd.slides=pd.slides.map(s=>{
    const src=plan.slides.find(x=>x.id===s.id),dd=src?.deckDirection||{};
    const pattern=dd.patterns?.[d]||dd.variants?.[d]?.pattern;
    const composition=dd.composition?.[d]||dd.variants?.[d]?.composition;
    const density=dd.density?.[d]||dd.variants?.[d]?.density;
    return {...s,...(pattern?{pattern}:{}),...(composition?{composition}:{}),...(density?{density}:{}),notes:`${s.notes||''}\ndeckDirector=${plan.deckDirector?.profile||''}\nenergy=${dd.energy||''}\nvisualMode=${dd.visualMode||''}\ntransition=${dd.transitionIn||''}\ncontinuity=${dd.continuity?.in||''}`};
  });
  fs.writeFileSync(pfile,JSON.stringify(pd,null,2),'utf8');
  const sfile=path.join(workdir,`scene-deck.presentation.${d}.json`);
  run([patternResolver,pfile,sfile]);
  const sd=JSON.parse(fs.readFileSync(sfile,'utf8'));
  bundle.variants[d].slides=Object.fromEntries(sd.slides.map(s=>[s.id,s]));
  bundle.variants[d].patternDeck=pfile;
}
bundle.deck.deckDirector={profile:plan.deckDirector?.profile||'DECK-DIRECTOR-v2',quality:plan.deckDirector?.quality||{},issues:plan.deckDirector?.issues||[],energyCurve:plan.deckDirector?.energyCurve||[],transitions:plan.deckDirector?.transitions||[]};
bundle.recommendations={defaultDirection:'A',reason:'Executive Rhythm: deck-level peaks, transitions, composition and pattern choice are coordinated by Deck Director v2'};
fs.writeFileSync(output,JSON.stringify(bundle,null,2),'utf8');console.log(output);
