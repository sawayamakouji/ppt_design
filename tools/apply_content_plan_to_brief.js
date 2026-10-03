#!/usr/bin/env node
const fs=require('fs');
const briefPath=process.argv[2], planPath=process.argv[3], output=process.argv[4]||'/mnt/data/brief.enriched.v1.json';
if(!briefPath||!planPath){console.error('usage: node apply_content_plan_to_brief.js brief.json content-plan.json [output.json]');process.exit(2)}
const brief=JSON.parse(fs.readFileSync(briefPath,'utf8'));const plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
if(brief.profile!=='BRIEF-v1')throw new Error('brief profile must be BRIEF-v1');
if(plan.profile!=='CONTENT-PLAN-v1')throw new Error('content plan profile must be CONTENT-PLAN-v1');
const patch=plan.briefPatch||{};
const out={...brief,...patch,content:{...(brief.content||{}),...(patch.content||{})},contentPlan:{profile:plan.profile,slides:plan.slides.map(s=>({id:s.id,role:s.role,status:s.status,primaryMessage:s.primaryMessage,sourceRefs:s.sourceRefs,visual:s.visual}))}};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
