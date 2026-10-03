#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const input=process.argv[2];
const output=process.argv[3]||'/mnt/data/presentation-plan.length-directed.v1.json';
if(!input){console.error('usage: node edit_length_then_direct_v3.js presentation-plan.json [output.json]');process.exit(2)}
const workdir=path.dirname(output);fs.mkdirSync(workdir,{recursive:true});
const lenOut=path.join(workdir,'.length-edited.tmp.json');
function run(file,args){const r=cp.spawnSync(process.execPath,[file,...args],{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());return (r.stdout||'').trim();}
run(path.resolve(__dirname,'edit_deck_length.js'),[input,lenOut]);
run(path.resolve(__dirname,'direct_deck_v3.js'),[lenOut,output]);
const p=JSON.parse(fs.readFileSync(output,'utf8'));
p.deckLengthEditor=p.deckLengthEditor||JSON.parse(fs.readFileSync(lenOut,'utf8')).deckLengthEditor;
p.deckPipeline={...(p.deckPipeline||{}),order:['presentation_editor','deck_length_editor','deck_director_v3']};
fs.writeFileSync(output,JSON.stringify(p,null,2),'utf8');
try{fs.unlinkSync(lenOut);}catch{}
console.log(output);
