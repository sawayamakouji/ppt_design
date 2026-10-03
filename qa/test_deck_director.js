#!/usr/bin/env node
const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),assert=require('assert');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'deck-director-'));
const input=path.join(dir,'plan.json'),output=path.join(dir,'directed.json');
const plan={version:'1.0',profile:'PRESENTATION-PLAN-v1',deck:{title:'Deck Director QA'},slides:[
{id:'s1',storyStep:'opening',question:'何が起きた？',claim:'変化が起きた',payload:{}},
{id:'s2',storyStep:'kpi',question:'どの数字を見る？',claim:'重要指標を確認',payload:{}},
{id:'s3',storyStep:'hierarchy',question:'どこで起きた？',claim:'重点領域へ絞る',payload:{}},
{id:'s4',storyStep:'breakdown',question:'何が構成する？',claim:'寄与を分解する',payload:{}},
{id:'s5',storyStep:'association',question:'何と一緒に動く？',claim:'関連指標を確認',payload:{}},
{id:'s6',storyStep:'action',question:'次に何をする？',claim:'次の行動を決める',payload:{}}
]};
fs.writeFileSync(input,JSON.stringify(plan),'utf8');
const tool=path.resolve(__dirname,'../tools/direct_deck.js');
const r=cp.spawnSync(process.execPath,[tool,input,output],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
const out=JSON.parse(fs.readFileSync(output,'utf8'));
assert.equal(out.deckDirector.profile,'DECK-DIRECTOR-v1');
assert.equal(out.deckDirector.quality.repeatedQuestionCount,0);
assert.equal(out.deckDirector.quality.repeatedClaimCount,0);
assert.equal(out.deckDirector.quality.hasActionClose,true);
assert.deepEqual(out.slides.map(s=>s.deckDirection.energy),['PEAK','PEAK','BRIDGE','EVIDENCE','CALM','PEAK']);
assert.equal(out.slides[3].deckDirection.patterns.A,'ED08-D');
console.log('Deck Director QA PASS');
