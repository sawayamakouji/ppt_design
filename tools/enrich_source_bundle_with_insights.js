#!/usr/bin/env node
const fs=require('fs');const path=require('path');
const sourcePath=process.argv[2], insightPath=process.argv[3], output=process.argv[4]||'/mnt/data/source-bundle.with-insights.v1.json';
if(!sourcePath||!insightPath){console.error('usage: node enrich_source_bundle_with_insights.js source-bundle.json insight-bundle.json [output.json]');process.exit(2)}
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8')), ib=JSON.parse(fs.readFileSync(insightPath,'utf8'));
if(source.profile!=='SOURCE-BUNDLE-v1')throw new Error('source profile must be SOURCE-BUNDLE-v1');if(ib.profile!=='INSIGHT-BUNDLE-v1')throw new Error('insight profile must be INSIGHT-BUNDLE-v1');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../insight/insight-engine-rules.v1.json'),'utf8'));
const fmt=(v,d=2)=>Number.isFinite(Number(v))?Number(v).toFixed(d):String(v??'');
function factFor(i){let value=0,display=i.message,unit=i.unit||'',comparison=null;const e=i.evidence||{};
  if(i.type==='period_delta'){value=e.last?.y??e.delta??0;display=e.last?`${fmt(e.last.y)}${unit}`:i.message;comparison={label:e.first?`${e.first.x} ${fmt(e.first.y)}${unit}`:'baseline',baselineValue:e.first?.y,baselineDisplay:e.first?`${fmt(e.first.y)}${unit}`:undefined,deltaValue:e.delta,deltaDisplay:e.delta==null?undefined:`${e.delta>=0?'+':''}${fmt(e.delta)}${unit}`};}
  else if(i.type==='correlation'){value=e.r??0;display=`r=${fmt(e.r,2)}`;unit='';}
  else if(i.type==='concentration'){value=(e.top20Share??0)*100;display=`Top20 ${fmt(value,1)}%`;unit='%';}
  else if(i.type==='contribution'){value=(e.top3Share??0)*100;display=`Top3 ${fmt(value,1)}%`;unit='%';}
  else if(i.type==='anomaly'){value=e.value??e.residual??0;display=e.key?`${e.key} ${fmt(value)}${unit}`:i.message;}
  else if(i.type==='segment_gap'){value=e.gap??0;display=`差 ${fmt(value)}${unit}`;}
  else if(i.type==='change_point'){value=(e.afterMean??0)-(e.beforeMean??0);display=`水準差 ${value>=0?'+':''}${fmt(value)}${unit}`;}
  else if(i.type==='trend'){value=e.slope??0;display=`傾き ${value>=0?'+':''}${fmt(value)}${unit}/期間`;}
  else if(i.type==='ranking'){value=e.top?.[0]?.value??0;display=e.top?.[0]?`${e.top[0].key} ${fmt(e.top[0].value)}${unit}`:i.message;}
  return{id:`insight_${i.id}`,label:i.title,value,displayValue:display,unit,comparison,period:'derived',tags:['insight',i.type,i.priority],sourceRefs:[...new Set([...(i.sourceRefs||[]),`insight:${i.id}`])],confidence:i.confidence};
}
const high=(ib.insights||[]).slice(0,rules.maxInsightFacts).map(factFor);
const out={...source,metadata:{...(source.metadata||{}),insightEngine:{profile:ib.profile,insightCount:(ib.insights||[]).length,topInsightId:ib.recommendations?.topInsightId||null}},facts:[...(source.facts||[]),...high]};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
