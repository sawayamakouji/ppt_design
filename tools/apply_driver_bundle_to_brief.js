#!/usr/bin/env node
const fs=require('fs');
const briefPath=process.argv[2], driverPath=process.argv[3], output=process.argv[4]||'/mnt/data/brief.with-drivers.v1.json';
if(!briefPath||!driverPath){console.error('usage: node apply_driver_bundle_to_brief.js brief.json driver.json [output.json]');process.exit(2)}
const b=JSON.parse(fs.readFileSync(briefPath,'utf8')),d=JSON.parse(fs.readFileSync(driverPath,'utf8'));
if(b.profile!=='BRIEF-v1'||d.profile!=='DRIVER-BUNDLE-v1')throw new Error('invalid profile');
const patch=d.briefPatch||{};
const drivers=d.drivers||[];
const pick=(type, pred=()=>true)=>drivers.find(x=>x.type===type&&pred(x));
const contribArea=pick('hierarchical_contribution',x=>x.dimension==='area')||pick('hierarchical_contribution');
const contribStore=pick('hierarchical_contribution',x=>x.dimension==='store');
const conc=pick('change_concentration');
const assoc=pick('delta_association',x=>x.driverMetric==='inventory_days')||pick('delta_association');
const target=d.target||{};
const f=(v,dec=1)=>Number.isFinite(Number(v))?Number(v).toFixed(dec):String(v??'');
const sign=v=>Number(v)>0?'+':'';
const contentScaffold={
  problem:{label:'OBSERVED',title:`${target.label||'対象指標'} ${sign(target.delta)}${f(target.delta)}${target.unit||''}`,text:`${target.baseline||'BASE'} → ${target.current||'CURRENT'}`},
  cause:contribArea?{label:'CONTRIBUTION',title:`${contribArea.evidence?.item?.key||'重点'} ${f((contribArea.share||0)*100)}%`,text:`寄与額 ${sign(contribArea.effect)}${f(contribArea.effect)}${target.unit||''}。会計的寄与であり因果を意味しない。`}:undefined,
  solution:{label:'NEXT CHECK',title:contribStore?`${contribStore.evidence?.item?.key||'店舗'}へ掘る`:'重点対象を掘る',text:[contribStore?`${sign(contribStore.effect)}${f(contribStore.effect)}${target.unit||''} / ${f((contribStore.share||0)*100)}%`:null,conc?`上位3カテゴリ ${f((conc.share||0)*100)}%`:null].filter(Boolean).join(' ・ ')},
  current:{label:target.baseline||'BASE',title:`${target.label||'対象指標'}`,text:`${f(target.baselineValue)}${target.unit||''}`},
  ideal:{label:target.current||'CURRENT',title:`${target.label||'対象指標'}`,text:`${f(target.currentValue)}${target.unit||''}（${sign(target.delta)}${f(target.delta)}）`},
  compareTitle:`${target.label||'対象指標'}を期間比較`,
  gap:`${sign(target.delta)}${f(target.delta)}${target.unit||''}`,
  actions:[
    contribArea?{what:`${contribArea.evidence?.item?.key||'重点エリア'}を確認`,title:`${contribArea.evidence?.item?.key||'重点エリア'}を確認`,who:'分析担当',when:'STEP 1',text:`寄与 ${f((contribArea.share||0)*100)}% を店舗へ分解`} : null,
    contribStore?{what:`${contribStore.evidence?.item?.key||'重点店舗'}をカテゴリへ分解`,title:`${contribStore.evidence?.item?.key||'重点店舗'}をカテゴリへ分解`,who:'分析担当',when:'STEP 2',text:`寄与額 ${sign(contribStore.effect)}${f(contribStore.effect)}${target.unit||''}`} : null,
    assoc?{what:'関連指標を追加検証',title:'関連指標を追加検証',who:'分析担当',when:'STEP 3',text:`相関 ${assoc.evidence?.r!=null?'r='+f(assoc.evidence.r,2):''}。因果は未確認`} : null
  ].filter(Boolean)
};
const out={...b,...patch,content:{...(b.content||{}),...(patch.content||{}),...contentScaffold},driverExplorer:{profile:d.profile,target:d.target,topDrivers:drivers.slice(0,8).map(x=>({id:x.id,type:x.type,title:x.title,message:x.message,score:x.score,confidence:x.confidence,causalStatus:x.causalStatus,sourceRefs:x.sourceRefs,warnings:x.warnings}))}};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
