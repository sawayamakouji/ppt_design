#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const briefPath=process.argv[2], sourcePath=process.argv[3], output=process.argv[4]||'/mnt/data/content-plan.v1.json';
if(!briefPath||!sourcePath){console.error('usage: node plan_content.js brief.json source-bundle.json [output.json]');process.exit(2)}
const brief=JSON.parse(fs.readFileSync(briefPath,'utf8'));
const bundle=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
if(brief.profile!=='BRIEF-v1')throw new Error('brief profile must be BRIEF-v1');
if(bundle.profile!=='SOURCE-BUNDLE-v1')throw new Error('source profile must be SOURCE-BUNDLE-v1');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../content/content-planner-rules.v1.json'),'utf8'));

const fmt=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toFixed(d):String(v??'');
const dispFact=f=>f.displayValue||`${f.value}${f.unit||''}`;
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;
const pearson=(a,b)=>{if(a.length!==b.length||a.length<3)return NaN;const ma=mean(a),mb=mean(b);let n=0,da=0,db=0;for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;n+=x*y;da+=x*x;db+=y*y}return da&&db?n/Math.sqrt(da*db):NaN};
const toNum=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const dateKey=v=>{const t=Date.parse(String(v));return Number.isFinite(t)?t:String(v)};
const unique=a=>[...new Set(a)];
const labelOf=c=>c.label||c.name;
const sourceRefFor=t=>t.provenance?.ref||t.provenance?.query||t.id;

function story(){
  const base=[...(rules.storyTemplates[brief.objective]||rules.storyTemplates.explain)];
  const n=Math.max(3,Math.min(20,Number(brief.slideCount||6)));
  const end=brief.objective==='training'?'evidence':'action';
  if(n<base.length)return base.filter(r=>r!==end).slice(0,n-1).concat(end);
  const extras=['data','compare','diagnosis','timeline','evidence'];let i=0;
  while(base.length<n)base.splice(base.length-1,0,extras[i++%extras.length]);
  return base.slice(0,n);
}

const candidates=[];
function add(c){c.id=c.id||`c${candidates.length+1}`;c.quality=c.quality??0.75;c.sourceRefs=unique(c.sourceRefs||[]);candidates.push(c)}

for(const f of bundle.facts||[]){
  add({kind:'fact',title:f.label,message:`${f.label}: ${dispFact(f)}`,fact:f,quality:f.confidence??0.95,sourceRefs:f.sourceRefs||[]});
  if(f.comparison && (f.comparison.deltaDisplay!=null || f.comparison.deltaValue!=null || f.comparison.baselineValue!=null)){
    const delta=f.comparison.deltaDisplay ?? (f.comparison.deltaValue!=null?String(f.comparison.deltaValue):'');
    add({kind:'delta',title:f.label,message:`${f.label}: ${dispFact(f)}${delta?`（${f.comparison.label||'比較'} ${delta}）`:''}`,fact:f,quality:f.confidence??0.96,sourceRefs:f.sourceRefs||[]});
  }
}

function aggregateBy(rows, dim, metric, agg='avg'){
  const m=new Map();
  for(const r of rows){const k=String(r[dim]??'');const v=toNum(r[metric]);if(v==null)continue;if(!m.has(k))m.set(k,[]);m.get(k).push(v)}
  return [...m.entries()].map(([k,vals])=>({key:k,value:agg==='sum'?vals.reduce((a,b)=>a+b,0):agg==='min'?Math.min(...vals):agg==='max'?Math.max(...vals):mean(vals)}));
}

for(const t of bundle.tables||[]){
  const cols=t.columns||[];const rows=t.rows||[];
  const time=cols.find(c=>c.semantic==='time'||c.type==='date'||/(date|month|week|年月|月|日)/i.test(c.name));
  const dims=cols.filter(c=>(c.semantic==='dimension'||c.type==='string')&&c.semantic!=='id'&&(!time||c.name!==time.name));
  const nums=cols.filter(c=>c.type==='number'||c.semantic==='metric');
  const sref=sourceRefFor(t);
  if(time){
    for(const m of nums){
      const pts=rows.map(r=>({x:r[time.name],y:toNum(r[m.name])})).filter(p=>p.x!=null&&p.y!=null).sort((a,b)=>dateKey(a.x)>dateKey(b.x)?1:-1);
      if(pts.length>=3){
        const first=pts[0],last=pts[pts.length-1],delta=last.y-first.y;
        add({kind:'trend',title:`${labelOf(m)} trend`,message:`${labelOf(m)} は ${first.x} → ${last.x} で ${delta>=0?'+':''}${fmt(delta,2)}${m.unit||''}`,tableId:t.id,field:m.name,timeField:time.name,points:pts,unit:m.unit||'',quality:Math.min(.94,.65+pts.length/50),sourceRefs:[sref],sample:!!t.sample});
      }
    }
  }
  if(dims.length){
    const d=dims[0];
    for(const m of nums){
      const agg=aggregateBy(rows,d.name,m.name,m.aggregation||'avg').filter(x=>x.key!=='');
      if(agg.length>=3){
        agg.sort((a,b)=>b.value-a.value);const top=agg.slice(0,Math.min(5,agg.length));
        add({kind:'ranking',title:`${labelOf(m)} ranking`,message:`${labelOf(m)} 上位: ${top.slice(0,3).map(x=>x.key).join(' / ')}`,tableId:t.id,dimension:d.name,field:m.name,items:top,unit:m.unit||'',quality:Math.min(.92,.68+agg.length/100),sourceRefs:[sref],sample:!!t.sample});
      }
    }
  }
  if(nums.length>=2 && rows.length>=6){
    for(let i=0;i<nums.length;i++)for(let j=i+1;j<nums.length;j++){
      const a=[],b=[];for(const r of rows){const x=toNum(r[nums[i].name]),y=toNum(r[nums[j].name]);if(x!=null&&y!=null){a.push(x);b.push(y)}}
      if(a.length>=6){const r=pearson(a,b);if(Number.isFinite(r))add({kind:'correlation',title:`${labelOf(nums[i])} × ${labelOf(nums[j])}`,message:`${labelOf(nums[i])} と ${labelOf(nums[j])} の相関 r=${fmt(r,2)}`,tableId:t.id,xField:nums[i].name,yField:nums[j].name,r,quality:Math.min(.9,.58+a.length/60),sourceRefs:[sref],sample:!!t.sample});}
    }
  }
  if(rows.length){
    add({kind:'table',title:t.title||t.id,message:`${t.title||t.id}: ${rows.length} rows`,tableId:t.id,columns:cols.map(c=>c.name),rows:rows.slice(0,12),quality:.8,sourceRefs:[sref],sample:!!t.sample});
  }
}

function visualFor(c){
  if(!c)return{type:'none',patternHint:rules.patternHints.none,supported:true};
  if(c.kind==='fact')return{type:'kpi',patternHint:'ED03-A',supported:true};
  if(c.kind==='delta')return{type:'delta',patternHint:rules.patternHints.delta,supported:true};
  if(c.kind==='trend')return{type:'line',patternHint:rules.patternHints.line,supported:true,chart:{type:'line',categories:c.points.map(p=>String(p.x)),series:[{name:c.title.replace(/ trend$/,''),values:c.points.map(p=>p.y)}]}};
  if(c.kind==='ranking')return{type:'ranking',patternHint:rules.patternHints.ranking,supported:true,chart:{type:'column',categories:c.items.map(x=>x.key),series:[{name:c.title.replace(/ ranking$/,''),values:c.items.map(x=>x.value)}]}};
  if(c.kind==='correlation')return{type:'scatter',patternHint:rules.patternHints.scatter,supported:false};
  if(c.kind==='table')return{type:'table',patternHint:rules.patternHints.table,supported:true};
  return{type:'none',patternHint:rules.patternHints.none,supported:true};
}

const used=new Map();
function score(c,role){
  const base=rules.roleTypeScores[role]?.[c.kind]??0;
  const v=visualFor(c);const reuse=(used.get(c.id)||0)*Number(rules.reusePenalty||0);const unsupported=v.supported?0:Number(rules.unsupportedVisualPenalty||0);
  const samplePenalty=c.sample?8:0;
  return base + c.quality*20 - reuse - unsupported - samplePenalty;
}
function choose(role, allowUnsupported=false){
  const ranked=candidates.map(c=>({c,score:score(c,role),visual:visualFor(c)})).filter(x=>allowUnsupported||x.visual.supported).sort((a,b)=>b.score-a.score);
  const top=ranked[0];
  if(!top||top.score<rules.minimumCandidateScore)return{selected:null,alternatives:ranked.slice(0,rules.maxAlternatives)};
  used.set(top.c.id,(used.get(top.c.id)||0)+1);
  return{selected:top,alternatives:ranked.slice(1,1+rules.maxAlternatives)};
}

function evidenceObj(c){
  if(!c)return null;
  if(c.kind==='fact'||c.kind==='delta')return{kind:c.kind,title:c.title,message:c.message,value:dispFact(c.fact),comparison:c.fact.comparison||null,sourceRefs:c.sourceRefs};
  if(c.kind==='trend')return{kind:c.kind,title:c.title,message:c.message,field:c.field,timeField:c.timeField,points:c.points,unit:c.unit,sourceRefs:c.sourceRefs};
  if(c.kind==='ranking')return{kind:c.kind,title:c.title,message:c.message,dimension:c.dimension,field:c.field,items:c.items,unit:c.unit,sourceRefs:c.sourceRefs};
  if(c.kind==='correlation')return{kind:c.kind,title:c.title,message:c.message,xField:c.xField,yField:c.yField,r:c.r,sourceRefs:c.sourceRefs};
  if(c.kind==='table')return{kind:c.kind,title:c.title,message:c.message,columns:c.columns,rows:c.rows,sourceRefs:c.sourceRefs};
}

const roles=story();const slides=[];
for(let i=0;i<roles.length;i++){
  const role=roles[i];
  if(['action','flow'].includes(role)){
    slides.push({id:`s${String(i+1).padStart(2,'0')}`,role,status:'structural',primaryMessage:role==='action'?'次の実行内容は人が確定する':'プロセスはデータ証拠ではなく構造として提示する',evidence:[],visual:{type:'none',patternHint:role==='action'?'ED11-A':'ED07-A',supported:true},sourceRefs:[],confidence:.55,warnings:['source data alone does not justify action/process wording'],alternatives:[]});
    continue;
  }
  if(role==='kpi'){
    const rankedAll=candidates.map(c=>({c,score:score(c,role),visual:visualFor(c)})).filter(x=>['fact','delta'].includes(x.c.kind)).sort((a,b)=>b.score-a.score);
    const seenFacts=new Set(); const ranked=[];
    for(const x of rankedAll){const key=x.c.fact?.id||x.c.id;if(seenFacts.has(key))continue;seenFacts.add(key);ranked.push(x);if(ranked.length>=4)break;}
    ranked.forEach(x=>used.set(x.c.id,(used.get(x.c.id)||0)+1));
    if(ranked.length){
      slides.push({id:`s${String(i+1).padStart(2,'0')}`,role,status:'grounded',primaryMessage:`重要指標を ${ranked.length} 件で確認`,evidence:ranked.map(x=>evidenceObj(x.c)),visual:{type:'multiKpi',patternHint:'ED03-D',supported:true},sourceRefs:unique(ranked.flatMap(x=>x.c.sourceRefs)),confidence:mean(ranked.map(x=>x.c.quality)),warnings:ranked.some(x=>x.c.sample)?['sample source included']:[],alternatives:[]});continue;
    }
  }
  if(role==='opening'){
    const ranked=candidates.map(c=>({c,score:score(c,role),visual:visualFor(c)})).filter(x=>['fact','delta'].includes(x.c.kind)).sort((a,b)=>b.score-a.score).slice(0,2);
    ranked.forEach(x=>used.set(x.c.id,(used.get(x.c.id)||0)+1));
    slides.push({id:`s${String(i+1).padStart(2,'0')}`,role,status:ranked.length?'grounded':'structural',primaryMessage:brief.title||brief.topic||'Presentation',evidence:ranked.map(x=>evidenceObj(x.c)),visual:{type:ranked.length?'multiKpi':'none',patternHint:'ED01-A',supported:true},sourceRefs:unique(ranked.flatMap(x=>x.c.sourceRefs)),confidence:ranked.length?mean(ranked.map(x=>x.c.quality)):.5,warnings:[],alternatives:[]});continue;
  }
  const {selected,alternatives}=choose(role,false);
  if(!selected){
    slides.push({id:`s${String(i+1).padStart(2,'0')}`,role,status:'unresolved',primaryMessage:'source evidence not resolved',evidence:[],visual:{type:'none',patternHint:'ED02-A',supported:true},sourceRefs:[],confidence:.2,warnings:['No supported evidence candidate met the threshold.'],alternatives:alternatives.map(x=>({id:x.c.id,kind:x.c.kind,title:x.c.title,score:Number(x.score.toFixed(1))}))});
  }else{
    slides.push({id:`s${String(i+1).padStart(2,'0')}`,role,status:'grounded',primaryMessage:selected.c.message,evidence:[evidenceObj(selected.c)],visual:selected.visual,sourceRefs:selected.c.sourceRefs,confidence:selected.c.quality,warnings:selected.c.sample?['selected evidence is marked sample/illustrative']:[],alternatives:alternatives.map(x=>({id:x.c.id,kind:x.c.kind,title:x.c.title,score:Number(x.score.toFixed(1)),visual:x.visual.type,supported:x.visual.supported}))});
  }
}

const kpiSlide=slides.find(s=>s.role==='kpi'&&s.status==='grounded');
const dataSlide=slides.find(s=>s.role==='data'&&s.status==='grounded'&&s.visual.chart);
const compareSlide=slides.find(s=>s.role==='compare'&&s.status==='grounded');
const opening=slides.find(s=>s.role==='opening');
const metrics=(kpiSlide?.evidence||[]).filter(e=>['fact','delta'].includes(e.kind)).map(e=>({value:e.value,label:e.title}));
let current=null,ideal=null;
if(compareSlide?.evidence?.[0]?.kind==='delta'){
  const e=compareSlide.evidence[0];const cmp=e.comparison||{};
  current={label:'BEFORE',title:cmp.label||'Baseline',text:cmp.baselineDisplay??String(cmp.baselineValue??'')};
  ideal={label:'AFTER',title:e.title,text:e.value};
}
const diagnosisSlide=slides.find(s=>s.role==='diagnosis'&&s.status==='grounded');
const diagnosisEvidence=diagnosisSlide?.evidence?.[0];
const corrAlt=(diagnosisSlide?.alternatives||[]).find(a=>a.kind==='correlation');
const problem=diagnosisEvidence?{title:diagnosisEvidence.title,text:diagnosisEvidence.message}:brief.content?.problem;
const cause=corrAlt?{title:'関連指標',text:corrAlt.title}:brief.content?.cause;
const solution=diagnosisEvidence?{title:'次に確認すること',text:'重点対象の要因を確認し、修正理由・在庫・売変を分けて検証する'}:brief.content?.solution;
const evidence=slides.filter(s=>s.status==='grounded').flatMap(s=>s.evidence.slice(0,1).map(e=>({title:e.title,text:e.message,sourceRefs:e.sourceRefs})));
const briefPatch={content:{lead:opening?.evidence?.[0]?.message||brief.content?.lead||'',metrics,chart:dataSlide?.visual?.chart||brief.content?.chart,evidence,current:current||brief.content?.current,ideal:ideal||brief.content?.ideal,problem,cause,solution}};

const plan={version:'1.0',profile:'CONTENT-PLAN-v1',brief:{title:brief.title,topic:brief.topic,audience:brief.audience,objective:brief.objective,slideCount:brief.slideCount,dataEmphasis:brief.dataEmphasis},sourceSummary:{factCount:(bundle.facts||[]).length,tableCount:(bundle.tables||[]).length,candidateCount:candidates.length,sampleTables:(bundle.tables||[]).filter(t=>t.sample).map(t=>t.id)},slides,briefPatch,candidateCatalog:candidates.map(c=>({id:c.id,kind:c.kind,title:c.title,message:c.message,quality:c.quality,sourceRefs:c.sourceRefs,supported:visualFor(c).supported,visual:visualFor(c).type}))};
fs.writeFileSync(output,JSON.stringify(plan,null,2),'utf8');console.log(output);
