#!/usr/bin/env node
const fs=require('fs'), path=require('path');
const sourcePath=process.argv[2], insightPath=process.argv[3], briefPath=process.argv[4], output=process.argv[5]||'/mnt/data/driver-bundle.v1.json';
if(!sourcePath){console.error('usage: node analyze_drivers.js source-bundle.json [insight-bundle.json] [brief.json] [output.json]');process.exit(2)}
const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
if(source.profile!=='SOURCE-BUNDLE-v1')throw new Error('source profile must be SOURCE-BUNDLE-v1');
const insights=insightPath&&fs.existsSync(insightPath)?JSON.parse(fs.readFileSync(insightPath,'utf8')):{profile:'INSIGHT-BUNDLE-v1',insights:[]};
const brief=briefPath&&fs.existsSync(briefPath)?JSON.parse(fs.readFileSync(briefPath,'utf8')):{};
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../driver/driver-explorer-rules.v1.json'),'utf8'));
const th=rules.thresholds;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:NaN;
const sd=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
const pearson=(a,b)=>{if(a.length!==b.length||a.length<3)return NaN;const ma=mean(a),mb=mean(b);let n=0,da=0,db=0;for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;n+=x*y;da+=x*x;db+=y*y}return da&&db?n/Math.sqrt(da*db):NaN};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fmt=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toFixed(d):String(v??'');
const pct=(v,d=1)=>`${fmt(v*100,d)}%`;
const uniq=a=>[...new Set(a.filter(Boolean))];
const priority=s=>s>=75?'HIGH':s>=55?'MED':'LOW';
const sourceRef=t=>t.provenance?.ref||t.provenance?.query||t.id;
const score=(effect,confidence,coverage)=>Math.round(100*clamp(effect*rules.scoreWeights.effect+confidence*rules.scoreWeights.confidence+coverage*rules.scoreWeights.coverage,0,1));
const sampleWarn=t=>(t.sample||source.metadata?.sample)?'input is marked sample/illustrative':null;
const dateKey=v=>{const t=Date.parse(String(v));return Number.isFinite(t)?t:String(v)};
const dir=v=>v>0?'up':v<0?'down':'none';
const drivers=[];
function add(x){x.id=x.id||`d${String(drivers.length+1).padStart(3,'0')}`;x.score=clamp(Math.round(x.score||0),0,100);x.priority=priority(x.score);x.confidence=clamp(Number(x.confidence||0),0,1);x.sourceRefs=uniq(x.sourceRefs||[]);x.warnings=(x.warnings||[]).filter(Boolean);x.tags=uniq(x.tags||[]);drivers.push(x)}
function targetMetric(){
  const explicit=brief.analysisTarget?.metric||brief.content?.focusMetric||brief.focusMetric;
  if(explicit)return explicit;
  const badDir=brief.analysisTarget?.preferredDirection;
  const ranked=[...(insights.insights||[])].filter(x=>x.metric).sort((a,b)=>b.score-a.score);
  if(badDir==='down'){const w=ranked.find(x=>x.direction==='up');if(w)return w.metric}
  if(badDir==='up'){const w=ranked.find(x=>x.direction==='down');if(w)return w.metric}
  return ranked[0]?.metric||null;
}
const target=targetMetric();
if(!target)throw new Error('no target metric found; set brief.analysisTarget.metric or provide INSIGHT-BUNDLE-v1');
const preferred=brief.analysisTarget?.preferredDirection||'neutral';
function inferHierarchy(t,time){
  if(Array.isArray(t.hierarchy)&&t.hierarchy.length)return t.hierarchy.filter(x=>x!==time?.name);
  return (t.columns||[]).filter(c=>c.semantic==='dimension'||c.type==='string').map(c=>c.name).filter(n=>!time||n!==time.name).slice(0,th.maxHierarchyDepth);
}
function agg(rows,metric,aggregation){
  const a=rows.map(r=>num(r[metric])).filter(v=>v!=null); if(!a.length)return null;
  if(aggregation==='avg'||aggregation==='latest')return mean(a);
  if(aggregation==='min')return Math.min(...a); if(aggregation==='max')return Math.max(...a);
  return a.reduce((s,v)=>s+v,0);
}
function group(rows,keys){const m=new Map();for(const r of rows){const k=keys.map(x=>String(r[x]??'')).join('||');if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return m}
function tableForTarget(){
  const candidates=(source.tables||[]).filter(t=>(t.columns||[]).some(c=>c.name===target));
  candidates.sort((a,b)=>{
    const at=(a.columns||[]).some(c=>c.semantic==='time'||c.type==='date')?1:0,bt=(b.columns||[]).some(c=>c.semantic==='time'||c.type==='date')?1:0;
    const ad=(a.columns||[]).filter(c=>c.semantic==='dimension'||c.type==='string').length,bd=(b.columns||[]).filter(c=>c.semantic==='dimension'||c.type==='string').length;
    return (bt*10+bd)-(at*10+ad);
  });
  return candidates[0]||null;
}
const t=tableForTarget();
if(!t)throw new Error(`no table contains target metric ${target}`);
const cols=t.columns||[], rows=t.rows||[], targetCol=cols.find(c=>c.name===target);
const time=cols.find(c=>c.semantic==='time'||c.type==='date'||/(date|month|week|年月|月|日)/i.test(c.name));
const hierarchy=inferHierarchy(t,time);
const otherMetrics=cols.filter(c=>(c.type==='number'||c.semantic==='metric')&&c.name!==target);
const sref=sourceRef(t);
let baseline=null,current=null,baselineRows=rows,currentRows=rows;
if(time){const periods=uniq(rows.map(r=>r[time.name])).sort((a,b)=>dateKey(a)>dateKey(b)?1:-1);baseline=periods[0];current=periods[periods.length-1];baselineRows=rows.filter(r=>r[time.name]===baseline);currentRows=rows.filter(r=>r[time.name]===current)}
const totalBase=agg(baselineRows,target,targetCol?.aggregation), totalCurrent=agg(currentRows,target,targetCol?.aggregation), totalDelta=(totalBase!=null&&totalCurrent!=null)?totalCurrent-totalBase:null;
const targetUnit=targetCol?.unit||'';
const targetLabel=targetCol?.label||target;
if(time&&hierarchy.length&&targetCol?.aggregation==='sum'&&totalDelta!=null&&Math.abs(totalDelta)>1e-12){
  let parentFilter={};
  for(let level=0;level<Math.min(hierarchy.length,th.maxHierarchyDepth);level++){
    const dim=hierarchy[level];
    const allRowsBase=baselineRows.filter(r=>Object.entries(parentFilter).every(([k,v])=>String(r[k])===String(v)));
    const allRowsCur=currentRows.filter(r=>Object.entries(parentFilter).every(([k,v])=>String(r[k])===String(v)));
    const keys=uniq(allRowsBase.concat(allRowsCur).map(r=>r[dim]));
    if(keys.length<2)continue;
    const items=[];
    for(const key of keys){const b=agg(allRowsBase.filter(r=>String(r[dim])===String(key)),target,'sum')||0;const c=agg(allRowsCur.filter(r=>String(r[dim])===String(key)),target,'sum')||0;items.push({key,baseline:b,current:c,delta:c-b})}
    const parentDelta=items.reduce((s,x)=>s+x.delta,0);const denom=Math.abs(parentDelta)>1e-12?parentDelta:totalDelta;
    const sorted=[...items].sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    for(const it of sorted.slice(0,th.maxDriversPerLevel)){
      const share=denom?it.delta/denom:0; if(Math.abs(share)<th.minContributionShare)continue;
      const conf=clamp(.72+.08*level+.08*Math.min(1,keys.length/10),0,.96), eff=clamp(Math.abs(share),0,1), cov=clamp(keys.length/10,.45,1);
      const pathArr=[...Object.entries(parentFilter).map(([dimension,value])=>({dimension,value})),{dimension:dim,value:it.key}];
      add({type:'hierarchical_contribution',title:`${dim}=${it.key} の寄与`,message:`${targetLabel} の変化 ${totalDelta>=0?'+':''}${fmt(totalDelta,1)}${targetUnit} に対し、${pathArr.map(x=>x.value).join(' → ')} は ${it.delta>=0?'+':''}${fmt(it.delta,1)}${targetUnit}（同階層変化の ${pct(Math.abs(share))}）`,score:score(eff,conf,cov),confidence:conf,causalStatus:'accounting_decomposition',targetMetric:target,dimension:dim,path:pathArr,n:keys.length,effect:it.delta,share,direction:dir(it.delta),evidence:{baseline,current,totalBaseline:totalBase,totalCurrent:totalCurrent,totalDelta,parentDelta,item:it,level,items:sorted},method:{name:'hierarchical_delta_contribution',params:{aggregation:'sum',baseline,current,level}},sourceRefs:[sref],warnings:[sampleWarn(t),'accounting contribution is not proof of causal mechanism'],tags:['driver','hierarchy','contribution']});
    }
    const focus=sorted[0]; if(!focus)break; parentFilter={...parentFilter,[dim]:focus.key};
  }
  const leafDim=hierarchy[Math.min(hierarchy.length,th.maxHierarchyDepth)-1]||hierarchy[0];
  const leafItems=[];for(const key of uniq(baselineRows.concat(currentRows).map(r=>r[leafDim]))){const b=agg(baselineRows.filter(r=>String(r[leafDim])===String(key)),target,'sum')||0,c=agg(currentRows.filter(r=>String(r[leafDim])===String(key)),target,'sum')||0;leafItems.push({key,delta:c-b})}
  const absTotal=leafItems.reduce((s,x)=>s+Math.abs(x.delta),0);const top3=[...leafItems].sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,3);const topShare=absTotal?top3.reduce((s,x)=>s+Math.abs(x.delta),0)/absTotal:0;
  if(topShare>=th.minConcentrationShare){const conf=clamp(.7+.12*Math.min(1,leafItems.length/15),0,.95);add({type:'change_concentration',title:`${targetLabel} 変化の集中`,message:`${targetLabel} の絶対変化量の ${pct(topShare)} が上位3 ${leafDim} に集中`,score:score(clamp(topShare,0,1),conf,clamp(leafItems.length/15,.4,1)),confidence:conf,causalStatus:'accounting_decomposition',targetMetric:target,dimension:leafDim,n:leafItems.length,effect:topShare,share:topShare,direction:'mixed',evidence:{top3,topShare,absTotal,items:leafItems},method:{name:'absolute_change_concentration',params:{topN:3}},sourceRefs:[sref],warnings:[sampleWarn(t)],tags:['concentration','change']})}
}
for(const dim of hierarchy){const groups=group(currentRows,[dim]); if(groups.size<th.minSegments)continue; const items=[];for(const [k,rs] of groups){const v=agg(rs,target,targetCol?.aggregation);if(v!=null)items.push({key:k,value:v,n:rs.length})} if(items.length<th.minSegments)continue;items.sort((a,b)=>b.value-a.value);const gap=items[0].value-items[items.length-1].value,spread=sd(items.map(x=>x.value))||Math.abs(mean(items.map(x=>x.value)))*.1||1;const eff=clamp(Math.abs(gap)/(spread*3),0,1),conf=clamp(.58+.18*Math.min(1,items.length/12),0,.9);add({type:'segment_gap',title:`${dim}別 ${targetLabel} の差`,message:`${current??'最新'}の ${targetLabel} は ${items[0].key} ${fmt(items[0].value,1)}${targetUnit} と ${items[items.length-1].key} ${fmt(items[items.length-1].value,1)}${targetUnit} の差が ${fmt(gap,1)}${targetUnit}`,score:score(eff,conf,clamp(items.length/12,.4,1)),confidence:conf,causalStatus:'descriptive_difference',targetMetric:target,dimension:dim,n:items.length,effect:gap,direction:'mixed',evidence:{period:current,top:items.slice(0,5),bottom:items.slice(-5).reverse(),gap},method:{name:'segment_gap',params:{aggregation:targetCol?.aggregation||'sum'}},sourceRefs:[sref],warnings:[sampleWarn(t),'descriptive segment difference; not a causal explanation'],tags:['segment','gap']})}
if(time&&hierarchy.length&&otherMetrics.length){const dim=hierarchy[hierarchy.length-1];const keys=uniq(baselineRows.concat(currentRows).map(r=>r[dim]));const deltas=[];for(const key of keys){const br=baselineRows.filter(r=>String(r[dim])===String(key)),cr=currentRows.filter(r=>String(r[dim])===String(key));const td=(agg(cr,target,targetCol?.aggregation)||0)-(agg(br,target,targetCol?.aggregation)||0);const row={key,targetDelta:td,targetLevel:agg(cr,target,targetCol?.aggregation)};for(const m of otherMetrics){row[`${m.name}Delta`]=(agg(cr,m.name,m.aggregation)||0)-(agg(br,m.name,m.aggregation)||0);row[`${m.name}Level`]=agg(cr,m.name,m.aggregation)}deltas.push(row)}
  for(const m of otherMetrics){const pairsD=deltas.map(r=>[r.targetDelta,r[`${m.name}Delta`]]).filter(([a,b])=>a!=null&&b!=null);if(pairsD.length>=th.minCorrelationN){const r=pearson(pairsD.map(x=>x[0]),pairsD.map(x=>x[1]));if(Number.isFinite(r)&&Math.abs(r)>=th.correlationAbs){const conf=clamp(.45+.25*Math.min(1,pairsD.length/20)+.2*Math.abs(r),0,.92),eff=clamp(Math.abs(r),0,1);add({type:'delta_association',title:`${targetLabel}変化と ${(m.label||m.name)}変化の関連`,message:`${dim}単位の変化量で r=${fmt(r,2)}（n=${pairsD.length}）。${r>=0?'同方向':'逆方向'}に動く傾向`,score:score(eff,conf,clamp(pairsD.length/20,.4,1)),confidence:conf,causalStatus:'association_only',targetMetric:target,driverMetric:m.name,dimension:dim,n:pairsD.length,effect:r,direction:r>=0?'up':'down',evidence:{r,pairs:deltas.map(x=>({key:x.key,targetDelta:x.targetDelta,driverDelta:x[`${m.name}Delta`]}))},method:{name:'pearson_delta_association',params:{dimension:dim,baseline,current}},sourceRefs:[sref],warnings:['association only; correlation does not establish causation',sampleWarn(t)],tags:['association','delta']})}}
    const pairsL=deltas.map(r=>[r.targetLevel,r[`${m.name}Level`]]).filter(([a,b])=>a!=null&&b!=null);if(pairsL.length>=th.minCorrelationN){const r=pearson(pairsL.map(x=>x[0]),pairsL.map(x=>x[1]));if(Number.isFinite(r)&&Math.abs(r)>=th.strongCorrelationAbs){const conf=clamp(.42+.25*Math.min(1,pairsL.length/20)+.18*Math.abs(r),0,.88),eff=clamp(Math.abs(r)*.9,0,1);add({type:'level_association',title:`${targetLabel}と ${(m.label||m.name)} の水準関連`,message:`${current??'最新'}の ${dim}単位で r=${fmt(r,2)}（n=${pairsL.length}）`,score:score(eff,conf,clamp(pairsL.length/20,.4,1)),confidence:conf,causalStatus:'association_only',targetMetric:target,driverMetric:m.name,dimension:dim,n:pairsL.length,effect:r,direction:r>=0?'up':'down',evidence:{r,pairs:deltas.map(x=>({key:x.key,targetLevel:x.targetLevel,driverLevel:x[`${m.name}Level`]}))},method:{name:'pearson_level_association',params:{dimension:dim,period:current}},sourceRefs:[sref],warnings:['cross-sectional association only; may reflect mix or common causes',sampleWarn(t)],tags:['association','level']})}}
  }
}
const assoc=drivers.filter(x=>['delta_association','level_association'].includes(x.type)).sort((a,b)=>b.score-a.score).slice(0,5);
if(hierarchy.length>=2&&time){const strataDim=hierarchy[0], leaf=hierarchy[hierarchy.length-1];for(const a of assoc){const m=cols.find(c=>c.name===a.driverMetric);if(!m)continue;const strata=uniq(currentRows.map(r=>r[strataDim]));const rs=[];for(const s of strata){const base=baselineRows.filter(r=>String(r[strataDim])===String(s)),cur=currentRows.filter(r=>String(r[strataDim])===String(s)),keys=uniq(base.concat(cur).map(r=>r[leaf]));const x=[],y=[];for(const key of keys){const br=base.filter(r=>String(r[leaf])===String(key)),cr=cur.filter(r=>String(r[leaf])===String(key));if(a.type==='delta_association'){x.push((agg(cr,target,targetCol?.aggregation)||0)-(agg(br,target,targetCol?.aggregation)||0));y.push((agg(cr,m.name,m.aggregation)||0)-(agg(br,m.name,m.aggregation)||0))}else{x.push(agg(cr,target,targetCol?.aggregation));y.push(agg(cr,m.name,m.aggregation))}}const pairs=x.map((v,i)=>[v,y[i]]).filter(([u,v])=>u!=null&&v!=null);if(pairs.length>=3){const r=pearson(pairs.map(z=>z[0]),pairs.map(z=>z[1]));if(Number.isFinite(r))rs.push({stratum:s,r,n:pairs.length})}}
    if(rs.length>=2){const sign=Math.sign(a.effect),stable=rs.filter(x=>Math.sign(x.r)===sign&&Math.abs(x.r)>=.2).length/rs.length;const conf=clamp(.45+.25*Math.min(1,rs.length/5),0,.8);add({type:'subgroup_stability',title:`${a.driverMetric} 関連のセグメント安定性`,message:`全体 r=${fmt(a.effect,2)} に対し、${strataDim}別で同符号の関連は ${rs.filter(x=>Math.sign(x.r)===sign).length}/${rs.length}。安定度 ${pct(stable)}`,score:score(clamp(stable,0,1),conf,clamp(rs.length/5,.4,1)),confidence:conf,causalStatus:'requires_validation',targetMetric:target,driverMetric:a.driverMetric,dimension:strataDim,n:rs.length,effect:stable,direction:'none',evidence:{overall:a.effect,strata:rs,stability:stable},method:{name:'subgroup_sign_stability',params:{strataDimension:strataDim,leafDimension:leaf}},sourceRefs:[sref],warnings:[stable<th.signStabilityMin?'relationship is unstable across subgroups; avoid global explanation':null,sampleWarn(t)],tags:['stability','counterexample']})}}
}
const rankBonus={hierarchical_contribution:12,change_concentration:8,segment_gap:3,delta_association:0,level_association:-2,subgroup_stability:-12,counterexample:-12};
const sorted=drivers.sort((a,b)=>((b.score+(rankBonus[b.type]||0))-(a.score+(rankBonus[a.type]||0)))||b.score-a.score).slice(0,th.maxCandidates);
const topContribution=sorted.find(x=>x.type==='hierarchical_contribution');const topAssoc=sorted.find(x=>x.type==='delta_association'||x.type==='level_association');
const targetSummary={metric:target,label:targetLabel,unit:targetUnit,preferredDirection:preferred,tableId:t.id,baseline,current,baselineValue:totalBase,currentValue:totalCurrent,delta:totalDelta,sourceRefs:[sref]};
const briefPatch={content:{driverCandidates:sorted.slice(0,5).map(x=>({title:x.title,text:x.message,causalStatus:x.causalStatus,sourceRefs:x.sourceRefs})),problem:{title:`${targetLabel} の変化`,text:totalDelta==null?'対象指標の変化を確認':`${baseline} → ${current}: ${totalDelta>=0?'+':''}${fmt(totalDelta,1)}${targetUnit}`},cause:topContribution?{title:'寄与の大きい要因候補',text:topContribution.message}:topAssoc?{title:'関連の強い要因候補',text:topAssoc.message}:{title:'要因候補',text:'追加の粒度データが必要'},solution:{title:'次に確認すること',text:'寄与・関連が大きいセグメントを業務イベント、在庫、価格、売場、発注条件と照合する'}}};
const out={version:'1.0',profile:'DRIVER-BUNDLE-v1',target:targetSummary,drivers:sorted,drilldown:sorted.filter(x=>x.type==='hierarchical_contribution').map(x=>({path:x.path,share:x.share,effect:x.effect,score:x.score})),recommendations:{topContribution:topContribution?.id||null,topAssociation:topAssoc?.id||null,languageRule:'driver candidate / contribution / association; never causal claim without causal design'},briefPatch};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
