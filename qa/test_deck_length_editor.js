#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const input=path.join(root,'samples','presentation-plan.length-editor.sample.v1.json');
const out=path.join(root,'generated','demo','presentation-plan.length-edited.v1.json');
const r=cp.spawnSync(process.execPath,[path.join(root,'tools','edit_deck_length.js'),input,out],{encoding:'utf8'});
if(r.status!==0)throw new Error(r.stderr||r.stdout);
const p=JSON.parse(fs.readFileSync(out,'utf8'));
assert.equal(p.deckLengthEditor.beforeCount,8);
assert.equal(p.deckLengthEditor.afterCount,7);
assert(p.deckLengthEditor.operations.some(x=>x.type==='MERGE'));
assert(p.deckLengthEditor.operations.some(x=>x.type==='SPLIT'));
assert(p.deckLengthEditor.operations.some(x=>x.type==='DROP'));
assert.equal(p.slides[0].storyStep,'opening');
assert.equal(p.slides.at(-1).storyStep,'action');
assert.equal(p.deckLengthEditor.policy.evidenceInvented,false);
console.log('PASS deck-length-editor-v1');
