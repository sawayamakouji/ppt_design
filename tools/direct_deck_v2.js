#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const input=process.argv[2],output=process.argv[3]||'/mnt/data/presentation-plan.directed.v2.json';
if(!input){console.error('usage: node direct_deck_v2.js presentation-plan.json [output.json]');process.exit(2)}
const plan=JSON.parse(fs.readFileSync(input,'utf8'));
if(plan.profile!=='PRESENTATION-PLAN-v1')throw new Error('profile must be PRESENTATION-PLAN-v1');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../deck/deck-director-rules.v2.json'),'utf8'));
const dirs=['A','B','C'];
const issues=[],repairs=[],transitions=[];
const n=plan.slides.length;
const midPeakIndex=n>=5?Math.max(2,Math.min(n-2,Math.round((n-1)*0.60))):-1;
function normalized(s){return String(s||'').replace(/[\s　。、,.・:：!?！？()（）\-→]/g,'').toLowerCase()}
function pairTransition(prev,cur){
  if(!prev)return {type:'OPEN',cue:'最初の結論を置く'};
  return rules.transitionByPair[`${prev.storyStep}->${cur.storyStep}`]||{type:'CONTINUE',cue:'前ページの結論から次の問いへ進む'};
}
function energyFor(s,i){
  if(i===0)return 'PEAK';
  if(i===n-1 && s.storyStep==='action')return 'PEAK';
  if(i===midPeakIndex && !['kpi','association'].includes(s.storyStep))return 'PEAK';
  return rules.storyStepDefaults[s.storyStep]?.baseEnergy||'CALM';
}
function scoreCandidate(pattern,recentShapes,step,dir,energy){
  const shape=rules.visualShape[pattern]||pattern.split('-')[0];
  let score=100;
  if(recentShapes.includes(shape))score-=50;
  if(step==='breakdown' && energy==='PEAK' && shape==='ranked-bars')score+=10;
  if(step==='association' && shape==='one-plus-two')score+=8;
  if(step==='action' && dir==='A' && shape==='action-table')score+=6;
  return {pattern,shape,score};
}
const recentShapes={A:[],B:[],C:[]};
const slides=plan.slides.map((s,i)=>{
  const prev=plan.slides[i-1],next=plan.slides[i+1];
  if(prev && normalized(prev.question)===normalized(s.question))issues.push({severity:'blocking',type:'repeated_question',slides:[prev.id,s.id]});
  if(prev && normalized(prev.claim)===normalized(s.claim))issues.push({severity:'blocking',type:'repeated_claim',slides:[prev.id,s.id]});
  let energy=energyFor(s,i);
  const prevEnergy=i?energyFor(prev,i-1):null;
  if(prevEnergy==='PEAK' && energy==='PEAK' && i!==n-1){energy=s.storyStep==='kpi'?'ANCHOR':'EVIDENCE';repairs.push({slide:s.id,type:'demote_adjacent_peak',to:energy});}
  const trans=pairTransition(prev,s); transitions.push({from:prev?.id||null,to:s.id,...trans});
  const variants={};
  for(const d of dirs){
    const candidates=rules.patternCandidates[s.storyStep]?.[d]||rules.patternCandidates.generic[d];
    const ranked=candidates.map(p=>scoreCandidate(p,recentShapes[d].slice(-rules.recentVisualShapeWindow),s.storyStep,d,energy)).sort((a,b)=>b.score-a.score);
    const best=ranked[0];
    if(recentShapes[d].includes(best.shape))issues.push({severity:'warn',type:'visual_shape_repeat',slide:s.id,direction:d,shape:best.shape});
    recentShapes[d].push(best.shape);
    variants[d]={pattern:best.pattern,visualShape:best.shape,composition:rules.compositionByEnergy[d][energy]||'CM02',density:rules.densityByMode[rules.storyStepDefaults[s.storyStep]?.visualMode||'message']||'MED'};
  }
  const continuity={
    in:trans.cue,
    out:next?pairTransition(s,next).cue:'意思決定または次アクションで閉じる'
  };
  return {...s,deckDirection:{profile:'DECK-DIRECTOR-v2',energy,visualMode:rules.storyStepDefaults[s.storyStep]?.visualMode||'message',transitionIn:trans.type,continuity,variants,patterns:Object.fromEntries(dirs.map(d=>[d,variants[d].pattern])),composition:Object.fromEntries(dirs.map(d=>[d,variants[d].composition])),density:Object.fromEntries(dirs.map(d=>[d,variants[d].density]))}};
});
if(slides.length && slides.at(-1).storyStep!=='action')issues.push({severity:'warn',type:'weak_close',slide:slides.at(-1).id});
const peaks=slides.map((s,i)=>s.deckDirection.energy==='PEAK'?i:null).filter(x=>x!==null);
for(let j=1;j<peaks.length;j++) if(peaks[j]-peaks[j-1]<rules.minPeakGapSlides)issues.push({severity:'warn',type:'peak_too_close',slides:[slides[peaks[j-1]].id,slides[peaks[j]].id]});
const modeRuns=[];let last=null,count=0;for(const s of slides){const m=s.deckDirection.visualMode;if(m===last)count++;else{if(last)modeRuns.push({mode:last,count});last=m;count=1}}if(last)modeRuns.push({mode:last,count});
if(modeRuns.some(x=>x.count>2))issues.push({severity:'blocking',type:'visual_mode_monotony',runs:modeRuns.filter(x=>x.count>2)});
const titleSequence=slides.map(s=>s.claim).filter(Boolean);
const quality={
  slideCount:n,
  peakSlides:peaks.map(i=>slides[i].id),
  peakSpacingOk:!issues.some(x=>x.type==='peak_too_close'),
  repeatedQuestionCount:issues.filter(x=>x.type==='repeated_question').length,
  repeatedClaimCount:issues.filter(x=>x.type==='repeated_claim').length,
  visualModeMonotonyCount:issues.filter(x=>x.type==='visual_mode_monotony').length,
  hasActionClose:slides.at(-1)?.storyStep==='action',
  transitionCoverage:transitions.length===slides.length,
  blockingIssueCount:issues.filter(x=>x.severity==='blocking').length
};
const out={...plan,slides,deckDirector:{profile:'DECK-DIRECTOR-v2',titleSequence,energyCurve:slides.map(s=>({slide:s.id,energy:s.deckDirection.energy,visualMode:s.deckDirection.visualMode})),transitions,repairs,issues,quality,directions:rules.directionProfiles}};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
