#!/usr/bin/env node
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert');
const base=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'deck-director-v3-'));
const mk=(id,storyStep,claim)=>({id,storyStep,question:`${id} question`,claim,payload:{title:claim},sourceRefs:['sample:evidence'],causalStatus:'descriptive'});
const plan={version:'1.0',profile:'PRESENTATION-PLAN-v1',deck:{title:'QA deck',objective:'analysis'},slides:[mk('s01','opening','変化が起きた'),mk('s02','kpi','4つの数字で押さえる'),mk('s04','breakdown','カテゴリで分解する'),mk('s05','association','関連はあるが因果未確認'),mk('s03','hierarchy','階層を掘る'),mk('s06','action','次の確認へ進む')]};
const input=path.join(dir,'input.json'),out=path.join(dir,'out.json');fs.writeFileSync(input,JSON.stringify(plan,null,2),'utf8');
const r=cp.spawnSync(process.execPath,[path.join(base,'tools/direct_deck_v3.js'),input,out],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
const p=JSON.parse(fs.readFileSync(out,'utf8'));const steps=p.slides.map(s=>s.storyStep);
assert.deepStrictEqual(steps,['opening','kpi','hierarchy','breakdown','association','action']);
assert.equal(p.deckDirector.quality.orderViolationCountAfter,0);assert.equal(p.deckDirector.quality.closingAction,true);
assert.ok(p.deckDirector.titleSequence[1].startsWith('まず、'));assert.ok(p.deckDirector.titleSequence[2].startsWith('次に、'));assert.ok(p.deckDirector.titleSequence[3].startsWith('その内訳では、'));assert.ok(p.deckDirector.titleSequence[4].startsWith('一方で、'));assert.ok(p.deckDirector.titleSequence[5].startsWith('だから、'));
fs.rmSync(dir,{recursive:true,force:true});console.log('Deck Director v3 QA: PASS');
