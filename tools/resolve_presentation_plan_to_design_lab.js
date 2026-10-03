#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const input=process.argv[2];
const output=process.argv[3]||'/mnt/data/design-lab.presentation.v2.json';
const workdir=process.argv[4]||path.dirname(output);
if(!input){console.error('usage: node resolve_presentation_plan_to_design_lab.js presentation-plan.json [bundle.json] [workdir]');process.exit(2)}
fs.mkdirSync(workdir,{recursive:true});
const plan=JSON.parse(fs.readFileSync(input,'utf8'));
if(plan.profile!=='PRESENTATION-PLAN-v1')throw new Error('profile must be PRESENTATION-PLAN-v1');
const patternResolver=path.resolve(__dirname,'resolve_pattern_deck_to_scene.js');
const THEMES={
 TH01:{bg:'F3F0E7',ink:'111111',accent:'D2471D',signal:'F6B72B',paper:'FAF8F2',muted:'6C675E'},
 TH05:{bg:'EAF3F6',ink:'102A43',accent:'117A8B',signal:'54D4D9',paper:'F6FBFC',muted:'557187'},
 TH10:{bg:'FAFAF7',ink:'151515',accent:'315E9A',signal:'F2C84B',paper:'EEF2F6',muted:'68717C'}
};
const DIR={
 A:{label:'Executive Editorial',intent:'結論→根拠を最短で読む',theme:'TH01',composition:'CM02'},
 B:{label:'Data Journal',intent:'数値密度を上げつつ整然と読む',theme:'TH10',composition:'CM03'},
 C:{label:'Technical Blueprint',intent:'構造と検証手順を明示する',theme:'TH05',composition:'CM02'}
};
const patternBy={
 opening:{A:'ED01-D',B:'ED01-C',C:'ED01-A'},
 kpi:{A:'ED03-D',B:'ED08-F',C:'ED03-D'},
 hierarchy:{A:'ED07-A',B:'ED07-E',C:'ED07-F'},
 breakdown:{A:'ED08-D',B:'ED08-F',C:'ED08-G'},
 association:{A:'ED04-A',B:'ED04-D',C:'ED04-B'},
 action:{A:'ED11-B',B:'ED11-D',C:'ED11-A'},
 generic:{A:'ED02-A',B:'ED02-C',C:'ED02-B'}
};
const round=v=>Number.isFinite(Number(v))?Number(Number(v).toFixed(1)):v;
function content(slide,dir){
  const p=slide.payload||{};
  if(slide.storyStep==='opening')return{kicker:'EXECUTIVE SUMMARY',title:p.title||slide.claim,lead:p.lead||'',label:'TARGET',metric:p.metric||'',metricLabel:p.metricLabel||'',secondary:p.secondary||''};
  if(slide.storyStep==='kpi'){
    const ms=(p.metrics||[]).slice(0,4).map(m=>({value:m.value,label:m.label,note:m.note||''}));
    if(dir==='B')return{kicker:'KEY NUMBERS',title:p.title||slide.claim,items:ms.map(m=>({value:m.value,label:m.label}))};
    return{kicker:'KEY NUMBERS',title:p.title||slide.claim,metrics:ms};
  }
  if(slide.storyStep==='hierarchy'){
    const ss=(p.stages||[]).slice(0,4);
    if(dir==='B')return{kicker:'DRILL DOWN',title:slide.claim||p.title,stages:ss.map(x=>({role:x.role||x.title,step:x.step||x.text,output:x.output||''}))};
    if(dir==='C')return{kicker:'DRILL DOWN',title:slide.claim||p.title,stages:ss.map(x=>({title:`${x.title}  ${String(x.output||'').replace('同階層 ','')}`,text:x.text||''}))};
    return{kicker:'DRILL DOWN',title:slide.claim||p.title,stages:ss.map(x=>({title:x.title,text:x.text||x.output||''}))};
  }
  if(slide.storyStep==='breakdown'){
    const is=(p.items||[]).slice(0,6).map(x=>({label:x.label,title:x.label,value:round(x.value)}));
    return{kicker:'BREAKDOWN',title:slide.claim||p.title,items:is};
  }
  if(slide.storyStep==='association')return{kicker:'ASSOCIATION',title:p.title||slide.claim,items:(p.items||[]).slice(0,3).map(x=>({title:x.title,text:x.text})),lead:p.footnote||''};
  if(slide.storyStep==='action'){
    const as=(p.actions||[]).slice(0,3);
    if(dir==='A')return{kicker:'NEXT CHECK',title:p.title||slide.claim,actions:as.map(x=>({what:x.what||x.title,who:x.who||'',when:x.when||''}))};
    return{kicker:'NEXT CHECK',title:p.title||slide.claim,actions:as.map(x=>({title:x.title||x.what,text:x.text||''}))};
  }
  return{kicker:'MESSAGE',message:slide.claim,support:slide.question};
}
function density(step,dir){if(step==='opening')return'LOW';if(step==='association'||step==='action')return'MED';return dir==='B'?'MED':'MED'}
function run(args){const r=cp.spawnSync(process.execPath,args,{encoding:'utf8'});if(r.status!==0)throw new Error((r.stderr||r.stdout||'command failed').trim());return(r.stdout||'').trim()}
const variants={};let slideOrder=null;
for(const d of Object.keys(DIR)){
  const pd={version:'1.0',profile:'PATTERN-DECK-v1',deck:{title:plan.deck?.title||'',author:'OpenAI',subject:plan.deck?.topic||'',lang:'ja-JP',defaultTheme:DIR[d].theme,defaultDensity:'MED',defaultComposition:DIR[d].composition,renderProfile:'PPT-SAFE-v1.3',fonts:{jp:'Yu Gothic',latin:'Aptos'}},slides:plan.slides.map(s=>({id:s.id,pattern:patternBy[s.storyStep]?.[d]||patternBy.generic[d],density:density(s.storyStep,d),theme:DIR[d].theme,composition:DIR[d].composition,renderProfile:'PPT-SAFE-v1.3',content:content(s,d),notes:`question=${s.question}\nclaim=${s.claim}\ncausalStatus=${s.causalStatus||''}\nsources=${(s.sourceRefs||[]).join(',')}`}))};
  const pfile=path.join(workdir,`pattern-deck.presentation.${d}.json`),sfile=path.join(workdir,`scene-deck.presentation.${d}.json`);
  fs.writeFileSync(pfile,JSON.stringify(pd,null,2),'utf8');run([patternResolver,pfile,sfile]);
  const sd=JSON.parse(fs.readFileSync(sfile,'utf8'));if(!slideOrder)slideOrder=sd.slides.map(s=>s.id);
  variants[d]={label:DIR[d].label,intent:DIR[d].intent,slides:Object.fromEntries(sd.slides.map(s=>[s.id,s])),patternDeck:pfile};
}
const bundle={version:'2.0',profile:'DESIGN-LAB-BUNDLE-v2',deck:{title:plan.deck?.title||'',subject:plan.deck?.topic||'',author:'OpenAI',lang:'ja-JP',fonts:{jp:'Yu Gothic',latin:'Aptos'},presentationEditor:{profile:plan.profile,anchorMetric:plan.deck?.anchorMetric||'',suppressedEvidenceCount:(plan.suppressedEvidence||[]).length}},themes:THEMES,slideOrder,variants,selections:{},reviews:{},recommendations:{defaultDirection:'A',reason:'Executive Editorial is the default after Presentation Editor compression'}};
fs.writeFileSync(output,JSON.stringify(bundle,null,2),'utf8');console.log(output);
