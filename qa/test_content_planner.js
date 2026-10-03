#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const root=path.resolve(__dirname,'..');const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'content-planner-'));
const out=path.join(tmp,'plan.json');
const r=cp.spawnSync(process.execPath,[path.join(root,'tools/plan_content.js'),path.join(root,'samples/brief.content-planner.sample.v1.json'),path.join(root,'samples/source-bundle.retail.sample.v1.json'),out],{encoding:'utf8'});
if(r.status!==0)throw new Error(r.stderr||r.stdout);
const p=JSON.parse(fs.readFileSync(out,'utf8'));
const kpi=p.slides.find(s=>s.role==='kpi'), data=p.slides.find(s=>s.role==='data'), action=p.slides.find(s=>s.role==='action');
if(!kpi||kpi.status!=='grounded'||kpi.evidence.length<3)throw new Error('kpi slide not grounded');
if(!data||data.status!=='grounded'||!data.visual?.supported)throw new Error('data slide not grounded with supported visual');
if(!action||action.status!=='structural')throw new Error('action must stay structural');
for(const s of p.slides.filter(s=>s.status==='grounded')) if(!s.sourceRefs.length) throw new Error(`grounded slide ${s.id} missing source refs`);
console.log('PASS content planner:',p.slides.map(s=>`${s.role}:${s.status}:${s.visual.type}`).join(' | '));
