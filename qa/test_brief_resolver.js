#!/usr/bin/env node
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const root=path.resolve(__dirname,'..');
const cases=[
 {name:'exec-approval',brief:{version:'1.0',profile:'BRIEF-v1',topic:'生成AI投資',title:'生成AI投資計画',audience:'executive',objective:'approval',slideCount:6,tone:['serious'],density:'MED',dataEmphasis:'MED',novelty:'LOW',language:'ja-JP',medium:'both',content:{metrics:[{value:'500万円',label:'予算'},{value:'3',label:'重点テーマ'},{value:'6M',label:'期間'}],points:[{title:'基盤',text:'共通化'},{title:'実装',text:'自動化'},{title:'運用',text:'定着'}]}}},
 {name:'data-report',brief:{version:'1.0',profile:'BRIEF-v1',topic:'月次KPI',title:'月次KPIレビュー',audience:'manager',objective:'report',slideCount:7,tone:['analytical'],density:'MED',dataEmphasis:'HIGH',novelty:'MED',language:'ja-JP',medium:'both',content:{metrics:[{value:'+8%',label:'売上'},{value:'25%',label:'粗利率'},{value:'5.2%',label:'売変率'}]}}},
 {name:'tech-explain',brief:{version:'1.0',profile:'BRIEF-v1',topic:'AI Agent基盤',title:'AI Agent基盤',audience:'technical',objective:'explain',slideCount:5,tone:['technical'],density:'HIGH',dataEmphasis:'MED',novelty:'MED',language:'ja-JP',medium:'both',content:{}}}
];
let pass=0;
for(const c of cases){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'brief-resolver-'));const inF=path.join(dir,'brief.json'),outF=path.join(dir,'bundle.json');fs.writeFileSync(inF,JSON.stringify(c.brief));const r=cp.spawnSync(process.execPath,[path.join(root,'tools/resolve_brief_to_design_lab.js'),inF,outF,dir],{encoding:'utf8'});if(r.status!==0){console.error('FAIL',c.name,r.stderr||r.stdout);process.exit(1)}const b=JSON.parse(fs.readFileSync(outF,'utf8'));if(b.profile!=='DESIGN-LAB-BUNDLE-v2'||Object.keys(b.variants).length!==3||b.slideOrder.length!==c.brief.slideCount){console.error('FAIL SHAPE',c.name);process.exit(1)}for(const v of ['A','B','C'])for(const id of b.slideOrder)if(!b.variants[v].slides[id]){console.error('FAIL MISSING',c.name,v,id);process.exit(1)}pass++}
console.log(`PASS ${pass}/${cases.length} brief cases`);
