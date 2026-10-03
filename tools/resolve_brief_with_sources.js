#!/usr/bin/env node
const fs=require('fs');const path=require('path');const cp=require('child_process');
const brief=process.argv[2], sources=process.argv[3], outdir=process.argv[4]||'/mnt/data/brief-with-sources';
if(!brief||!sources){console.error('usage: node resolve_brief_with_sources.js brief.json source-bundle.json [outdir]');process.exit(2)}
fs.mkdirSync(outdir,{recursive:true});
const tool=n=>path.resolve(__dirname,n);
function run(args){const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());return (r.stdout||'').trim()}
const plan=path.join(outdir,'content-plan.v1.json');
const enriched=path.join(outdir,'brief.enriched.v1.json');
const bundle=path.join(outdir,'design-lab.v2.json');
run([tool('plan_content.js'),brief,sources,plan]);
run([tool('apply_content_plan_to_brief.js'),brief,plan,enriched]);
run([tool('resolve_brief_to_design_lab.js'),enriched,bundle,outdir]);
console.log(JSON.stringify({contentPlan:plan,enrichedBrief:enriched,designLab:bundle},null,2));
