#!/usr/bin/env node
const fs=require('fs');
const sourcePath=process.argv[2], driverPath=process.argv[3], output=process.argv[4]||'/mnt/data/source-bundle.with-drivers.v1.json';
if(!sourcePath||!driverPath){console.error('usage: node enrich_source_bundle_with_drivers.js source.json driver.json [output.json]');process.exit(2)}
const s=JSON.parse(fs.readFileSync(sourcePath,'utf8')),d=JSON.parse(fs.readFileSync(driverPath,'utf8'));
if(s.profile!=='SOURCE-BUNDLE-v1'||d.profile!=='DRIVER-BUNDLE-v1')throw new Error('invalid profile');
const fmt=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toFixed(d):String(v??'');
const sign=v=>Number(v)>0?'+':'';
const metricLabel={inventory_days:'在庫日数',correction_rate:'発注修正率',sales_amount:'売上金額',avg_basket:'平均買上額'};
function compactDriverFact(x){
  const base={id:`driver:${x.id}`,sourceRefs:x.sourceRefs||[],confidence:x.confidence,tags:['driver',x.type,x.causalStatus],detail:x.message,presentationEligible:true,causalStatus:x.causalStatus};
  if(x.type==='hierarchical_contribution'){
    const key=x.evidence?.item?.key||x.path?.[x.path.length-1]?.value||x.dimension||'対象';
    return {...base,label:`${key}の寄与`,value:Number(x.effect),unit:d.target?.unit||'',displayValue:`${sign(x.effect)}${fmt(x.effect,1)}${d.target?.unit||''}`,comparison:{label:'同階層寄与率',baselineValue:null,deltaValue:Number(x.share)*100,deltaDisplay:`${fmt(Number(x.share)*100,1)}%`},presentationKind:'contribution'};
  }
  if(x.type==='change_concentration'){
    const topN=x.evidence?.top3?.length||3;
    return {...base,label:`上位${topN}カテゴリ集中`,value:Number(x.share)*100,unit:'%',displayValue:`${fmt(Number(x.share)*100,1)}%`,presentationKind:'concentration'};
  }
  if(x.type==='delta_association'||x.type==='level_association'){
    const r=Number(x.evidence?.r ?? x.effect);
    const metric=metricLabel[x.driverMetric]||(x.driverMetric||'指標').replace(/_/g,' ');
    return {...base,label:`${metric}との関連`,value:r,displayValue:`r=${fmt(r,2)}`,comparison:{label:'標本数',baselineValue:null,deltaValue:x.n,deltaDisplay:`n=${x.n}`},presentationKind:'association'};
  }
  if(x.type==='segment_gap'){
    return {...base,label:`${x.dimension||'segment'}差`,value:Number(x.effect),unit:d.target?.unit||'',displayValue:`${fmt(Number(x.effect),1)}${d.target?.unit||''}`,presentationKind:'gap'};
  }
  if(x.type==='subgroup_stability'){
    const stable=Number(x.evidence?.stability ?? x.effect);
    return {...base,label:`${metricLabel[x.driverMetric]||(x.driverMetric||'指標').replace(/_/g,' ')} 安定性`,value:stable*100,unit:'%',displayValue:`${fmt(stable*100,0)}%`,comparison:{label:'サブグループ',baselineValue:null,deltaValue:x.n,deltaDisplay:`${x.n}群`},presentationKind:'stability'};
  }
  return {...base,label:x.title,value:Number.isFinite(Number(x.effect))?Number(x.effect):Number(x.score),displayValue:Number.isFinite(Number(x.effect))?fmt(Number(x.effect),1):fmt(Number(x.score),0),presentationKind:'driver'};
}
const targetFact={id:'driver:target_delta',label:`${d.target?.label||'対象指標'}の変化`,value:Number(d.target?.delta),unit:d.target?.unit||'',displayValue:`${sign(d.target?.delta)}${fmt(d.target?.delta,1)}${d.target?.unit||''}`,comparison:{label:`${d.target?.baseline||'BASE'} → ${d.target?.current||'CURRENT'}`,baselineValue:d.target?.baselineValue,baselineDisplay:`${fmt(d.target?.baselineValue,1)}${d.target?.unit||''}`,deltaValue:d.target?.delta,deltaDisplay:`${sign(d.target?.delta)}${fmt(d.target?.delta,1)}${d.target?.unit||''}`},tags:['driver','target_delta',d.target?.metric||''],sourceRefs:d.target?.sourceRefs||[],confidence:1,detail:`${fmt(d.target?.baselineValue,1)} → ${fmt(d.target?.currentValue,1)}${d.target?.unit||''}`,presentationEligible:true,presentationKind:'target_delta',currentValue:d.target?.currentValue,currentDisplay:`${fmt(d.target?.currentValue,1)}${d.target?.unit||''}`};
const derived=[targetFact,...(d.drivers||[]).slice(0,12).map(compactDriverFact)];
const rows=(d.drivers||[]).slice(0,20).map(x=>({driver_id:x.id,type:x.type,title:x.title,score:x.score,confidence:x.confidence,causal_status:x.causalStatus,message:x.message,dimension:x.dimension||'',driver_metric:x.driverMetric||'',share:x.share??null,effect:x.effect??null}));
const out={...s,metadata:{...(s.metadata||{}),driverBundleProfile:d.profile,driverTarget:d.target},facts:[...(s.facts||[]),...derived],tables:[...(s.tables||[]),{id:'derived_driver_candidates',title:'Driver Explorer candidates',grain:'driver_candidate',presentationEligible:false,columns:[{name:'driver_id',type:'string',semantic:'id'},{name:'type',type:'string',semantic:'dimension'},{name:'title',type:'string',semantic:'text'},{name:'score',type:'number',semantic:'metric'},{name:'confidence',type:'number',semantic:'metric'},{name:'causal_status',type:'string',semantic:'dimension'},{name:'message',type:'string',semantic:'text'},{name:'dimension',type:'string',semantic:'dimension'},{name:'driver_metric',type:'string',semantic:'dimension'},{name:'share',type:'number',semantic:'metric'},{name:'effect',type:'number',semantic:'metric'}],rows,provenance:{kind:'derived_system',ref:'driver-bundle-v1'},sample:!!s.metadata?.sample}]};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
