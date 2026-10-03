#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),gen=path.join(root,'generated');fs.mkdirSync(gen,{recursive:true});
const source=path.join(gen,'qa-driver-source.v1.json'),insight=path.join(gen,'qa-insight-bundle.v1.json'),out=path.join(gen,'qa-driver-bundle.v1.json');
function run(args){const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return(r.stdout||'').trim()}
run([path.join(root,'samples','generate_driver_explorer_sample.js'),source]);
run([path.join(root,'tools','analyze_insights.js'),source,insight]);
run([path.join(root,'tools','analyze_drivers.js'),source,insight,path.join(root,'samples','brief.driver-explorer.sample.v1.json'),out]);
const b=JSON.parse(fs.readFileSync(out,'utf8'));const types=new Set(b.drivers.map(x=>x.type));
for(const t of ['hierarchical_contribution','change_concentration','segment_gap','delta_association'])if(!types.has(t))throw new Error(`missing ${t}`);
if(!b.drivers.every(x=>x.causalStatus))throw new Error('missing causalStatus');
if(b.drivers.some(x=>x.type.includes('association')&&!x.warnings.some(w=>/caus/i.test(w))))throw new Error('association warning missing');
const top=b.drivers.find(x=>x.type==='hierarchical_contribution');if(!top||!top.path?.length)throw new Error('hierarchical path missing');
console.log(JSON.stringify({status:'PASS',target:b.target.metric,driverCount:b.drivers.length,types:[...types],top:top.message},null,2));
