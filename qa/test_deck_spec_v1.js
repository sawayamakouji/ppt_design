#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const os=require('os');
const cp=require('child_process');

const root=path.resolve(__dirname,'..');
const sample=path.join(root,'samples/deck-spec.business-plan.sample.v1.json');
const compiler=path.join(root,'tools/deck_spec_compiler_v1.js');
function run(args){return cp.spawnSync(process.execPath,args,{encoding:'utf8',cwd:root});}
function assert(ok,msg){if(!ok)throw new Error(msg);}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ppt-design-deck-spec-'));
let pptAvailable=true;
try{require.resolve('pptxgenjs',{paths:[root]});}catch{pptAvailable=false;}
const args=[compiler,sample,'--out',tmp];
if(!pptAvailable)args.push('--no-pptx');
const r=run(args);
if(r.status!==0)throw new Error((r.stderr||r.stdout||'compiler failed').trim());
for(const f of ['deck-spec.resolved.json','final.scene.json','final.html','qa-report.json','readability-report.json','scene-qa-report.json']){
  assert(fs.existsSync(path.join(tmp,f)),`missing ${f}`);
}
if(pptAvailable)assert(fs.existsSync(path.join(tmp,'final.pptx')),'missing final.pptx');
const qa=JSON.parse(fs.readFileSync(path.join(tmp,'qa-report.json'),'utf8'));
assert(qa.profile==='DECK-BUILD-QA-v1','unexpected QA profile');
assert(qa.pass===true,'QA must pass');
assert(qa.slideCount>=6,'expected at least six slides');
assert(['A','B','C'].includes(qa.selectedDirection),'direction must be A/B/C');
assert(qa.geometry?.pass===true,'geometry must pass');
assert(qa.readability?.pass===true,'readability must pass');

const bad=JSON.parse(fs.readFileSync(sample,'utf8'));
bad.slides[1].primaryClaim='';
const badPath=path.join(tmp,'bad.json');
fs.writeFileSync(badPath,JSON.stringify(bad,null,2));
const badRun=run([compiler,badPath,'--out',path.join(tmp,'bad-out'),'--no-pptx','--no-html']);
assert(badRun.status!==0,'invalid DECK-SPEC should fail');

console.log(`PASS: DECK-SPEC-v1 compiler / ${qa.slideCount} slides / direction ${qa.selectedDirection} / pptx=${pptAvailable?'yes':'skipped'}`);
