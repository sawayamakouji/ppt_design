#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const briefPath=process.argv[2],sourcePath=process.argv[3],output=process.argv[4]||'/mnt/data/causal-test-plan.v1.json';
if(!briefPath||!sourcePath){console.error('usage: node plan_causal_test.js brief.json source-bundle.json [output.json]');process.exit(2)}
const brief=JSON.parse(fs.readFileSync(briefPath,'utf8')),source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
if(brief.profile!=='BRIEF-v1'||source.profile!=='SOURCE-BUNDLE-v1')throw new Error('profiles must be BRIEF-v1 + SOURCE-BUNDLE-v1');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../causal/causal-test-planner-rules.v1.json'),'utf8'));
const th=rules.thresholds;
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:NaN;
const variance=a=>{if(a.length<2)return 0;const m=mean(a);return a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)};
const fmt=(v,d=2)=>Number.isFinite(v)?Number(v.toFixed(d)):null;
const uniq=a=>[...new Set(a)];
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const slope=(xs,ys)=>{if(xs.length<2)return NaN;const mx=mean(xs),my=mean(ys);let n=0,d=0;for(let i=0;i<xs.length;i++){n+=(xs[i]-mx)*(ys[i]-my);d+=(xs[i]-mx)**2}return d?n/d:NaN};
const abs=Math.abs;
const cq=brief.causalQuestion||{};
const names={
 treatment:cq.treatmentField||['treated','treatment','exposed','intervention'].find(n=>(source.tables||[]).some(t=>(t.columns||[]).some(c=>c.name===n))),
 outcome:cq.outcomeField||brief.analysisTarget?.metric,
 unit:cq.unitField||['store','member_id','customer_id','unit_id'].find(n=>(source.tables||[]).some(t=>(t.columns||[]).some(c=>c.name===n))),
 time:cq.timeField||['week_index','week','date','month','period'].find(n=>(source.tables||[]).some(t=>(t.columns||[]).some(c=>c.name===n))),
 post:cq.postField||['post','after','is_post'].find(n=>(source.tables||[]).some(t=>(t.columns||[]).some(c=>c.name===n)))
};
const candidateTables=(source.tables||[]).filter(t=>[names.treatment,names.outcome,names.unit,names.time].filter(Boolean).every(n=>(t.columns||[]).some(c=>c.name===n)));
const table=candidateTables.sort((a,b)=>(b.rows?.length||0)-(a.rows?.length||0))[0];
const warnings=[];
if(!cq.hypothesis)warnings.push('causalQuestion.hypothesis is missing; do not turn an association into a treatment claim automatically.');
if(!table)warnings.push('No single table contains the minimum unit/time/treatment/outcome structure.');
const rows=table?.rows||[];
const unitField=names.unit,timeField=names.time,treatField=names.treatment,outcomeField=names.outcome,postField=names.post;
const units=unitField?uniq(rows.map(r=>String(r[unitField]))):[];
const periods=timeField?uniq(rows.map(r=>r[timeField])).sort((a,b)=>Number(a)-Number(b)):[];
const unitTreat=new Map();
for(const r of rows){if(unitField&&treatField)unitTreat.set(String(r[unitField]),Number(r[treatField])?1:0)}
const treatedUnits=[...unitTreat].filter(([,v])=>v===1).map(([k])=>k),controlUnits=[...unitTreat].filter(([,v])=>v===0).map(([k])=>k);
const hasPost=!!postField&&rows.some(r=>Number(r[postField])===1)&&rows.some(r=>Number(r[postField])===0);
const prePeriods=hasPost?uniq(rows.filter(r=>Number(r[postField])===0).map(r=>r[timeField])).length:0;
const postPeriods=hasPost?uniq(rows.filter(r=>Number(r[postField])===1).map(r=>r[timeField])).length:0;
const expected=units.length*periods.length;const completeness=expected?rows.length/expected:0;
const covariates=(cq.covariates||[]).filter(c=>table?.columns?.some(x=>x.name===c));
function unitPeriodMean(unit,post,field){const a=rows.filter(r=>String(r[unitField])===unit&&Number(r[postField])===post).map(r=>num(r[field])).filter(v=>v!=null);return mean(a)}
function didPreview(){
 if(!hasPost||!treatedUnits.length||!controlUnits.length||!outcomeField)return null;
 const tc=treatedUnits.map(u=>unitPeriodMean(u,1,outcomeField)-unitPeriodMean(u,0,outcomeField)).filter(Number.isFinite);
 const cc=controlUnits.map(u=>unitPeriodMean(u,1,outcomeField)-unitPeriodMean(u,0,outcomeField)).filter(Number.isFinite);
 if(!tc.length||!cc.length)return null;const effect=mean(tc)-mean(cc);const se=Math.sqrt(variance(tc)/tc.length+variance(cc)/cc.length);const ci=[effect-1.96*se,effect+1.96*se];
 return{kind:'exploratory_did_preview',estimand:cq.estimand||'ATT',estimate:fmt(effect,3),standardError:fmt(se,3),ci95:ci.map(v=>fmt(v,3)),treatedMeanChange:fmt(mean(tc),3),controlMeanChange:fmt(mean(cc),3),nTreated:tc.length,nControl:cc.length,status:'exploratory_only'};
}
function pretrend(){
 if(!hasPost||prePeriods<3||!treatedUnits.length||!controlUnits.length)return null;
 const pre=rows.filter(r=>Number(r[postField])===0);
 const ps=uniq(pre.map(r=>r[timeField])).sort((a,b)=>Number(a)-Number(b));
 const xs=ps.map((_,i)=>i+1),tmeans=[],cmeans=[];
 for(const p of ps){
   tmeans.push(mean(pre.filter(r=>r[timeField]===p&&Number(r[treatField])===1).map(r=>num(r[outcomeField])).filter(v=>v!=null)));
   cmeans.push(mean(pre.filter(r=>r[timeField]===p&&Number(r[treatField])===0).map(r=>num(r[outcomeField])).filter(v=>v!=null)));
 }
 const st=slope(xs,tmeans),sc=slope(xs,cmeans),diff=st-sc,a=abs(diff);const status=a<=th.goodPretrendSlopeDiff?'good':a<=th.cautionPretrendSlopeDiff?'caution':'poor';
 return{treatedSlope:fmt(st,4),controlSlope:fmt(sc,4),slopeDiff:fmt(diff,4),absSlopeDiff:fmt(a,4),periods:ps.length,status};
}
function baselineBalance(){
 const out=[];
 for(const c of covariates){
   const tv=[],cv=[];
   for(const u of units){const vals=rows.filter(r=>String(r[unitField])===u&&(!hasPost||Number(r[postField])===0)).map(r=>num(r[c])).filter(v=>v!=null);if(!vals.length)continue;(unitTreat.get(u)?tv:cv).push(mean(vals))}
   if(!tv.length||!cv.length)continue;const pooled=Math.sqrt((variance(tv)+variance(cv))/2)||1e-9;const smd=(mean(tv)-mean(cv))/pooled;out.push({field:c,treatedMean:fmt(mean(tv),3),controlMean:fmt(mean(cv),3),smd:fmt(smd,3),absSmd:fmt(abs(smd),3),status:abs(smd)<=th.goodAbsSmd?'good':abs(smd)<=th.cautionAbsSmd?'caution':'poor'});
 }
 return out;
}
const preview=didPreview(),pt=pretrend(),balance=baselineBalance();const maxSmd=balance.length?Math.max(...balance.map(x=>x.absSmd)):null;
const outcomeUnit=table?.columns?.find(c=>c.name===outcomeField)?.unit||'';const effectUnit=outcomeUnit==='%'?'pt':outcomeUnit;
const hasPanel=!!table&&units.length>0&&periods.length>1&&completeness>=th.minimumPanelCompleteness;
const twoArms=treatedUnits.length>=th.minUnitsPerArm&&controlUnits.length>=th.minUnitsPerArm;
const didReady=hasPanel&&twoArms&&hasPost&&prePeriods>=th.minPrePeriodsDid&&postPeriods>=th.minPostPeriodsDid;
const randomized=!!cq.randomized,hasRd=!!cq.runningVariable&&cq.cutoff!=null,hasIv=!!cq.instrumentField;
let primary,secondary=[],rejected=[];
if(randomized){primary={method:'randomized_experiment',label:'A/B・RCT',suitability:0.99,estimand:cq.estimand||'ATE',reason:'割付がランダムと宣言されているため、群間比較を第一候補にする。'};secondary.push({method:'regression_adjustment',label:'回帰調整',suitability:.85,reason:'精度改善のため事前共変量を調整する。'});}
else if(hasRd){primary={method:'regression_discontinuity',label:'RD',suitability:.95,estimand:'cutoff-local effect',reason:'処置割付の閾値とrunning variableが明示されている。'};}
else if(hasIv){primary={method:'instrumental_variables',label:'IV',suitability:.90,estimand:'LATE',reason:'操作変数候補が明示されている。排除制約は別途検証が必要。'};}
else if(didReady){
  const ptPenalty=pt?.status==='poor'?.25:pt?.status==='caution'?.10:0;const balPenalty=maxSmd==null?0:maxSmd>th.cautionAbsSmd?.12:maxSmd>th.goodAbsSmd?.06:0;
  primary={method:'difference_in_differences',label:'DiD',suitability:fmt(Math.max(.55,.94-ptPenalty-balPenalty),2),estimand:cq.estimand||'ATT',reason:`処置群${treatedUnits.length}、対照群${controlUnits.length}、事前${prePeriods}期・事後${postPeriods}期のパネルがある。`};
  secondary.push({method:'event_study',label:'Event Study',suitability:prePeriods>=5?.90:.76,estimand:'dynamic ATT',reason:'導入前leadと導入後lagを並べ、平行トレンドと動学効果を可視化する。'});
  if(covariates.length>=2)secondary.push({method:'aipw',label:'AIPW',suitability:.82,estimand:cq.estimand||'ATT',reason:'共変量があり、DiDの頑健性確認として二重ロバスト推定を設計できる。'});
  secondary.push({method:'ipw',label:'IPW',suitability:.70,estimand:cq.estimand||'ATT',reason:'傾向スコアの重み付けで観測共変量のバランスを補正する感度分析。'});
  rejected.push({method:'simple_pre_post',label:'単純前後比較',reason:'共通時点ショックと自然トレンドを除けないため主分析にしない。'});
  rejected.push({method:'matching',label:'PSM',reason:'マッチング単独を既定にせず、情報を捨てにくい重み付け/AIPWを優先する。'});
}else if(hasPanel&&treatedUnits.length===units.length&&prePeriods>=th.minPrePeriodsIts){primary={method:'interrupted_time_series',label:'Interrupted Time Series',suitability:.72,estimand:'level/slope change',reason:'全対象が処置済みで標準DiDの対照群がない。長い事前系列を使う。'};warnings.push('All units are treated: standard DiD is not identified without a comparison series.');}
else if(treatedUnits.length&&controlUnits.length&&covariates.length>=2){primary={method:'aipw',label:'AIPW',suitability:.70,estimand:cq.estimand||'ATT',reason:'処置・対照と共変量はあるが、十分な事前パネルがないため条件付き交換可能性に依存する。'};secondary.push({method:'ipw',label:'IPW',suitability:.62,reason:'重み付け感度分析。'});rejected.push({method:'difference_in_differences',label:'DiD',reason:'十分な事前/事後パネルが不足している。'});}
else{primary={method:'unresolved',label:'設計未確定',suitability:.20,estimand:cq.estimand||'ATT',reason:'処置・対照・時間・アウトカムのいずれかが不足している。'};warnings.push('Causal design is unresolved; collect or declare treatment, comparison, timing, and outcome fields.');}
const diagnostics=[];
diagnostics.push({id:'panel_completeness',label:'パネル完全性',value:fmt(completeness*100,1),unit:'%',status:completeness>=th.minimumPanelCompleteness?'good':'caution',message:`${rows.length}行 / 期待${expected||0}行`});
if(pt)diagnostics.push({id:'parallel_pretrend',label:'事前トレンド差',value:pt.absSlopeDiff,unit:`${table?.columns?.find(c=>c.name===outcomeField)?.unit||''}/期`,status:pt.status,message:`treated slope ${pt.treatedSlope}, control slope ${pt.controlSlope}`});
if(maxSmd!=null)diagnostics.push({id:'baseline_balance',label:'最大 |SMD|',value:fmt(maxSmd,3),unit:'',status:maxSmd<=th.goodAbsSmd?'good':maxSmd<=th.cautionAbsSmd?'caution':'poor',message:balance.map(x=>`${x.field}=${x.smd}`).join(' / ')});
if(preview)diagnostics.push({id:'did_preview',label:'DiDプレビュー',value:preview.estimate,unit:effectUnit,status:'exploratory',message:`95%CI ${preview.ci95[0]} ～ ${preview.ci95[1]}（仮定未確定の探索値）`});
const assumptions=[];
if(primary.method==='difference_in_differences'||secondary.some(x=>x.method==='event_study')){
 assumptions.push({id:'parallel_trends',label:'平行トレンド',status:pt?.status||'unchecked',test:'導入前の群×時間傾き、Event Studyのlead係数',failureAction:'対照群の見直し、群別トレンド調整、別設計へ切替'});
 assumptions.push({id:'no_anticipation',label:'先取り行動なし',status:'unchecked',test:'導入直前のlead係数と運用ログ',failureAction:'washout期間を設定'});
 assumptions.push({id:'stable_composition',label:'群構成が安定',status:'unchecked',test:'店舗/対象SKUの出入り、欠測率、定義変更',failureAction:'固定コホートまたは構成調整'});
 assumptions.push({id:'no_spillover',label:'干渉・波及が限定的',status:'unchecked',test:'近隣店舗・共通在庫・共通発注ルールへの波及確認',failureAction:'クラスター単位へ分析単位を上げる'});
}
if(secondary.some(x=>['aipw','ipw','matching'].includes(x.method))||primary.method==='aipw')assumptions.push({id:'overlap',label:'Common Support / Overlap',status:'unchecked',test:'propensity score分布、極端重み、ESS',failureAction:'対象範囲を狭める・trim・別estimandへ変更'});
const executionPlan=[
 {step:1,title:'分析母集団を固定',detail:`unit=${unitField||'未確定'}、outcome=${outcomeField||'未確定'}、estimand=${cq.estimand||'ATT'}`},
 {step:2,title:'識別前提を検証',detail:'平行トレンド、構成変化、先取り、干渉、データ定義変更をチェック'},
 {step:3,title:'主分析を実行',detail:primary.method==='difference_in_differences'?'unit固定効果 + time固定効果 / cluster-robust SEを基本形にする':primary.label},
 {step:4,title:'頑健性を確認',detail:secondary.map(x=>x.label).join(' / ')||'placebo・仕様変更'},
 {step:5,title:'判定と資料化',detail:'点推定だけでなくCI・仮定・感度分析・除外条件を同時に報告'}
];
const decisionRules=[
 {status:'GREEN',condition:`事前トレンド良好、|SMD|≤${th.cautionAbsSmd}、重みのoverlap良好、主要仕様で符号と大きさが安定`,action:'効果推定を意思決定材料として提示'},
 {status:'YELLOW',condition:'一部仮定が弱い / 仕様で推定が動く',action:'「示唆」に留め、追加データ・別対照・感度分析を要求'},
 {status:'RED',condition:'平行トレンド崩壊、overlap不足、処置定義不明、重大な同時施策',action:'因果効果を主張しない'}
];
const out={version:'1.0',profile:'CAUSAL-TEST-PLAN-v1',hypothesis:{statement:cq.hypothesis||`${cq.treatment||treatField||'処置'} が ${cq.outcome||outcomeField||'アウトカム'} に影響する`,treatment:cq.treatment||treatField||'',treatmentField:treatField||'',outcome:cq.outcome||outcomeField||'',outcomeField:outcomeField||'',estimand:cq.estimand||'ATT'},dataReadiness:{tableId:table?.id||null,unitField,timeField,treatmentField:treatField,postField,outcomeField,covariates,nRows:rows.length,nUnits:units.length,nPeriods:periods.length,nTreated:treatedUnits.length,nControl:controlUnits.length,nPrePeriods:prePeriods,nPostPeriods:postPeriods,panelCompleteness:fmt(completeness,3),baselineBalance:balance,pretrend:pt,sample:!!source.metadata?.sample},recommendation:{primary,secondary,rejected},diagnostics,assumptions,executionPlan,decisionRules,effectPreview:preview?{...preview,unit:effectUnit}:null,warnings,sourceRefs:table?[table.provenance?.ref||table.id]:[]};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
