#!/usr/bin/env node
const fs=require('fs'),cp=require('child_process'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),input=process.argv[2];
if(!input){console.error('usage: node qa/test_deck_director_v2.js presentation-plan.json');process.exit(2)}
const out=path.join('/tmp','presentation-plan.directed.v2.json');
const r=cp.spawnSync(process.execPath,[path.join(root,'tools/direct_deck_v2.js'),input,out],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
const p=JSON.parse(fs.readFileSync(out,'utf8'));
assert.equal(p.deckDirector.profile,'DECK-DIRECTOR-v2');
assert.equal(p.slides[0].deckDirection.energy,'PEAK');
assert.equal(p.slides[1].deckDirection.energy,'ANCHOR');
assert.equal(p.slides.at(-1).storyStep==='action',p.deckDirector.quality.hasActionClose);
assert.equal(p.deckDirector.quality.transitionCoverage,true);
assert.equal(p.deckDirector.quality.blockingIssueCount,0);
assert.equal(p.slides[2].deckDirection.transitionIn,'DRILL');
assert.notEqual(p.slides[3].deckDirection.variants.A.visualShape,p.slides[4].deckDirection.variants.A.visualShape);
console.log('Deck Director v2 QA PASS');
