#!/usr/bin/env node
const fs = require('fs');

const input = process.argv[2];
const output = process.argv[3] || '/mnt/data/scene-deck.from-pattern.json';
if (!input) {
  console.error('usage: node resolve_pattern_deck_to_scene.js pattern-deck.json [scene-deck.json]');
  process.exit(2);
}

const req = JSON.parse(fs.readFileSync(input, 'utf8'));
validate(req);

const DEFAULT_THEMES = {
  TH01:{bg:'F3F0E7',ink:'111111',accent:'D2471D',signal:'F6B72B',paper:'FAF8F2',muted:'6C675E'},
  TH02:{bg:'FFFFFF',ink:'0B0B0B',accent:'3A3A3A',signal:'D9D9D4',paper:'F5F5F2',muted:'707070'},
  TH03:{bg:'FFFFFF',ink:'111111',accent:'E2231A',signal:'DCE4E8',paper:'F6F6F4',muted:'67727A'},
  TH04:{bg:'F2EBDD',ink:'241F1A',accent:'8E2F23',signal:'B59E73',paper:'F8F2E7',muted:'7A6D60'},
  TH05:{bg:'EAF3F6',ink:'102A43',accent:'117A8B',signal:'54D4D9',paper:'F6FBFC',muted:'557187'},
  TH10:{bg:'FAFAF7',ink:'151515',accent:'315E9A',signal:'F2C84B',paper:'EEF2F6',muted:'68717C'},
  TH11:{bg:'F4F1E8',ink:'0A0A0A',accent:'FF3B1F',signal:'DFFF00',paper:'FCFAF4',muted:'6E695F'},
  TH12:{bg:'090D16',ink:'F5F7FA',accent:'26E6FF',signal:'C8FF3D',paper:'101827',muted:'9AA7B8'},
  TH13:{bg:'F2E7D2',ink:'191714',accent:'C94C24',signal:'2856A8',paper:'FFF4DF',muted:'776B58'},
  TH14:{bg:'F7F5EF',ink:'111111',accent:'E32219',signal:'FFFFFF',paper:'FFFFFF',muted:'706B63'}
};

const THEMES = {...DEFAULT_THEMES, ...(req.themes || {})};

const DENSITY = {
  LOW:  {title:1.14, body:1.05, label:1.00, itemGap:1.10},
  MED:  {title:1.00, body:1.00, label:1.00, itemGap:1.00},
  HIGH: {title:0.88, body:0.90, label:0.96, itemGap:0.88}
};
const COMPOSITION = {
  CM01:{title:1.10, body:0.98, bias:0.68, calm:false},
  CM02:{title:1.00, body:1.00, bias:0.60, calm:false},
  CM03:{title:0.90, body:0.96, bias:0.52, calm:true}
};

function validate(d){
  if (!d || typeof d !== 'object') throw new Error('pattern deck must be an object');
  if (d.profile !== 'PATTERN-DECK-v1') throw new Error('profile must be PATTERN-DECK-v1');
  if (!Array.isArray(d.slides) || !d.slides.length) throw new Error('slides[] required');
  const seen=new Set();
  d.slides.forEach((s,i)=>{
    if(!s.id) throw new Error(`slide ${i+1}: id required`);
    if(seen.has(s.id)) throw new Error(`duplicate slide id: ${s.id}`);
    seen.add(s.id);
    if(!s.pattern) throw new Error(`slide ${s.id}: pattern required`);
  });
}
function normalizePattern(p){
  const m=String(p).toUpperCase().match(/^(ED\d{2})(?:-([A-Z]))?$/);
  if(!m) throw new Error(`invalid pattern id: ${p}`);
  const family=m[1], variant=m[2]||'A';
  const n=Number(family.slice(2));
  if(n<1||n>12) throw new Error(`unsupported pattern family: ${family}`);
  return {family,variant,id:`${family}-${variant}`};
}
function dims(slide){
  const density=DENSITY[slide.density||req.deck?.defaultDensity||'MED']||DENSITY.MED;
  const comp=COMPOSITION[slide.composition||req.deck?.defaultComposition||'CM02']||COMPOSITION.CM02;
  return {density,comp,titleScale:density.title*comp.title,bodyScale:density.body*comp.body};
}
function fsz(base,k){return Math.round(base*k*10)/10}
function text(id,x,y,w,h,value,size=18,opts={}){
  return {id,type:'text',x,y,w,h,text:String(value??''),z:opts.z??10,style:{fontSize:size,bold:!!opts.bold,color:opts.color||'$ink',align:opts.align||'left',valign:opts.valign||'top',fit:opts.fit||'shrink',fontFace:opts.fontFace,charSpacing:opts.charSpacing,lineHeight:opts.lineHeight||1.15,italic:!!opts.italic,marginPt:0}};
}
function rect(id,x,y,w,h,fill='$paper',line='$ink',lineWidth=1.5,opts={}){return {id,type:opts.round?'roundRect':'rect',x,y,w,h,z:opts.z??1,style:{fill,line,lineWidth,radius:opts.radius||12,fillTransparency:opts.fillTransparency||0}}}
function ellipse(id,x,y,w,h,fill='$paper',line='$ink',lineWidth=1.5,opts={}){return {id,type:'ellipse',x,y,w,h,z:opts.z??1,style:{fill,line,lineWidth}}}
function line(id,x1,y1,x2,y2,color='$ink',lineWidth=1.5,opts={}){return {id,type:opts.connector?'connector':'line',x1,y1,x2,y2,z:opts.z??2,style:{color,lineWidth,dash:opts.dash,endArrow:opts.endArrow}}}
function chart(id,x,y,w,h,chartType,categories,series,opts={}){return {id,type:'chart',chartType,x,y,w,h,z:opts.z??3,categories:categories||[],series:series||[],style:{showLegend:opts.showLegend??false,showValue:opts.showValue??false,colors:opts.colors||['$accent','$ink','$signal'],axisFontSize:opts.axisFontSize||9,gridTransparency:opts.gridTransparency??75,showCategoryName:opts.showCategoryName??false}}}
function common(slide, pattern){
  const c=slide.content||{}; const {titleScale}=dims(slide);
  const out=[];
  if(c.kicker) out.push(text('kicker',5,5.2,42,4.2,c.kicker,fsz(10,titleScale),{bold:true,color:'$muted',charSpacing:1.2}));
  out.push(text('pattern-meta',72,5.2,23,4.2,`${pattern.id} / ${slide.density||'MED'} / ${slide.composition||'CM02'}`,8.3,{bold:true,color:'$muted',align:'right',charSpacing:.3}));
  return out;
}
function required(c, key, pid){ if(c[key]==null||c[key]==='') throw new Error(`${pid}: content.${key} required`); return c[key]; }
function items(c){return Array.isArray(c.items)?c.items:[]}
function metrics(c){return Array.isArray(c.metrics)?c.metrics:[]}
function actions(c){return Array.isArray(c.actions)?c.actions:[]}
function stages(c){return Array.isArray(c.stages)?c.stages:Array.isArray(c.items)?c.items:[]}
function pair(obj, fallbackA='A', fallbackB='B'){return [obj?.left||obj?.before||obj?.current||{title:fallbackA,text:''}, obj?.right||obj?.after||obj?.ideal||{title:fallbackB,text:''}]}

function ed01(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale,comp}=dims(slide), v=p.variant;
  const title=required(c,'title',p.id), lead=c.lead||c.subtitle||'', metric=c.metric||'', ml=c.metricLabel||'';
  const e=common(slide,p);
  if(v==='B'){
    e.push(text('title',5,20,90,30,title,fsz(56,titleScale),{bold:true,align:'center',valign:'middle'}));
    if(lead)e.push(text('lead',18,58,64,10,lead,fsz(17,bodyScale),{bold:true,align:'center'}));
    e.push(rect('accent',5,82,90,6,'$accent','$accent',0));
    if(metric)e.push(text('metric',72,75,20,8,metric,fsz(34,titleScale),{bold:true,color:'$signal',align:'right'}));
  } else if(v==='C'){
    e.push(text('metric',5,20,42,30,metric||c.number||'01',fsz(70,titleScale),{bold:true,color:'$accent'}));
    e.push(line('divider',48,18,48,78,'$ink',2));
    e.push(text('title',54,20,40,24,title,fsz(38,titleScale),{bold:true}));
    if(lead)e.push(text('lead',54,53,35,15,lead,fsz(16,bodyScale),{bold:true}));
    if(ml)e.push(text('metricLabel',6,55,35,7,ml,fsz(13,bodyScale),{bold:true,color:'$muted'}));
  } else if(v==='D'){
    const split=comp.bias*100;
    e.push(rect('right-panel',split,0,100-split,100,'$ink','$ink',0));
    e.push(text('title',5,20,split-10,28,title,fsz(44,titleScale),{bold:true}));
    if(lead)e.push(text('lead',5,62,split-14,16,lead,fsz(17,bodyScale),{bold:true}));
    if(metric)e.push(text('metric',split+5,28,100-split-10,18,metric,fsz(48,titleScale),{bold:true,color:'$signal',align:'center'}));
    if(ml)e.push(text('metricLabel',split+5,52,100-split-10,8,ml,fsz(14,bodyScale),{bold:true,color:'$paper',align:'center'}));
  } else if(v==='E'){
    e.push(text('title',5,20,48,26,title,fsz(42,titleScale),{bold:true}));
    if(lead)e.push(text('lead',5,58,45,16,lead,fsz(16,bodyScale),{bold:true}));
    if(c.image)e.push({id:'image',type:'image',x:57,y:15,w:38,h:68,path:c.image,z:2,style:{fit:'cover'}});
    else {e.push(rect('visual',57,15,38,68,'$paper','$ink',1.5)); e.push(text('visual-label',62,44,28,8,c.visualLabel||'VISUAL',22,{bold:true,color:'$muted',align:'center'}));}
  } else {
    e.push(line('rule',5,13,95,13,'$ink',2));
    e.push(text('title',5,20,62,28,title,fsz(46,titleScale),{bold:true}));
    if(lead)e.push(text('lead',5,72,50,13,lead,fsz(17,bodyScale),{bold:true}));
    e.push(rect('metricbox',72,20,23,52,'$ink','$ink',0));
    if(c.label)e.push(text('label',75,25,17,5,c.label,10,{bold:true,color:'$signal',charSpacing:1}));
    if(metric)e.push(text('metric',75,40,17,13,metric,fsz(40,titleScale),{bold:true,color:'$paper',align:'center'}));
    if(ml)e.push(text('metricLabel',75,58,17,6,ml,fsz(14,bodyScale),{bold:true,color:'$paper',align:'center'}));
  }
  return e;
}
function ed02(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide); const msg=(p.variant==='D'?(c.message||c.claim||c.reality):required(c,'message',p.id)), support=c.support||c.lead||''; const e=common(slide,p);
  if(p.variant==='B'){
    e.push(text('question-mark',5,19,12,22,'?',fsz(72,titleScale),{bold:true,color:'$accent'}));
    e.push(text('message',18,22,72,27,msg,fsz(48,titleScale),{bold:true}));
    if(support)e.push(text('support',18,63,62,13,support,fsz(16,bodyScale),{bold:true,color:'$muted'}));
  } else if(p.variant==='C'){
    if(c.question)e.push(text('question',5,18,70,8,c.question,fsz(15,bodyScale),{bold:true,color:'$muted'}));
    e.push(text('message',5,33,86,28,msg,fsz(54,titleScale),{bold:true,color:'$accent'}));
    if(support)e.push(text('support',5,70,72,10,support,fsz(15,bodyScale),{bold:true}));
  } else if(p.variant==='D'){
    e.push(rect('claim-bg',5,18,90,27,'$paper','$ink',1.5));
    e.push(text('claim-label',8,21,18,5,c.claimLabel||'ASSUMPTION',10,{bold:true,color:'$muted',charSpacing:1}));
    e.push(text('claim',8,29,80,12,c.claim||msg,fsz(28,titleScale),{bold:true}));
    e.push(rect('reality-bg',5,51,90,31,'$ink','$ink',0));
    e.push(text('reality-label',8,55,18,5,c.realityLabel||'REALITY',10,{bold:true,color:'$signal',charSpacing:1}));
    e.push(text('reality',8,63,80,12,c.reality||support||msg,fsz(28,titleScale),{bold:true,color:'$paper'}));
  } else if(p.variant==='E'){
    e.push(text('quoteMark',5,18,10,20,'“',fsz(70,titleScale),{bold:true,color:'$accent'}));
    e.push(text('message',15,25,72,30,msg,fsz(38,titleScale),{bold:true}));
    if(c.source)e.push(text('source',15,66,50,6,`— ${c.source}`,fsz(13,bodyScale),{bold:true,color:'$muted'}));
  } else {
    e.push(text('message',5,25,84,25,msg,fsz(52,titleScale),{bold:true}));
    e.push(line('accent-rule',5,58,36,58,'$accent',5));
    if(support)e.push(text('support',5,66,66,13,support,fsz(16,bodyScale),{bold:true}));
  }
  return e;
}
function ed03(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide), e=common(slide,p); const title=c.title||'KEY NUMBER';
  if(p.variant==='D'){
    const ms=metrics(c); if(ms.length<3) throw new Error(`${p.id}: content.metrics needs >=3`);
    e.push(text('title',5,15,70,10,title,fsz(30,titleScale),{bold:true}));
    const use=ms.slice(0,4), gap=2, w=(90-gap*(use.length-1))/use.length;
    use.forEach((m,i)=>{const x=5+i*(w+gap);e.push(rect(`card${i}`,x,35,w,38,i===1?'$ink':i===2?'$accent':'$paper',i===2?'$accent':'$ink',1.5));e.push(text(`val${i}`,x+2,43,w-4,10,m.value,fsz(28,titleScale),{bold:true,color:(i===1||i===2)?'$paper':'$ink',align:'center'}));e.push(text(`lab${i}`,x+2,61,w-4,7,m.label||'',fsz(12,bodyScale),{bold:true,color:(i===1||i===2)?'$paper':'$ink',align:'center'}));});
  } else if(p.variant==='B'){
    const current=required(c,'value',p.id), delta=required(c,'delta',p.id);
    e.push(text('title',5,15,75,9,title,fsz(28,titleScale),{bold:true}));
    e.push(text('value',5,33,50,22,current,fsz(64,titleScale),{bold:true}));
    e.push(rect('deltaBox',62,36,30,20,'$accent','$accent',0));
    e.push(text('delta',65,41,24,10,delta,fsz(28,titleScale),{bold:true,color:'$paper',align:'center'}));
    if(c.deltaLabel)e.push(text('deltaLabel',65,54,24,5,c.deltaLabel,fsz(11,bodyScale),{bold:true,color:'$paper',align:'center'}));
    if(c.note)e.push(text('note',5,72,70,9,c.note,fsz(14,bodyScale),{bold:true,color:'$muted'}));
  } else if(p.variant==='C'){
    const cur=Number(c.current??0), target=Number(c.target??100), pct=Math.max(0,Math.min(1,target?cur/target:0));
    e.push(text('title',5,15,70,9,title,fsz(28,titleScale),{bold:true}));
    e.push(text('current',5,34,40,18,String(c.value??c.current??''),fsz(54,titleScale),{bold:true}));
    e.push(text('target',67,37,25,8,`TARGET ${c.targetLabel??c.target??''}`,fsz(16,bodyScale),{bold:true,color:'$muted',align:'right'}));
    e.push(rect('track',5,63,90,8,'$paper','$muted',1));
    e.push(rect('progress',5,63,90*pct,8,'$accent','$accent',0));
    if(c.note)e.push(text('note',5,77,72,8,c.note,fsz(14,bodyScale),{bold:true}));
  } else if(p.variant==='E'){
    const a=c.left?.value??c.a??'70', b=c.right?.value??c.b??'30';
    e.push(text('title',5,15,70,9,title,fsz(28,titleScale),{bold:true}));
    e.push(text('ratioA',5,35,35,22,String(a),fsz(60,titleScale),{bold:true,color:'$accent',align:'right'}));
    e.push(text('colon',43,37,8,18,':',fsz(46,titleScale),{bold:true,align:'center'}));
    e.push(text('ratioB',54,35,35,22,String(b),fsz(60,titleScale),{bold:true,align:'left'}));
    e.push(text('labelA',5,64,35,6,c.left?.label||'A',fsz(12,bodyScale),{bold:true,color:'$muted',align:'right'}));
    e.push(text('labelB',54,64,35,6,c.right?.label||'B',fsz(12,bodyScale),{bold:true,color:'$muted'}));
  } else {
    const value=required(c,'value',p.id);
    e.push(text('title',5,15,70,9,title,fsz(28,titleScale),{bold:true}));
    e.push(text('value',5,33,80,25,value,fsz(74,titleScale),{bold:true,color:'$accent'}));
    if(c.label)e.push(text('label',6,64,45,8,c.label,fsz(15,bodyScale),{bold:true}));
    if(c.note)e.push(text('note',6,74,64,8,c.note,fsz(13,bodyScale),{bold:true,color:'$muted'}));
  }
  return e;
}
function ed04(slide,p){
  const c=slide.content||{}, arr=items(c); if(arr.length<3) throw new Error(`${p.id}: content.items needs >=3`); const {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true}));
  const use=arr.slice(0,3);
  if(p.variant==='B'){
    e.push(rect('big',5,31,48,48,'$ink','$ink',0));e.push(text('bigN',8,35,8,8,'01',16,{bold:true,color:'$signal'}));e.push(text('bigT',8,48,40,10,use[0].title||use[0].label||'',fsz(24,titleScale),{bold:true,color:'$paper'}));e.push(text('bigB',8,62,40,11,use[0].text||'',fsz(13,bodyScale),{bold:true,color:'$paper'}));
    [1,2].forEach((idx,j)=>{const y=31+j*25;e.push(rect(`small${idx}`,57,y,38,22,'$paper','$ink',1.5));e.push(text(`n${idx}`,60,y+4,6,5,`0${idx+1}`,12,{bold:true,color:'$accent'}));e.push(text(`t${idx}`,68,y+4,23,6,use[idx].title||use[idx].label||'',fsz(17,titleScale),{bold:true}));e.push(text(`b${idx}`,68,y+11,23,7,use[idx].text||'',fsz(11,bodyScale),{bold:true,color:'$muted'}));});
  } else if(p.variant==='C'){
    e.push(line('timeline',12,54,88,54,'$ink',2));use.forEach((it,i)=>{const x=15+i*34;e.push(ellipse(`dot${i}`,x,50.5,5,7,'$accent','$accent',0));e.push(text(`num${i}`,x+1,52,3,3,String(i+1),10,{bold:true,color:'$paper',align:'center'}));e.push(text(`title${i}`,x-4,34,20,9,it.title||'',fsz(17,titleScale),{bold:true,align:'center'}));e.push(text(`body${i}`,x-4,62,20,11,it.text||'',fsz(11,bodyScale),{bold:true,color:'$muted',align:'center'}));});
  } else if(p.variant==='D' || p.variant==='E'){
    use.forEach((it,i)=>{const y=31+i*17; const fill=p.variant==='E'?(i===0?'$accent':i===1?'$signal':'$paper'):(i===0?'$ink':'$paper'); const col=(p.variant==='D'&&i===0)|| (p.variant==='E'&&i===0)?'$paper':'$ink'; e.push(rect(`row${i}`,5,y,90,13,fill,p.variant==='E'&&i===0?'$accent':'$ink',1.3));e.push(text(`rank${i}`,8,y+3,8,5,String(i+1).padStart(2,'0'),16,{bold:true,color:col}));e.push(text(`title${i}`,18,y+2,30,5,it.title||'',fsz(16,titleScale),{bold:true,color:col}));e.push(text(`body${i}`,52,y+2,36,7,it.text||'',fsz(11,bodyScale),{bold:true,color:col})); if(p.variant==='E'&&it.severity)e.push(text(`sev${i}`,86,y+3,6,4,it.severity,9,{bold:true,color:col,align:'right'}));});
  } else {
    use.forEach((it,i)=>{const x=5+i*31;e.push(rect(`card${i}`,x,32,27,44,i===1?'$ink':'$paper','$ink',1.4));e.push(text(`n${i}`,x+2,36,7,5,`0${i+1}`,12,{bold:true,color:i===1?'$signal':'$accent'}));e.push(text(`t${i}`,x+2,47,23,9,it.title||'',fsz(19,titleScale),{bold:true,color:i===1?'$paper':'$ink'}));e.push(text(`b${i}`,x+2,61,23,10,it.text||'',fsz(11,bodyScale),{bold:true,color:i===1?'$paper':'$muted'}));});
  }
  return e;
}
function compareCore(slide,p,labels){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true})); const [a,b]=pair(c,labels[0],labels[1]);
  if(p.variant==='E'){
    const opts=items(c); if(opts.length<3) throw new Error(`${p.id}: content.items needs >=3`); opts.slice(0,3).forEach((it,i)=>{const x=5+i*31;e.push(rect(`opt${i}`,x,31,27,46,i===Number(c.recommendedIndex||0)?'$ink':'$paper','$ink',1.4));e.push(text(`lab${i}`,x+2,35,23,5,it.label||`OPTION ${i+1}`,10,{bold:true,color:i===Number(c.recommendedIndex||0)?'$signal':'$muted'}));e.push(text(`tit${i}`,x+2,46,23,8,it.title||'',fsz(18,titleScale),{bold:true,color:i===Number(c.recommendedIndex||0)?'$paper':'$ink'}));e.push(text(`txt${i}`,x+2,59,23,11,it.text||'',fsz(11,bodyScale),{bold:true,color:i===Number(c.recommendedIndex||0)?'$paper':'$muted'}));});
  } else {
    e.push(rect('left',5,31,40,46,'$paper','$ink',1.5));e.push(rect('right',55,31,40,46,p.variant==='D'?'$ink':'$paper','$ink',1.5));e.push(text('llabel',8,35,30,5,a.label||a.title||labels[0],10,{bold:true,color:'$muted'}));e.push(text('ltitle',8,47,32,8,a.title||a.value||'',fsz(21,titleScale),{bold:true}));e.push(text('ltext',8,59,32,11,a.text||a.note||'',fsz(12,bodyScale),{bold:true,color:'$muted'})); e.push(text('rlabel',58,35,30,5,b.label||b.title||labels[1],10,{bold:true,color:p.variant==='D'?'$signal':'$muted'}));e.push(text('rtitle',58,47,32,8,b.title||b.value||'',fsz(21,titleScale),{bold:true,color:p.variant==='D'?'$paper':'$ink'}));e.push(text('rtext',58,59,32,11,b.text||b.note||'',fsz(12,bodyScale),{bold:true,color:p.variant==='D'?'$paper':'$muted'})); e.push(text('arrow',46,48,8,8,'→',26,{bold:true,color:'$accent',align:'center'})); if(p.variant==='D'&&c.gap)e.push(text('gap',43,70,14,5,c.gap,10,{bold:true,color:'$accent',align:'center'}));
  }
  return e;
}
function ed05(slide,p){const labels=p.variant==='A'?['BEFORE','AFTER']:p.variant==='B'?['A','B']:p.variant==='C'?['OLD','NEW']:p.variant==='D'?['CURRENT','IDEAL']:['OPTION','OPTION'];return compareCore(slide,p,labels)}
function ed06(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true}));
  if(p.variant==='D'){
    const probs=items(c); if(probs.length<3) throw new Error(`${p.id}: content.items needs >=3`); probs.slice(0,3).forEach((it,i)=>{const y=30+i*15;e.push(rect(`p${i}`,5,y,38,11,'$paper','$ink',1.2));e.push(text(`pt${i}`,8,y+3,30,5,it.title||it.text||'',fsz(13,titleScale),{bold:true})); e.push(line(`conn${i}`,43,y+5.5,58,50,'$muted',1.2,{connector:true}));});e.push(rect('solution',58,32,37,38,'$ink','$ink',0));e.push(text('solLabel',62,36,25,5,'SOLUTION',10,{bold:true,color:'$signal'}));e.push(text('solTitle',62,47,28,9,c.solution?.title||c.solution||'',fsz(21,titleScale),{bold:true,color:'$paper'}));e.push(text('solText',62,59,28,8,c.solution?.text||'',fsz(11,bodyScale),{bold:true,color:'$paper'}));
  } else {
    const labels=p.variant==='B'?['PROBLEM','CAUSE','SOLUTION']:p.variant==='C'?['PAIN','IDEA','VALUE']:['PROBLEM','SOLUTION']; const objs=p.variant==='B'?[c.problem,c.cause,c.solution]:p.variant==='C'?[c.pain,c.idea,c.value]:[c.problem,c.solution]; const count=objs.length,w=(90-(count-1)*3)/count; objs.forEach((obj,i)=>{const o=typeof obj==='string'?{title:obj}:{...(obj||{})};const x=5+i*(w+3);const dark=i===count-1;e.push(rect(`box${i}`,x,32,w,42,dark?'$ink':'$paper','$ink',1.4));e.push(text(`lab${i}`,x+2,36,w-4,5,labels[i],10,{bold:true,color:dark?'$signal':'$muted'}));e.push(text(`tit${i}`,x+2,47,w-4,8,o.title||'',fsz(19,titleScale),{bold:true,color:dark?'$paper':'$ink'}));e.push(text(`txt${i}`,x+2,59,w-4,9,o.text||'',fsz(11,bodyScale),{bold:true,color:dark?'$paper':'$muted'})); if(i<count-1)e.push(text(`arr${i}`,x+w+.4,48,2,6,'→',16,{bold:true,color:'$accent',align:'center'}));});
  }
  return e;
}
function ed07(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,82,9,c.title,fsz(29,titleScale),{bold:true})); const ss=stages(c);
  if(p.variant==='C'){
    const use=ss.slice(0,4); if(use.length<3) throw new Error(`${p.id}: content.stages needs >=3`); const pos=[[44,28],[68,47],[44,67],[20,47]]; use.forEach((it,i)=>{const [x,y]=pos[i];e.push(ellipse(`node${i}`,x,y,14,16,i===1?'$accent':'$paper','$ink',1.3));e.push(text(`nt${i}`,x+1,y+5,12,6,it.title||it.label||String(i+1),fsz(12,titleScale),{bold:true,color:i===1?'$paper':'$ink',align:'center'}));}); for(let i=0;i<use.length;i++){const a=pos[i],b=pos[(i+1)%use.length];e.push(line(`c${i}`,a[0]+7,a[1]+8,b[0]+7,b[1]+8,'$muted',1.2,{connector:true,endArrow:'triangle'}));}
  } else if(p.variant==='D'){
    if(ss.length<4) throw new Error(`${p.id}: content.stages needs >=4`); const hub=c.hub||{title:'HUB'};e.push(ellipse('hub',42,37,16,20,'$ink','$ink',0));e.push(text('hubT',44,44,12,5,hub.title||hub,fsz(15,titleScale),{bold:true,color:'$paper',align:'center'})); const pos=[[8,28],[75,28],[8,64],[75,64]];ss.slice(0,4).forEach((it,i)=>{const [x,y]=pos[i];e.push(rect(`n${i}`,x,y,18,13,'$paper','$ink',1.3));e.push(text(`t${i}`,x+2,y+4,14,5,it.title||it.label||'',fsz(12,titleScale),{bold:true,align:'center'}));e.push(line(`l${i}`,x+(x<50?18:0),y+6.5,x<50?42:58,47,'$muted',1.2,{connector:true}));});
  } else if(p.variant==='E'){
    const use=ss.slice(0,4); if(use.length<3) throw new Error(`${p.id}: content.stages needs >=3`);use.forEach((it,i)=>{const y=30+i*13;e.push(rect(`lane${i}`,5,y,90,10,i===1?'$ink':'$paper','$ink',1.2));e.push(text(`role${i}`,8,y+2,18,5,it.role||it.title||`LANE ${i+1}`,fsz(11,titleScale),{bold:true,color:i===1?'$signal':'$ink'}));e.push(text(`step${i}`,30,y+2,28,5,it.step||it.text||'',fsz(11,bodyScale),{bold:true,color:i===1?'$paper':'$ink'}));e.push(text(`out${i}`,65,y+2,24,5,it.output||'',fsz(10,bodyScale),{bold:true,color:i===1?'$paper':'$muted'}));});
  } else if(p.variant==='F'){
    const use=ss.slice(0,4); if(use.length<3) throw new Error(`${p.id}: content.stages needs >=3`); use.forEach((it,i)=>{const w=80-i*14,x=50-w/2,y=29+i*13;e.push(rect(`f${i}`,x,y,w,10,i===use.length-1?'$accent':'$paper','$ink',1.2));e.push(text(`ft${i}`,x+2,y+2,w-4,5,it.title||it.label||'',fsz(12,titleScale),{bold:true,color:i===use.length-1?'$paper':'$ink',align:'center'}));});
  } else {
    const max=p.variant==='B'?3:5,use=ss.slice(0,max); if(use.length<2) throw new Error(`${p.id}: content.stages needs >=2`); const gap=2,w=(90-gap*(use.length-1))/use.length;use.forEach((it,i)=>{const x=5+i*(w+gap);const dark=i===use.length-1;e.push(rect(`stage${i}`,x,35,w,32,dark?'$ink':'$paper','$ink',1.3));e.push(text(`sn${i}`,x+1.5,39,w-3,4,String(i+1).padStart(2,'0'),10,{bold:true,color:dark?'$signal':'$accent'}));e.push(text(`st${i}`,x+1.5,48,w-3,6,it.title||it.label||'',fsz(13,titleScale),{bold:true,color:dark?'$paper':'$ink',align:'center'}));e.push(text(`sb${i}`,x+1.5,58,w-3,6,it.text||it.step||'',fsz(10,bodyScale),{bold:true,color:dark?'$paper':'$muted',align:'center'}));if(i<use.length-1)e.push(text(`a${i}`,x+w+.2,48,1.6,5,'→',13,{bold:true,color:'$accent',align:'center'}));});
  }
  return e;
}
function ed08(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p), cats=c.chart?.categories||c.categories||[], series=c.chart?.series||c.series||[], type=c.chart?.type||c.chartType||'column';
  if(p.variant==='D'){
    const ranks=items(c); if(ranks.length<3) throw new Error(`${p.id}: content.items needs >=3`); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true})); const max=Math.max(...ranks.map(x=>Number(x.value||0)),1);ranks.slice(0,6).forEach((it,i)=>{const y=31+i*8;e.push(text(`rl${i}`,5,y,24,5,it.label||it.title||'',fsz(10,bodyScale),{bold:true}));e.push(rect(`track${i}`,30,y,60,4,'$paper','$muted',.5));e.push(rect(`bar${i}`,30,y,60*Number(it.value||0)/max,4,i===0?'$accent':'$ink',i===0?'$accent':'$ink',0));e.push(text(`rv${i}`,91,y-1,5,5,String(it.value??''),10,{bold:true,align:'right'}));});
  } else if(p.variant==='E'){
    if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true})); const panels=Array.isArray(c.panels)?c.panels:[]; if(panels.length<3) throw new Error(`${p.id}: content.panels needs >=3`);panels.slice(0,3).forEach((pn,i)=>{const x=5+i*31;e.push(text(`pt${i}`,x,29,27,5,pn.title||'',fsz(12,titleScale),{bold:true}));e.push(chart(`pc${i}`,x,38,27,30,pn.type||'column',pn.categories||[],pn.series||[],{colors:['$accent','$ink']}));});
  } else if(p.variant==='F'){
    if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true})); const breakdown=items(c); if(breakdown.length<3) throw new Error(`${p.id}: content.items needs >=3`); breakdown.slice(0,4).forEach((it,i)=>{const x=5+i*23;e.push(rect(`bc${i}`,x,34,20,34,i===0?'$ink':'$paper','$ink',1.2));e.push(text(`bv${i}`,x+2,42,16,9,String(it.value||''),fsz(24,titleScale),{bold:true,color:i===0?'$signal':'$accent',align:'center'}));e.push(text(`bl${i}`,x+2,57,16,6,it.label||'',fsz(11,bodyScale),{bold:true,color:i===0?'$paper':'$ink',align:'center'}));});
  } else if(p.variant==='G'){
    if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true})); const vals=items(c); if(vals.length<3) throw new Error(`${p.id}: content.items needs >=3`); let acc=50; const scale=1.1; vals.slice(0,6).forEach((it,i)=>{const v=Number(it.value||0),x=7+i*14,h=Math.min(28,Math.abs(v)*scale),y=v>=0?acc-h:acc; e.push(rect(`wf${i}`,x,y,9,h,v>=0?'$accent':'$ink',v>=0?'$accent':'$ink',0));e.push(text(`wl${i}`,x-1,72,11,5,it.label||'',9,{bold:true,color:'$muted',align:'center'}));e.push(text(`wv${i}`,x-1,y-6,11,5,String(v),9,{bold:true,align:'center'}));acc-=v>=0?h:-h;});e.push(line('base',5,68,95,68,'$muted',1));
  } else {
    const title=required(c,'title',p.id); const titleW=p.variant==='B'?90:52; e.push(text('title',5,14,titleW,p.variant==='B'?10:15,title,fsz(p.variant==='B'?30:31,titleScale),{bold:true}));
    const cx=p.variant==='B'?5:58, cy=32,cw=p.variant==='B'?90:37,ch=48; e.push(chart('chart',cx,cy,cw,ch,type,cats,series,{colors:['$accent','$ink','$signal'],showLegend:c.chart?.showLegend||false}));
    if(p.variant!=='B' && c.lead)e.push(text('lead',5,44,46,16,c.lead,fsz(14,bodyScale),{bold:true,color:'$muted'}));
    if(p.variant==='C' && c.annotation){e.push(rect('callout',60,20,30,10,'$signal','$ink',1));e.push(text('calloutText',62,23,26,5,c.annotation,fsz(11,bodyScale),{bold:true,align:'center'}));e.push(line('leader',75,30,71,41,'$ink',1,{connector:true}));}
  }
  return e;
}
function ed09(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true}));
  if(p.variant==='B'){
    e.push(line('x',15,72,90,72,'$ink',1.3));e.push(line('y',15,72,15,28,'$ink',1.3));const ps=items(c);ps.forEach((it,i)=>{const x=15+Number(it.x||50)*.72,y=72-Number(it.y||50)*.42,s=6+Math.min(12,Number(it.size||10)*.3);e.push(ellipse(`b${i}`,x-s/2,y-s/2,s,s,i===Number(c.highlightIndex||0)?'$accent':'$paper','$ink',1));e.push(text(`bt${i}`,x-s/2,y-s/2+s*.33,s,s*.35,it.label||'',8,{bold:true,color:i===Number(c.highlightIndex||0)?'$paper':'$ink',align:'center'}));});
  } else if(p.variant==='D'){
    const steps=items(c); if(steps.length<3) throw new Error(`${p.id}: content.items needs >=3`);steps.slice(0,4).forEach((it,i)=>{const x=8+i*21,y=65-i*11;e.push(rect(`step${i}`,x,y,18,12,i===steps.length-1?'$accent':'$paper','$ink',1.2));e.push(text(`st${i}`,x+2,y+3,14,5,it.title||it.label||'',fsz(11,titleScale),{bold:true,color:i===steps.length-1?'$paper':'$ink',align:'center'}));});
  } else {
    e.push(rect('q1',15,28,37.5,22,p.variant==='C'&&c.highlight==='TL'?'$accent':'$paper','$ink',1));e.push(rect('q2',52.5,28,37.5,22,p.variant==='C'&&c.highlight==='TR'?'$accent':'$paper','$ink',1));e.push(rect('q3',15,50,37.5,22,p.variant==='C'&&c.highlight==='BL'?'$accent':'$paper','$ink',1));e.push(rect('q4',52.5,50,37.5,22,p.variant==='C'&&c.highlight==='BR'?'$accent':'$paper','$ink',1)); const qs=c.quadrants||items(c);['TL','TR','BL','BR'].forEach((k,i)=>{const it=qs[i]||{},x=i%2?56:19,y=i<2?33:55;const high=p.variant==='C'&&c.highlight===k;e.push(text(`qt${i}`,x,y,29,6,it.title||it.label||k,fsz(13,titleScale),{bold:true,color:high?'$paper':'$ink'}));e.push(text(`qb${i}`,x,y+8,29,7,it.text||'',fsz(10,bodyScale),{bold:true,color:high?'$paper':'$muted'}));}); if(c.xLabel)e.push(text('xl',61,75,28,5,c.xLabel,9,{bold:true,color:'$muted',align:'right'}));if(c.yLabel)e.push(text('yl',6,31,8,28,c.yLabel,9,{bold:true,color:'$muted'}));
  }
  return e;
}
function ed10(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true})); const ss=stages(c); if(ss.length<3) throw new Error(`${p.id}: content.stages needs >=3`);
  if(p.variant==='B'){
    ss.slice(0,4).forEach((it,i)=>{const y=30+i*13;e.push(text(`n${i}`,5,y,8,6,String(i+1).padStart(2,'0'),14,{bold:true,color:'$accent'}));e.push(line(`l${i}`,14,y+3,20,y+3,'$muted',1));e.push(text(`t${i}`,22,y,28,6,it.title||it.label||'',fsz(14,titleScale),{bold:true}));e.push(text(`b${i}`,53,y,37,7,it.text||it.period||'',fsz(10,bodyScale),{bold:true,color:'$muted'}));});
  } else if(p.variant==='C'){
    e.push(line('timeline',8,54,92,54,'$ink',2));ss.slice(0,5).forEach((it,i)=>{const x=12+i*(76/Math.max(1,Math.min(4,ss.length-1)));e.push(ellipse(`d${i}`,x,50.5,4.5,7,'$accent','$accent',0));e.push(text(`mt${i}`,x-7,34,18,7,it.title||it.label||'',fsz(11,titleScale),{bold:true,align:'center'}));e.push(text(`mp${i}`,x-7,61,18,6,it.period||it.text||'',fsz(9,bodyScale),{bold:true,color:'$muted',align:'center'}));});
  } else if(p.variant==='D'){
    const labels=['NOW','NEXT','LATER'];ss.slice(0,3).forEach((it,i)=>{const x=5+i*31;e.push(rect(`c${i}`,x,31,27,43,i===0?'$ink':'$paper','$ink',1.3));e.push(text(`lab${i}`,x+2,35,23,5,labels[i],10,{bold:true,color:i===0?'$signal':'$muted'}));e.push(text(`tit${i}`,x+2,47,23,7,it.title||'',fsz(17,titleScale),{bold:true,color:i===0?'$paper':'$ink'}));e.push(text(`txt${i}`,x+2,59,23,9,it.text||it.period||'',fsz(10,bodyScale),{bold:true,color:i===0?'$paper':'$muted'}));});
  } else if(p.variant==='E'){
    ss.slice(0,5).forEach((it,i)=>{const y=30+i*10,pct=Math.max(0,Math.min(100,Number(it.progress??0)));e.push(text(`pt${i}`,5,y,25,5,it.title||it.label||'',fsz(10,titleScale),{bold:true}));e.push(rect(`track${i}`,31,y,55,4,'$paper','$muted',.5));e.push(rect(`prog${i}`,31,y,55*pct/100,4,i===0?'$accent':'$ink',i===0?'$accent':'$ink',0));e.push(text(`pv${i}`,88,y-1,7,5,`${pct}%`,9,{bold:true,align:'right'}));});
  } else {
    const use=ss.slice(0,4);e.push(line('road',8,55,92,55,'$muted',2));use.forEach((it,i)=>{const x=7+i*23;e.push(rect(`phase${i}`,x,31,20,20,i===0?'$accent':i===use.length-1?'$ink':'$paper','$ink',1.2));e.push(text(`pt${i}`,x+2,35,16,6,it.title||it.label||'',fsz(12,titleScale),{bold:true,color:(i===0||i===use.length-1)?'$paper':'$ink',align:'center'}));e.push(text(`pp${i}`,x+2,44,16,5,it.period||'',fsz(9,bodyScale),{bold:true,color:(i===0||i===use.length-1)?'$paper':'$muted',align:'center'}));e.push(ellipse(`dot${i}`,x+8,51.5,4,7,i===0?'$accent':'$ink',i===0?'$accent':'$ink',0));});
  }
  return e;
}
function ed11(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true}));
  if(p.variant==='B'){
    const as=actions(c); if(as.length<2) throw new Error(`${p.id}: content.actions needs >=2`); e.push(text('hdr1',5,30,42,5,'WHAT',9,{bold:true,color:'$muted'}));e.push(text('hdr2',50,30,18,5,'WHO',9,{bold:true,color:'$muted'}));e.push(text('hdr3',72,30,20,5,'WHEN',9,{bold:true,color:'$muted'}));as.slice(0,5).forEach((a,i)=>{const y=38+i*9;e.push(line(`r${i}`,5,y-2,95,y-2,'$muted',.7));e.push(text(`what${i}`,5,y,40,5,a.what||a.title||'',fsz(11,titleScale),{bold:true}));e.push(text(`who${i}`,50,y,18,5,a.who||'',fsz(10,bodyScale),{bold:true}));e.push(text(`when${i}`,72,y,20,5,a.when||'',fsz(10,bodyScale),{bold:true,align:'right'}));});
  } else if(p.variant==='C'){
    e.push(text('question',5,30,48,18,c.question||c.ask||'意思決定いただきたいこと',fsz(31,titleScale),{bold:true}));e.push(rect('askbox',60,26,35,46,'$ink','$ink',0));e.push(text('asklabel',64,31,27,5,'DECISION ASK',10,{bold:true,color:'$signal'}));e.push(text('ask',64,42,27,17,c.ask||c.decision||'',fsz(20,titleScale),{bold:true,color:'$paper'}));if(c.deadline)e.push(text('deadline',64,64,27,5,c.deadline,fsz(10,bodyScale),{bold:true,color:'$paper'}));
  } else if(p.variant==='D'){
    const as=actions(c); if(as.length<3) throw new Error(`${p.id}: content.actions needs >=3`);as.slice(0,3).forEach((a,i)=>{const x=5+i*31;e.push(rect(`card${i}`,x,32,27,42,i===0?'$ink':'$paper','$ink',1.3));e.push(text(`n${i}`,x+2,36,5,5,String(i+1).padStart(2,'0'),11,{bold:true,color:i===0?'$signal':'$accent'}));e.push(text(`t${i}`,x+2,48,23,8,a.title||a.what||'',fsz(17,titleScale),{bold:true,color:i===0?'$paper':'$ink'}));e.push(text(`b${i}`,x+2,61,23,7,a.text||a.commitment||'',fsz(10,bodyScale),{bold:true,color:i===0?'$paper':'$muted'}));});
  } else if(p.variant==='E'){
    const rs=items(c); if(rs.length<2) throw new Error(`${p.id}: content.items needs >=2`);rs.slice(0,4).forEach((r,i)=>{const y=31+i*12;e.push(rect(`risk${i}`,5,y,36,9,'$paper','$ink',1));e.push(text(`rt${i}`,8,y+2,30,5,r.risk||r.title||'',fsz(10,titleScale),{bold:true}));e.push(text(`arrow${i}`,45,y+2,8,5,'→',12,{bold:true,color:'$accent',align:'center'}));e.push(rect(`cnt${i}`,56,y,39,9,i===0?'$ink':'$paper','$ink',1));e.push(text(`ct${i}`,59,y+2,33,5,r.countermeasure||r.text||'',fsz(10,bodyScale),{bold:true,color:i===0?'$paper':'$ink'}));});
  } else {
    const as=actions(c); if(as.length<3) throw new Error(`${p.id}: content.actions needs >=3`);as.slice(0,3).forEach((a,i)=>{const y=31+i*14;e.push(text(`n${i}`,5,y,8,8,String(i+1).padStart(2,'0'),20,{bold:true,color:'$accent'}));e.push(text(`t${i}`,16,y,34,6,a.title||a.what||'',fsz(15,titleScale),{bold:true}));e.push(text(`b${i}`,53,y,36,7,a.text||a.detail||'',fsz(10,bodyScale),{bold:true,color:'$muted'}));e.push(line(`l${i}`,5,y+9,95,y+9,'$muted',.7));});
  }
  return e;
}
function ed12(slide,p){
  const c=slide.content||{}, {titleScale,bodyScale}=dims(slide),e=common(slide,p); if(c.title)e.push(text('title',5,14,80,9,c.title,fsz(29,titleScale),{bold:true}));
  if(p.variant==='A'){
    const ss=stages(c); if(ss.length<3) throw new Error(`${p.id}: content.stages needs >=3`);ss.slice(0,5).forEach((it,i)=>{const x=5+i*18;e.push(ellipse(`n${i}`,x+5,35,7,10,i===0?'$accent':'$paper','$ink',1));e.push(text(`num${i}`,x+6.2,38,4.6,4,String(i+1),10,{bold:true,color:i===0?'$paper':'$ink',align:'center'}));e.push(text(`t${i}`,x,50,17,7,it.title||it.label||'',fsz(10,titleScale),{bold:true,align:'center'}));e.push(text(`b${i}`,x,61,17,8,it.text||'',fsz(9,bodyScale),{bold:true,color:'$muted',align:'center'}));if(i<ss.length-1)e.push(line(`c${i}`,x+12,40,x+18,40,'$muted',1,{connector:true}));});
  } else if(p.variant==='B'){
    const defs=items(c); if(defs.length<2) throw new Error(`${p.id}: content.items needs >=2`);defs.slice(0,6).forEach((it,i)=>{const col=i%2,row=Math.floor(i/2),x=5+col*46,y=30+row*16;e.push(rect(`d${i}`,x,y,42,12,'$paper','$ink',1));e.push(text(`dt${i}`,x+2,y+2,14,5,it.term||it.title||'',fsz(10,titleScale),{bold:true,color:'$accent'}));e.push(text(`dd${i}`,x+17,y+2,22,7,it.definition||it.text||'',fsz(9,bodyScale),{bold:true,color:'$muted'}));});
  } else if(p.variant==='C' || p.variant==='E'){
    const rows=Array.isArray(c.rows)?c.rows:items(c); if(rows.length<1) throw new Error(`${p.id}: content.rows needs >=1`); const cols=c.columns||['項目','定義','値'];const widths=[28,42,20];let x=5;cols.slice(0,3).forEach((col,i)=>{e.push(rect(`h${i}`,x,29,widths[i],8,'$ink','$ink',0));e.push(text(`ht${i}`,x+1.5,31,widths[i]-3,4,col,9,{bold:true,color:'$paper'}));x+=widths[i]});rows.slice(0,6).forEach((r,ri)=>{let xx=5;const vals=Array.isArray(r)?r:[r[cols[0]]??r.label??'',r[cols[1]]??r.text??'',r[cols[2]]??r.value??''];vals.slice(0,3).forEach((val,ci)=>{e.push(rect(`r${ri}c${ci}`,xx,37+ri*8,widths[ci],8,ri%2?'$paper':'$bg','$muted',.5));e.push(text(`rt${ri}c${ci}`,xx+1.5,39+ri*8,widths[ci]-3,4,String(val??''),8.8,{bold:ci===0,color:ci===0?'$ink':'$muted'}));xx+=widths[ci]});});
  } else if(p.variant==='D'){
    const as=items(c); if(as.length<2) throw new Error(`${p.id}: content.items needs >=2`);as.slice(0,6).forEach((it,i)=>{const y=30+i*9;e.push(text(`n${i}`,5,y,6,5,String(i+1).padStart(2,'0'),10,{bold:true,color:'$accent'}));e.push(text(`t${i}`,14,y,25,5,it.title||it.label||'',fsz(10,titleScale),{bold:true}));e.push(text(`b${i}`,42,y,48,5,it.text||it.assumption||'',fsz(9,bodyScale),{bold:true,color:'$muted'}));});
  }
  return e;
}

const RESOLVERS={ED01:ed01,ED02:ed02,ED03:ed03,ED04:ed04,ED05:ed05,ED06:ed06,ED07:ed07,ED08:ed08,ED09:ed09,ED10:ed10,ED11:ed11,ED12:ed12};
function resolveSlide(slide){
  const p=normalizePattern(slide.pattern); const fn=RESOLVERS[p.family]; const theme=slide.theme||req.deck?.defaultTheme||'TH01'; if(!THEMES[theme]) throw new Error(`${slide.id}: unknown theme ${theme}`); const els=fn(slide,p); return {id:slide.id,theme,background:slide.background||'$bg',meta:{pattern:p.id,density:slide.density||req.deck?.defaultDensity||'MED',composition:slide.composition||req.deck?.defaultComposition||'CM02',renderProfile:slide.renderProfile||req.deck?.renderProfile||'PPT-SAFE-v1.3',title:slide.content?.title||slide.content?.message||''},notes:slide.notes||'',elements:els};
}
const out={version:'1.0',profile:'SCENE-DECK-v1',deck:{title:req.deck?.title||'',author:req.deck?.author||'OpenAI',subject:req.deck?.subject||'',company:req.deck?.company||'',lang:req.deck?.lang||'ja-JP',defaultTheme:req.deck?.defaultTheme||'TH01',fonts:req.deck?.fonts||{jp:'Yu Gothic',latin:'Aptos'}},themes:THEMES,slides:req.slides.map(resolveSlide)};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');
console.log(output);
