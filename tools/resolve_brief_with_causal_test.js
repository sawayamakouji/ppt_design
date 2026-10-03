#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process');
const brief=process.argv[2],source=process.argv[3],outdir=process.argv[4]||'/mnt/data/causal-test-run';
if(!brief||!source){console.error('usage: node resolve_brief_with_causal_test.js brief.json source-bundle.json [outdir]');process.exit(2)}
fs.mkdirSync(outdir,{recursive:true});const tool=n=>path.resolve(__dirname,n);const run=(args)=>{const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'failed').trim());return(r.stdout||'').trim()};
const causal=path.join(outdir,'causal-test-plan.v1.json'),review=path.join(outdir,'causal-test-review.v1.html'),presentation=path.join(outdir,'presentation-plan.causal.v1.json'),lab=path.join(outdir,'design-lab.causal.v2.json'),labHtml=path.join(outdir,'design-lab.causal.v1.html');
run([tool('plan_causal_test.js'),brief,source,causal]);run([tool('build_causal_test_review_html.js'),causal,review]);run([tool('build_causal_presentation_plan.js'),brief,causal,presentation]);run([tool('resolve_presentation_plan_to_design_lab.js'),presentation,lab,outdir]);run([tool('build_design_lab_html.js'),lab,labHtml]);
console.log(JSON.stringify({causalTestPlan:causal,causalReview:review,presentationPlan:presentation,designLabBundle:lab,designLabHtml:labHtml},null,2));
