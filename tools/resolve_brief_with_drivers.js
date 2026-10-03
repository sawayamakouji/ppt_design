#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const brief=process.argv[2],source=process.argv[3],outdir=process.argv[4]||'/mnt/data/brief-with-drivers';
if(!brief||!source){console.error('usage: node resolve_brief_with_drivers.js brief.json source-bundle.json [outdir]');process.exit(2)}
fs.mkdirSync(outdir,{recursive:true});const tool=n=>path.resolve(__dirname,n);const run=(args)=>{const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());return(r.stdout||'').trim()};
const insight=path.join(outdir,'insight-bundle.v1.json'),driver=path.join(outdir,'driver-bundle.v1.json'),source2=path.join(outdir,'source-bundle.with-drivers.v1.json'),brief2=path.join(outdir,'brief.with-drivers.v1.json');
run([tool('analyze_insights.js'),source,insight]);run([tool('analyze_drivers.js'),source,insight,brief,driver]);run([tool('enrich_source_bundle_with_drivers.js'),source,driver,source2]);run([tool('apply_driver_bundle_to_brief.js'),brief,driver,brief2]);
const downstream=tool('resolve_brief_with_sources.js');if(!fs.existsSync(downstream))throw new Error('resolve_brief_with_sources.js required');const r=cp.spawnSync(process.execPath,[downstream,brief2,source2,outdir],{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'downstream failed').trim());
console.log(JSON.stringify({insightBundle:insight,driverBundle:driver,enrichedSource:source2,briefWithDrivers:brief2,downstream:JSON.parse(r.stdout)},null,2));
