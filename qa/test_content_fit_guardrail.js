#!/usr/bin/env node
const fs=require('fs');
const os=require('os');
const path=require('path');
const cp=require('child_process');

const root=path.resolve(__dirname,'..');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'ppt-content-fit-'));
const run=(args)=>{const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'command failed').trim());return r.stdout};
run([
  path.join(root,'tools/resolve_brief_with_drivers.js'),
  path.join(root,'samples/brief.driver-explorer.sample.v1.json'),
  path.join(root,'samples/source-bundle.driver-explorer.sample.v1.json'),
  out
]);
const brief=JSON.parse(fs.readFileSync(path.join(out,'brief.enriched.v1.json'),'utf8'));
const source=JSON.parse(fs.readFileSync(path.join(out,'source-bundle.with-drivers.v1.json'),'utf8'));
const lab=JSON.parse(fs.readFileSync(path.join(out,'design-lab.v2.json'),'utf8'));
const metrics=brief.content?.metrics||[];
if(metrics.length<4)throw new Error(`expected >=4 KPI metrics, got ${metrics.length}`);
for(const m of metrics.slice(0,4)){
  const v=String(m.value??'');
  if(v.length>24||/[。！？]/.test(v))throw new Error(`prose leaked into KPI value: ${v}`);
}
const cats=brief.content?.chart?.categories||[];
if(cats.length<3)throw new Error('expected chart categories');
if(new Set(cats).size!==cats.length)throw new Error('duplicate time categories remain after aggregation');
const internal=(source.tables||[]).find(t=>t.id==='derived_driver_candidates');
if(!internal||internal.presentationEligible!==false)throw new Error('derived driver table must be presentationEligible=false');
const labels=(lab.variants?.A?.slides?.s04?.elements||[]).filter(e=>/^lab\d+$/.test(e.id)).map(e=>e.text);
for(const expected of ['OBSERVED','CONTRIBUTION','NEXT CHECK'])if(!labels.includes(expected))throw new Error(`missing semantic ED06 label: ${expected}`);
console.log(JSON.stringify({status:'PASS',metrics:metrics.slice(0,4).map(m=>m.value),categories:cats.length,diagnosticLabels:labels},null,2));
