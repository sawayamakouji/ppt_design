#!/usr/bin/env node
const fs=require('fs');
const briefPath=process.argv[2], driverPath=process.argv[3], output=process.argv[4]||'/mnt/data/brief.with-drivers.v1.json';
if(!briefPath||!driverPath){console.error('usage: node apply_driver_bundle_to_brief.js brief.json driver.json [output.json]');process.exit(2)}
const b=JSON.parse(fs.readFileSync(briefPath,'utf8')),d=JSON.parse(fs.readFileSync(driverPath,'utf8'));
if(b.profile!=='BRIEF-v1'||d.profile!=='DRIVER-BUNDLE-v1')throw new Error('invalid profile');
const patch=d.briefPatch||{};const out={...b,...patch,content:{...(b.content||{}),...(patch.content||{})},driverExplorer:{profile:d.profile,target:d.target,topDrivers:(d.drivers||[]).slice(0,8).map(x=>({id:x.id,type:x.type,title:x.title,message:x.message,score:x.score,confidence:x.confidence,causalStatus:x.causalStatus,sourceRefs:x.sourceRefs,warnings:x.warnings}))}};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
