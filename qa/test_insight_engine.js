#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'insight-engine-'));
function run(args){const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());return r.stdout.trim()}
const source=path.join(root,'samples/source-bundle.insight.sample.v1.json'),out=path.join(tmp,'insights.json');run([path.join(root,'tools/analyze_insights.js'),source,out]);const b=JSON.parse(fs.readFileSync(out,'utf8'));const types=new Set(b.insights.map(x=>x.type));
for(const t of ['period_delta','trend','change_point','anomaly','ranking','concentration','contribution','correlation','segment_gap'])if(!types.has(t))throw new Error(`missing insight type: ${t}`);
if(!b.insights.every(x=>Array.isArray(x.sourceRefs)&&x.sourceRefs.length))throw new Error('sourceRefs missing');
const corr=b.insights.find(x=>x.type==='correlation');if(!corr.warnings.some(w=>/causation|因果/i.test(w)))throw new Error('correlation causal guardrail missing');
if(!b.sourceSummary.sample)throw new Error('sample flag must be retained');
console.log(`PASS ${b.insights.length} insights / types=${[...types].join(',')}`);
