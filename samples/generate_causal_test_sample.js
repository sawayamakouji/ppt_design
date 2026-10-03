#!/usr/bin/env node
const fs=require('fs');
const output=process.argv[2]||'/mnt/data/source-bundle.causal-test.sample.v1.json';
const round=(v,d=3)=>Number(v.toFixed(d));
const stores=[];
for(let i=1;i<=16;i++){
  const treated=i<=8;
  const shift=(i-8.5)*0.035;
  stores.push({
    store:`${treated?'導入':'対照'}${String(treated?i:i-8).padStart(2,'0')}店`,
    treated:treated?1:0,
    baseMd:6.25+shift+(treated?0.04:-0.02),
    inv:13.3+(i%5)*0.38+(treated?0.05:0),
    corr:18.0+(i%4)*1.15+(treated?0.12:0),
    sales:101+(i%6)*1.7+(treated?0.2:0),
    idx:i
  });
}
const rows=[];
for(const s of stores){
  for(let w=1;w<=16;w++){
    const post=w>=9?1:0;
    const commonTrend=-0.022*(w-1);
    const season=0.08*Math.sin(w*0.8)+(w===6?0.08:0)-(w===13?0.05:0);
    const dynamic=s.treated&&post?(-0.60-0.035*(w-9)-0.018*((s.idx%4)-1.5)):0;
    const storeWave=0.035*Math.sin((w+s.idx)*1.17)+0.012*Math.cos((w*0.8)+(s.idx*0.55));
    const md=s.baseMd+commonTrend+season+dynamic+storeWave;
    const inv=s.inv-0.035*w+(s.treated&&post?-0.42:0)+0.08*Math.cos(w*.7);
    const corr=s.corr+0.08*w+(s.treated&&post?-1.4:0)+0.18*Math.sin(w*.5);
    const sales=s.sales+0.32*w+(s.treated&&post?1.8:0)+0.6*Math.sin(w*.6);
    rows.push({
      store:s.store,
      week_index:w,
      week:`2026-W${String(w).padStart(2,'0')}`,
      treated:s.treated,
      post,
      markdown_rate:round(md),
      inventory_days:round(inv),
      correction_rate:round(corr),
      sales_index:round(sales),
      baseline_inventory_days:round(s.inv),
      baseline_correction_rate:round(s.corr),
      baseline_sales_index:round(s.sales)
    });
  }
}
const bundle={
  version:'1.0',profile:'SOURCE-BUNDLE-v1',
  metadata:{title:'Causal Test Planner deterministic panel sample',sample:true,note:'All values are illustrative sample data for causal-design QA.'},
  facts:[
    {id:'f_units',label:'対象店舗',value:16,displayValue:'16店',sourceRefs:['sample:causal_panel'],confidence:1},
    {id:'f_treated',label:'導入店舗',value:8,displayValue:'8店',sourceRefs:['sample:causal_panel'],confidence:1},
    {id:'f_control',label:'対照店舗',value:8,displayValue:'8店',sourceRefs:['sample:causal_panel'],confidence:1},
    {id:'f_periods',label:'観測期間',value:16,displayValue:'16週',sourceRefs:['sample:causal_panel'],confidence:1}
  ],
  tables:[{
    id:'causal_panel',title:'店舗週次パネル',grain:'store_week',
    columns:[
      {name:'store',label:'店舗',type:'string',semantic:'id'},
      {name:'week_index',label:'週番号',type:'number',semantic:'time'},
      {name:'week',label:'週',type:'string',semantic:'dimension'},
      {name:'treated',label:'導入群',type:'number',semantic:'dimension'},
      {name:'post',label:'導入後',type:'number',semantic:'dimension'},
      {name:'markdown_rate',label:'売変率',type:'number',semantic:'metric',unit:'%',aggregation:'avg'},
      {name:'inventory_days',label:'在庫日数',type:'number',semantic:'metric',unit:'日',aggregation:'avg'},
      {name:'correction_rate',label:'発注修正率',type:'number',semantic:'metric',unit:'%',aggregation:'avg'},
      {name:'sales_index',label:'売上指数',type:'number',semantic:'metric',aggregation:'avg'},
      {name:'baseline_inventory_days',label:'基準在庫日数',type:'number',semantic:'metric',unit:'日',aggregation:'avg'},
      {name:'baseline_correction_rate',label:'基準修正率',type:'number',semantic:'metric',unit:'%',aggregation:'avg'},
      {name:'baseline_sales_index',label:'基準売上指数',type:'number',semantic:'metric',aggregation:'avg'}
    ],
    rows,
    provenance:{kind:'sample',ref:'sample:causal_panel'},sample:true
  }]
};
fs.writeFileSync(output,JSON.stringify(bundle,null,2),'utf8');console.log(output);
