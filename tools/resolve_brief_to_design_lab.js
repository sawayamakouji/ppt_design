#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const input=process.argv[2];
const output=process.argv[3]||'/mnt/data/design-lab.from-brief.v2.json';
const workdir=process.argv[4]||path.dirname(output);
if(!input){console.error('usage: node resolve_brief_to_design_lab.js brief.json [bundle.json] [workdir]');process.exit(2)}
fs.mkdirSync(workdir,{recursive:true});
const brief=JSON.parse(fs.readFileSync(input,'utf8'));
if(brief.profile!=='BRIEF-v1')throw new Error('profile must be BRIEF-v1');
const rulesPath=path.resolve(__dirname,'../brief/brief-resolver-rules.v1.json');
const rules=JSON.parse(fs.readFileSync(rulesPath,'utf8'));
const patternResolver=path.resolve(__dirname,'resolve_pattern_deck_to_scene.js');

const THEMES={
 TH01:{bg:'F3F0E7',ink:'111111',accent:'D2471D',signal:'F6B72B',paper:'FAF8F2',muted:'6C675E'},
 TH05:{bg:'EAF3F6',ink:'102A43',accent:'117A8B',signal:'54D4D9',paper:'F6FBFC',muted:'557187'},
 TH10:{bg:'FAFAF7',ink:'151515',accent:'315E9A',signal:'F2C84B',paper:'EEF2F6',muted:'68717C'}
};

function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function storyFor(b){
  const base=[...(rules.storyTemplates[b.objective]||rules.storyTemplates.explain)];
  const n=clamp(Number(b.slideCount||6),3,20);
  const endRole=b.objective==='training'?'evidence':'action';
  if(n<base.length){
    const kept=base.filter(r=>r!==endRole).slice(0,n-1);
    return kept.concat(endRole);
  }
  const extras=['data','compare','flow','timeline','evidence'];
  let i=0;while(base.length<n){base.splice(base.length-1,0,extras[i++%extras.length])}
  return base.slice(0,n);
}
function m(i){const ms=brief.content?.metrics||[];return ms[i]||{value:i===0?'—':String(i+1),label:'KPI'}}
function p(i){const ps=brief.content?.points||[];return ps[i]||{title:`POINT ${i+1}`,text:'要点を具体化'} }
function safeObj(v, fallback){if(typeof v==='string')return{title:v,text:''};return v||fallback}
function contentFor(role, pattern, idx, dir){
  const c=brief.content||{};const topic=brief.topic||brief.title||'Presentation';
  const objectiveLabel={approval:'承認',proposal:'提案',report:'報告',analysis:'分析',explain:'説明',training:'教育'}[brief.objective]||'説明';
  const titleBase=c.headline||`${topic}の${objectiveLabel}ポイント`;
  const [fam,varn]=pattern.split('-');
  if(role==='opening')return{kicker:`${objectiveLabel.toUpperCase()} / ${dir}`,title:brief.title||topic,lead:c.lead||titleBase,label:'BRIEF',metric:brief.slideCount,metricLabel:'slides'};
  if(role==='message'){
    if(fam==='ED03')return{kicker:'ONE MESSAGE',title:titleBase,value:m(0).value,label:m(0).label,note:c.lead||''};
    return{kicker:'ONE MESSAGE',message:titleBase,question:`${topic}で何を変えるか`,support:c.lead||'',claim:`${topic}は個別改善で十分`,reality:titleBase};
  }
  if(role==='kpi'){
    if(varn==='D')return{kicker:'KEY NUMBER',title:'重要指標を同時に見る',metrics:[m(0),m(1),m(2),m(3)]};
    if(varn==='E')return{kicker:'KEY NUMBER',title:'構成比・重点配分',left:{value:m(0).value,label:m(0).label},right:{value:m(1).value,label:m(1).label}};
    if(varn==='B')return{kicker:'KEY NUMBER',title:m(0).label||'重要指標',value:m(0).value,delta:m(1).value,deltaLabel:m(1).label,note:c.lead||''};
    return{kicker:'KEY NUMBER',title:m(0).label||'重要指標',value:m(0).value,label:m(0).label,note:c.lead||''};
  }
  if(role==='data'){
    if(varn==='F')return{kicker:'DATA STORY',title:'数値を要因へ分解する',items:[m(0),m(1),m(2),m(3)].map(x=>({value:x.value,label:x.label}))};
    return{kicker:'DATA STORY',title:'数字から次の判断へ',lead:c.lead||'重要な変化を結論と注釈まで含めて示す。',annotation:'重点変化を確認',chart:c.chart||{type:'column',categories:['A','B','C'],series:[{name:'Index',values:[70,84,100]}]}};
  }
  if(role==='diagnosis'){
    if(fam==='ED09')return{kicker:'DIAGNOSIS',title:'優先度を2軸で整理',xLabel:'実行難易度 →',yLabel:'効果',quadrants:[{title:'観察',text:'小 / 易'},{title:'最優先',text:'大 / 易'},{title:'保留',text:'小 / 難'},{title:'大型',text:'大 / 難'}]};
    if(varn==='D')return{kicker:'DIAGNOSIS',title:'課題を構造化して解く',items:[safeObj(c.problem,{title:'課題1',text:''}),safeObj(c.cause,{title:'課題2',text:''}),{title:'運用差',text:'ルールのばらつき'}],solution:safeObj(c.solution,{title:'共通基盤',text:'仕組みで解く'})};
    return{kicker:'DIAGNOSIS',title:'課題を構造化して解く',problem:safeObj(c.problem,{title:'課題',text:''}),cause:safeObj(c.cause,{title:'原因',text:''}),solution:safeObj(c.solution,{title:'解決策',text:''})};
  }
  if(role==='compare'){
    if(fam==='ED09')return{kicker:'COMPARE',title:'優先順位を2軸で決める',xLabel:'難易度 →',yLabel:'効果',highlight:'TR',quadrants:[{title:'観察',text:'小 / 易'},{title:'最優先',text:'大 / 易'},{title:'保留',text:'小 / 難'},{title:'大型',text:'大 / 難'}]};
    return{kicker:'COMPARE',title:'現状から目指す姿へ',current:safeObj(c.current,{label:'CURRENT',title:'現状',text:'個別作業'}),ideal:safeObj(c.ideal,{label:'IDEAL',title:'目指す姿',text:'共通基盤'}),left:safeObj(c.current,{title:'現状',text:''}),right:safeObj(c.ideal,{title:'目指す姿',text:''}),gap:'SYSTEM GAP'};
  }
  if(role==='points'){const defaults=['共通ルールと共通データを整える','短いサイクルでPoCを回す','成功パターンを運用へ定着させる'];const ps=[p(0),p(1),p(2)].map((x,i)=>({...x,text:x.text||defaults[i]}));return{kicker:'THREE POINTS',title:'実行の3本柱',items:ps};}
  if(role==='flow')return{kicker:'FLOW',title:'人・データ・AIの役割を分ける',stages:(c.stages||[]).length>=3?c.stages:[{role:'DATA',step:'取得',output:'trusted data'},{role:'AGENT',step:'分析',output:'draft'},{role:'HUMAN',step:'判断',output:'approved'}]};
  if(role==='timeline')return{kicker:'TIMELINE',title:'段階的に実装・定着させる',stages:(c.timeline||[]).length>=3?c.timeline:[{title:'NOW',text:'PoC'},{title:'NEXT',text:'展開'},{title:'LATER',text:'標準化'}]};
  if(role==='action'){
    const as=(c.actions||[]).length>=3?c.actions:[{title:'対象決定',text:'優先業務を絞る'},{title:'PoC',text:'効果検証'},{title:'標準化',text:'横展開'}];
    if(varn==='C')return{kicker:'ACTION',title:'意思決定いただきたいこと',question:'次に進める範囲を決める',ask:brief.decision||`${topic}の次フェーズ着手を承認`,deadline:'NEXT STEP'};
    if(varn==='B')return{kicker:'ACTION',title:'誰が・何を・いつまでに',actions:as.map((a,i)=>({what:a.what||a.title,who:a.who||'Owner',when:a.when||['NOW','NEXT','LATER'][i%3]}))};
    return{kicker:'ACTION',title:'次の実行を明確にする',actions:as.map(a=>({title:a.title||a.what,text:a.text||a.commitment||''}))};
  }
  if(role==='evidence'){
    if(varn==='B')return{kicker:'EVIDENCE',title:'定義と前提',items:(c.evidence||[]).length>=2?c.evidence.map(x=>({term:x.title||x.term,definition:x.text||x.definition})):[{term:'Brief',definition:'目的・相手・制約'},{term:'Resolver',definition:'ED / TH / CM'}]};
    if(varn==='E')return{kicker:'EVIDENCE',title:'根拠と定義',columns:['項目','定義','値'],rows:(c.evidence||[]).map(x=>[x.title||'',x.text||'',x.value||'']).concat([['Brief','入力条件','v1'],['Scene','共通座標','0–100']])};
    return{kicker:'EVIDENCE',title:'生成から検証まで',stages:[{title:'Brief',text:'目的・相手'},{title:'Resolve',text:'ED / TH / CM'},{title:'Scene',text:'0–100 geometry'},{title:'Render',text:'HTML / PPT'},{title:'QA',text:'Lint / PPT-SAFE'}]};
  }
  return{kicker:'MESSAGE',message:titleBase,support:c.lead||''};
}
function densityFor(role,dir){
  if(role==='opening'||role==='message')return 'LOW';
  if(role==='evidence')return 'HIGH';
  if(dir==='B'&&['kpi','data','compare'].includes(role))return 'MED';
  return brief.density||'MED';
}
function makePatternDeck(dirKey){
  const d=rules.directions[dirKey]; const story=storyFor(brief);
  const slides=story.map((role,i)=>{const pattern=d.rolePatterns[role]||'ED02-A';return{id:`s${String(i+1).padStart(2,'0')}`,pattern,density:densityFor(role,dirKey),theme:d.theme,composition:d.composition,renderProfile:'PPT-SAFE-v1.3',content:contentFor(role,pattern,i,dirKey),notes:`role=${role}; direction=${dirKey}`}});
  return{version:'1.0',profile:'PATTERN-DECK-v1',deck:{title:brief.title||brief.topic,author:'OpenAI',subject:brief.topic,lang:brief.language||'ja-JP',defaultTheme:d.theme,defaultDensity:brief.density||'MED',defaultComposition:d.composition,renderProfile:'PPT-SAFE-v1.3',fonts:{jp:'Yu Gothic',latin:'Aptos'}},slides};
}
function run(cmd,args){const r=cp.spawnSync(cmd,args,{encoding:'utf8'});if(r.status!==0){throw new Error((r.stderr||r.stdout||'command failed').trim())}return r.stdout.trim()}
const dirs=['A','B','C'];const variants={};let slideOrder=null;
for(const key of dirs){
  const pd=makePatternDeck(key); const pfile=path.join(workdir,`pattern-deck.${key}.json`); const sfile=path.join(workdir,`scene-deck.${key}.json`); fs.writeFileSync(pfile,JSON.stringify(pd,null,2),'utf8');run(process.execPath,[patternResolver,pfile,sfile]);const sd=JSON.parse(fs.readFileSync(sfile,'utf8'));if(!slideOrder)slideOrder=sd.slides.map(s=>s.id);variants[key]={label:rules.directions[key].label,intent:rules.directions[key].intent,slides:Object.fromEntries(sd.slides.map(s=>[s.id,s])),patternDeck:pfile};
}
const recommended=brief.audience==='technical'?'C':brief.dataEmphasis==='HIGH'?'B':'A';
const bundle={version:'2.0',profile:'DESIGN-LAB-BUNDLE-v2',deck:{title:brief.title||brief.topic,subject:brief.topic,author:'OpenAI',lang:brief.language||'ja-JP',fonts:{jp:'Yu Gothic',latin:'Aptos'},brief:{audience:brief.audience,objective:brief.objective,density:brief.density,dataEmphasis:brief.dataEmphasis}},themes:THEMES,slideOrder,variants,selections:{},reviews:{},recommendations:{defaultDirection:recommended,reason:recommended==='B'?'dataEmphasis=HIGH':recommended==='C'?'audience=technical':'executive/editorial default'}};
fs.writeFileSync(output,JSON.stringify(bundle,null,2),'utf8');console.log(output);
