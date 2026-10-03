#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const input=process.argv[2],output=process.argv[3]||'/mnt/data/presentation-plan.directed.v1.json';
if(!input){console.error('usage: node direct_deck.js presentation-plan.json [output.json]');process.exit(2)}
const plan=JSON.parse(fs.readFileSync(input,'utf8'));
if(plan.profile!=='PRESENTATION-PLAN-v1')throw new Error('profile must be PRESENTATION-PLAN-v1');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../deck/deck-director-rules.v1.json'),'utf8'));
const family=p=>String(p||'').split('-')[0];
const sig=(s,d)=>rules.silhouetteFamily[family(rules.patternPreferences[s.storyStep]?.[d]||rules.patternPreferences.generic[d])]||'generic';
const issues=[];const titles=[];const recent={A:[],B:[],C:[]};
const slides=plan.slides.map((s,i)=>{
  const patterns={};
  for(const d of ['A','B','C']){
    let p=rules.patternPreferences[s.storyStep]?.[d]||rules.patternPreferences.generic[d];
    const silhouette=sig(s,d);const window=recent[d].slice(-rules.defaultRecentSilhouetteWindow);
    if(rules.rules.avoidSameSilhouetteWithinWindow && window.includes(silhouette) && s.storyStep!=='generic'){
      // Prefer a different family when a safe alternate exists.
      const alternates={kpi:{A:'ED03-B',B:'ED03-E',C:'ED03-D'},hierarchy:{A:'ED07-E',B:'ED07-A',C:'ED07-D'},breakdown:{A:'ED08-G',B:'ED08-D',C:'ED08-F'},association:{A:'ED04-D',B:'ED04-B',C:'ED04-A'},action:{A:'ED11-D',B:'ED11-B',C:'ED11-C'}};
      p=alternates[s.storyStep]?.[d]||p;
    }
    patterns[d]=p;recent[d].push(rules.silhouetteFamily[family(p)]||'generic');
  }
  const prev=plan.slides[i-1];
  if(prev && prev.question===s.question)issues.push({type:'repeated_question',slides:[prev.id,s.id]});
  if(prev && prev.claim===s.claim)issues.push({type:'repeated_claim',slides:[prev.id,s.id]});
  titles.push(s.claim);
  return {...s,deckDirection:{energy:rules.energyByStoryStep[s.storyStep]||'CALM',patterns,transitionFromPrevious:i===0?'OPEN':`${prev.storyStep}->${s.storyStep}`,visualJob:s.storyStep==='kpi'?'anchor numbers':s.storyStep==='hierarchy'?'show structure':s.storyStep==='breakdown'?'show evidence':s.storyStep==='association'?'qualify interpretation':s.storyStep==='action'?'close with decision / next action':'establish message'}};
});
if(slides.length && slides[slides.length-1].storyStep!=='action')issues.push({type:'weak_close',slide:slides[slides.length-1].id});
const out={...plan,slides,deckDirector:{profile:'DECK-DIRECTOR-v1',titleSequence:titles,issues,quality:{titleSequenceReadable:titles.every(Boolean),repeatedQuestionCount:issues.filter(x=>x.type==='repeated_question').length,repeatedClaimCount:issues.filter(x=>x.type==='repeated_claim').length,hasActionClose:slides.at(-1)?.storyStep==='action'}}};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
