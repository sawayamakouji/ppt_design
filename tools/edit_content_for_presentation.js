#!/usr/bin/env node
const fs=require('fs');
const path=require('path');

const briefPath=process.argv[2];
const planPath=process.argv[3];
const driverPath=process.argv[4] && !process.argv[4].endsWith('.out.json') ? process.argv[4] : null;
const output=process.argv[5] || (process.argv[4] && process.argv[4].endsWith('.out.json') ? process.argv[4] : '/mnt/data/presentation-plan.v1.json');
if(!briefPath||!planPath){
  console.error('usage: node edit_content_for_presentation.js brief.json content-plan.json [driver-bundle.json] [presentation-plan.json]');
  process.exit(2);
}
const brief=JSON.parse(fs.readFileSync(briefPath,'utf8'));
const plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
const driver=driverPath?JSON.parse(fs.readFileSync(driverPath,'utf8')):null;
if(brief.profile!=='BRIEF-v1')throw new Error('brief profile must be BRIEF-v1');
if(plan.profile!=='CONTENT-PLAN-v1')throw new Error('content plan profile must be CONTENT-PLAN-v1');
if(driver && driver.profile!=='DRIVER-BUNDLE-v1')throw new Error('driver profile must be DRIVER-BUNDLE-v1');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../presentation/presentation-editor-rules.v1.json'),'utf8'));

const uniq=a=>[...new Set((a||[]).filter(Boolean))];
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const fmt=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toFixed(d):String(v??'');
const pct=(v,d=1)=>`${fmt(Number(v)*100,d)}%`;
const compact=(s,n=76)=>{s=String(s??'').replace(/\s+/g,' ').trim();return s.length<=n?s:s.slice(0,Math.max(0,n-1)).trim()+'…'};
const signed=(v,unit='',d=1)=>`${Number(v)>=0?'+':''}${fmt(v,d)}${unit}`;
const scalar=(s)=>{s=String(s??'').trim();return s.length<=rules.kpi.valueMaxChars&&!/[。！？!?]|です|ます/.test(s)};
const safeLabel=(s)=>compact(String(s??'').replace(/\s*の\s*/g,'の'),rules.kpi.labelMaxChars);
const hasIntersection=(a,b)=>{const B=new Set(b||[]);return (a||[]).some(x=>B.has(x))};

function makeSuppressed(anchorMetric,anchorRefs){
  const out=[];
  for(const s of plan.slides||[]){
    for(const e of s.evidence||[]){
      if(!anchorMetric||!e)continue;
      const sameMetric=(e.field===anchorMetric)||String(e.title||'').includes(driver?.target?.label||'__NO__');
      if(sameMetric && anchorRefs?.length && e.sourceRefs?.length && !hasIntersection(anchorRefs,e.sourceRefs)){
        out.push({slideId:s.id,title:e.title,sourceRefs:e.sourceRefs,reason:'same target metric comes from a different source/scope; comparability is not declared'});
      }
    }
  }
  return out;
}

function genericPlan(){
  const seen=new Set();
  const slides=[];
  for(const s of plan.slides||[]){
    const ev=(s.evidence||[]).find(e=>!seen.has(JSON.stringify([e.title,e.value,e.message])));
    if(ev)seen.add(JSON.stringify([ev.title,ev.value,ev.message]));
    slides.push({
      id:s.id,storyStep:'generic',question:`${s.role}で何を伝えるか`,
      claim:compact(s.primaryMessage||ev?.message||brief.title,52),
      payload:{type:'generic',role:s.role,evidence:ev||null,visual:s.visual||null},
      sourceRefs:uniq(ev?.sourceRefs||s.sourceRefs),causalStatus:'descriptive',confidence:s.confidence??.6,notes:s.warnings||[]
    });
  }
  return {version:'1.0',profile:'PRESENTATION-PLAN-v1',deck:{title:brief.title||brief.topic||'Presentation',topic:brief.topic||'',audience:brief.audience||'',objective:brief.objective||'',anchorMetric:'',anchorSourceRefs:[]},slides,suppressedEvidence:[],quality:{mode:'generic',warnings:['No DRIVER-BUNDLE-v1 supplied; editorial compression only.']}};
}

function driverPlan(){
  const target=driver.target||{};
  const drivers=driver.drivers||[];
  const anchorRefs=uniq(target.sourceRefs||[]);
  const label=target.label||target.metric||'対象指標';
  const unit=target.unit||'';
  const delta=num(target.delta)??0;
  const base=num(target.baselineValue),cur=num(target.currentValue);
  const contrib=drivers.filter(d=>d.type==='hierarchical_contribution').sort((a,b)=>(a.evidence?.level??99)-(b.evidence?.level??99)||Math.abs(b.effect||0)-Math.abs(a.effect||0));
  const byDim=(dim)=>contrib.filter(d=>d.dimension===dim).sort((a,b)=>Math.abs(b.effect||0)-Math.abs(a.effect||0))[0];
  const area=byDim('area'),store=byDim('store'),dept=byDim('department'),cat=byDim('category');
  const concentration=drivers.filter(d=>d.type==='change_concentration').sort((a,b)=>(b.score||0)-(a.score||0))[0];
  const associations=drivers.filter(d=>d.type==='delta_association').sort((a,b)=>Math.abs(b.effect||0)-Math.abs(a.effect||0));
  const stability=drivers.filter(d=>d.type==='subgroup_stability').sort((a,b)=>(b.effect||0)-(a.effect||0));
  const a1=associations[0],a2=associations[1];
  const stabFor=(a)=>stability.find(s=>s.driverMetric===a?.driverMetric)||stability[0];
  const st=stabFor(a1);
  const topAreaKey=area?.evidence?.item?.key||area?.title?.match(/=(.+?)\s/)?.[1]||'重点エリア';
  const areaShare=area?.share!=null?pct(area.share):'—';
  const openingClaim=`${label}は${signed(delta,unit)}。変化の${areaShare}は${topAreaKey}に集中`;
  const topItems=(concentration?.evidence?.items||[]).slice().sort((x,y)=>Math.abs(y.delta||0)-Math.abs(x.delta||0)).slice(0,6).map(x=>({label:x.key,value:Number(x.delta||0)}));
  const hierarchy=[area,store,dept,cat].filter(Boolean).map((d,i)=>({
    title:d.evidence?.item?.key||safeLabel(d.title),
    text:`${signed(d.effect||0,unit)} / ${pct(d.share||0)}`,
    role:['AREA','STORE','DEPT','CATEGORY'][i]||String(i+1),
    step:`寄与 ${signed(d.effect||0,unit)}`,
    output:`同階層 ${pct(d.share||0)}`,
    sourceRefs:d.sourceRefs||[]
  }));
  const kpis=[
    {kind:'target_delta',value:signed(delta,unit),label:`${label}の変化`,note:base!=null&&cur!=null?`${fmt(base,1)} → ${fmt(cur,1)}${unit}`:''},
    area?{kind:'contribution',value:signed(area.effect||0,unit),label:`${topAreaKey}の寄与`,note:`同階層 ${areaShare}`} : null,
    concentration?{kind:'concentration',value:pct(concentration.share??concentration.effect??0),label:'上位3カテゴリ集中',note:'絶対変化量ベース'}:null,
    a1?{kind:'association',value:`r=${fmt(a1.effect,2)}`,label:`${metricLabel(a1.driverMetric)}との関連`,note:`n=${a1.evidence?.pairs?.length||'—'} / 因果未確認`}:null
  ].filter(Boolean).slice(0,4);
  function metricLabel(m){return ({inventory_days:'在庫日数',correction_rate:'発注修正率',sales_amount:'売上金額',avg_basket:'平均買上額',traffic:'客数指数'})[m]||m||'関連指標'}
  const assocItems=[a1,a2].filter(Boolean).map(a=>({title:metricLabel(a.driverMetric),text:`r=${fmt(a.effect,2)} / n=${a.evidence?.pairs?.length||'—'} / 関連のみ`,value:a.effect}));
  if(st)assocItems.push({title:'エリア別安定性',text:`${st.evidence?.strata?.filter(x=>Math.sign(x.r)===Math.sign(st.evidence?.overall)).length||0}/${st.evidence?.strata?.length||0}で同符号 / 追加検証`,value:st.effect});
  while(assocItems.length<3)assocItems.push({title:'追加検証',text:'因果は未確認。業務イベントと設定差を確認',value:0});
  const actions=[
    {what:`${topAreaKey}を店舗へ分解`,title:`${topAreaKey}を店舗へ分解`,who:'分析',when:'STEP 1',text:store?`${store.evidence?.item?.key||'重点店'} ${signed(store.effect||0,unit)}`:'重点店を特定'},
    {what:'カテゴリ寄与と設定差を照合',title:'カテゴリ寄与と設定差を照合',who:'分析＋現場',when:'STEP 2',text:topItems.slice(0,3).map(x=>x.label).join(' / ')||'上位カテゴリを確認'},
    {what:'関連指標を検証設計へ',title:'関連指標を検証設計へ',who:'分析',when:'STEP 3',text:a1?`${metricLabel(a1.driverMetric)} r=${fmt(a1.effect,2)}。因果は未確認`:'対照・前後・イベント照合'}
  ];
  const suppressed=makeSuppressed(target.metric,anchorRefs);
  const slides=[
    {id:'s01',storyStep:'opening',question:'最初に何が起きたと理解すべきか',claim:compact(openingClaim,52),payload:{type:'opening',title:compact(openingClaim,46),lead:`${target.baseline} → ${target.current} / 会計的寄与を分解`,metric:signed(delta,unit),metricLabel:`${label}の変化`,secondary:`${topAreaKey} ${areaShare}`},sourceRefs:anchorRefs,causalStatus:'descriptive+accounting_decomposition',confidence:Math.min(1,(area?.confidence||.6)*.9+.1),notes:['因果ではなく変化と寄与を要約']},
    {id:'s02',storyStep:'kpi',question:'この変化を4つの数字でどう捉えるか',claim:'変化量・地域寄与・カテゴリ集中・関連指標を分けて見る',payload:{type:'kpi',title:'変化の全体像を4つの数字で押さえる',metrics:kpis},sourceRefs:uniq([...(anchorRefs||[]),...(area?.sourceRefs||[]),...(concentration?.sourceRefs||[]),...(a1?.sourceRefs||[])]),causalStatus:'mixed_noncausal',confidence:.74,notes:['数値を主役にし、方法論は注記へ']},
    {id:'s03',storyStep:'hierarchy',question:'変化はどの階層に集中しているか',claim:hierarchy.length?`${hierarchy.map(x=>x.title).join(' → ')}へ掘るほど重点箇所が絞れる`:'寄与階層を確認する',payload:{type:'hierarchy',title:'変化を「どこ」で掘る',stages:hierarchy},sourceRefs:uniq(hierarchy.flatMap(x=>x.sourceRefs||[])),causalStatus:'accounting_decomposition',confidence:Math.min(...contrib.slice(0,4).map(x=>x.confidence||.6),.96),notes:['寄与率は各親階層に対する割合']},
    {id:'s04',storyStep:'breakdown',question:'変化を最も押し上げたカテゴリはどれか',claim:topItems.length?`${topItems.slice(0,3).map(x=>x.label).join('・')}が変化の中心`:'カテゴリ別変化を確認する',payload:{type:'breakdown',title:'変化を「何」で分ける',items:topItems,unit},sourceRefs:concentration?.sourceRefs||anchorRefs,causalStatus:'accounting_decomposition',confidence:concentration?.confidence||.7,notes:['絶対変化量の集中。原因を意味しない']},
    {id:'s05',storyStep:'association',question:'何が一緒に動いているか',claim:'関連は強い。ただし因果はまだ未確認',payload:{type:'association',title:'関連は強い。ただし因果は未確認',items:assocItems.slice(0,3),footnote:'相関は候補抽出。施策効果や原因の断定には使わない。'},sourceRefs:uniq([...(a1?.sourceRefs||[]),...(a2?.sourceRefs||[]),...(st?.sourceRefs||[])]),causalStatus:'association_only_requires_validation',confidence:Math.min(a1?.confidence||.6,a2?.confidence||.6,st?.confidence||.6),notes:['nが小さい場合は探索的扱い']},
    {id:'s06',storyStep:'action',question:'次に何を確かめれば仮説が前進するか',claim:'寄与分解 → 業務事実照合 → 因果検証の順で確認する',payload:{type:'action',title:'次は「原因を断定」ではなく「仮説を検証」する',actions},sourceRefs:anchorRefs,causalStatus:'validation_plan',confidence:.65,notes:['統計的関連から直接アクション効果を断定しない']}
  ];
  const quality={
    mode:'driver-aware',anchorMetric:target.metric,anchorSourceRefs:anchorRefs,
    suppressedCount:suppressed.length,
    checks:{scalarKpi:kpis.every(k=>scalar(k.value)),storyStepsUnique:new Set(slides.map(s=>s.storyStep)).size===slides.length,forbiddenCausalTerms:slides.every(s=>!/(原因|影響した|効果が出た|せいで)/.test(s.claim))}
  };
  return {version:'1.0',profile:'PRESENTATION-PLAN-v1',deck:{title:brief.title||brief.topic||'Presentation',topic:brief.topic||'',audience:brief.audience||'',objective:brief.objective||'',anchorMetric:target.metric||'',anchorSourceRefs:anchorRefs,baseline:target.baseline,current:target.current},slides,suppressedEvidence:suppressed,quality};
}

const out=driver?driverPlan():genericPlan();
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');
console.log(output);
