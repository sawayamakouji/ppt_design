#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert');
const root=path.resolve(__dirname,'..'),tmp=path.join(root,'generated','qa-causal');fs.rmSync(tmp,{recursive:true,force:true});fs.mkdirSync(tmp,{recursive:true});
const source=path.join(tmp,'source.json'),plan=path.join(tmp,'plan.json');
let r=cp.spawnSync(process.execPath,[path.join(root,'samples','generate_causal_test_sample.js'),source],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
r=cp.spawnSync(process.execPath,[path.join(root,'tools','plan_causal_test.js'),path.join(root,'samples','brief.causal-test.sample.v1.json'),source,plan],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);
const p=JSON.parse(fs.readFileSync(plan,'utf8'));
assert.equal(p.profile,'CAUSAL-TEST-PLAN-v1');
assert.equal(p.recommendation.primary.method,'difference_in_differences');
assert.equal(p.dataReadiness.nUnits,16);assert.equal(p.dataReadiness.nTreated,8);assert.equal(p.dataReadiness.nControl,8);assert.equal(p.dataReadiness.nPrePeriods,8);assert.equal(p.dataReadiness.nPostPeriods,8);
assert(p.effectPreview&&p.effectPreview.estimate<-.45,'expected negative exploratory DiD');
assert(p.dataReadiness.pretrend&&p.dataReadiness.pretrend.absSlopeDiff<.05,'pretrend should be close');
const maxSmd=Math.max(...p.dataReadiness.baselineBalance.map(x=>x.absSmd));assert(maxSmd<.25,'baseline balance should retain overlap');
assert(p.recommendation.secondary.some(x=>x.method==='event_study'));
assert(p.recommendation.secondary.some(x=>x.method==='aipw'));
assert(p.recommendation.rejected.some(x=>x.method==='simple_pre_post'));
console.log(JSON.stringify({status:'PASS',primary:p.recommendation.primary.label,effectPreview:p.effectPreview.estimate,ci95:p.effectPreview.ci95,pretrend:p.dataReadiness.pretrend.absSlopeDiff,maxSmd},null,2));
