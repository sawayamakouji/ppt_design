#!/usr/bin/env node
const fs=require('fs');
const briefPath=process.argv[2], insightPath=process.argv[3], output=process.argv[4]||'/mnt/data/brief.with-insights.v1.json';
if(!briefPath||!insightPath){console.error('usage: node apply_insight_bundle_to_brief.js brief.json insight-bundle.json [output.json]');process.exit(2)}
const brief=JSON.parse(fs.readFileSync(briefPath,'utf8')), ib=JSON.parse(fs.readFileSync(insightPath,'utf8'));
if(brief.profile!=='BRIEF-v1')throw new Error('brief profile must be BRIEF-v1');if(ib.profile!=='INSIGHT-BUNDLE-v1')throw new Error('insight profile must be INSIGHT-BUNDLE-v1');
const patch=ib.briefPatch||{};const out={...brief,...patch,content:{...(brief.content||{}),...(patch.content||{})},insightContext:{profile:ib.profile,topInsightId:ib.recommendations?.topInsightId||null,insights:(ib.insights||[]).slice(0,10).map(x=>({id:x.id,type:x.type,title:x.title,message:x.message,score:x.score,confidence:x.confidence,sourceRefs:x.sourceRefs,warnings:x.warnings}))}};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
