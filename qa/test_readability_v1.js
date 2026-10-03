#!/usr/bin/env node
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const repo=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ppt-readability-'));
const guard=path.join(repo,'tools/apply_readability_guard.js'),validator=path.join(repo,'qa/validate_readability_v1.js');
function run(args){return cp.spawnSync('node',args,{encoding:'utf8'})}
function write(name,slide){const f=path.join(tmp,name);fs.writeFileSync(f,JSON.stringify({profile:'SCENE-DECK-v1',slides:[slide]},null,2));return f}
const safe=write('safe.json',{id:'s1',elements:[{type:'text',x:10,y:30,w:25,h:8,text:'売変率前年差',style:{fontSize:10}}]});
const safeOut=path.join(tmp,'safe.out.json'),safeRep=path.join(tmp,'safe.report.json');let r=run([guard,safe,safeOut,safeRep]);if(r.status!==0)throw new Error(r.stderr||r.stdout);const out=JSON.parse(fs.readFileSync(safeOut,'utf8'));if(out.slides[0].elements[0].style.fontSize!==12)throw new Error('content label was not raised to 12pt');r=run([validator,safeOut]);if(r.status!==0)throw new Error('validator rejected safe output');
const overload=write('overload.json',{id:'s2',elements:[{type:'text',x:10,y:30,w:5,h:2,text:'非常に長い説明文を極端に小さな領域へ詰め込み、文字サイズだけで解決しようとしてはいけない',style:{fontSize:9}}]});r=run([guard,overload,path.join(tmp,'overload.out.json'),path.join(tmp,'overload.report.json')]);if(r.status===0)throw new Error('guard should block readability overload');
console.log('PASS: readability guard raises safe content labels and blocks overload');
