const fs = require('fs');
const pptxgen = require('pptxgenjs');

const input = process.argv[2];
const output = process.argv[3] || '/mnt/data/ai_order_compiled_from_review.pptx';
if (!input) { console.error('usage: node compile_ai_order_review_to_ppt.js review.json [output.pptx]'); process.exit(2); }
const review = JSON.parse(fs.readFileSync(input,'utf8'));
const selections = review.selections || review.deckPlan || {};

function sel(n){
  if (typeof selections === 'object' && !Array.isArray(selections)) return selections[String(n)] || selections[n] || null;
  if (Array.isArray(selections)) {
    const r = selections.find(x => Number(x.slide)===n);
    return r && (r.selectedVariant || r.variant) || null;
  }
  return null;
}

const slidesData=[
 {no:1,ed:'ED01',role:'OPENING',k:'AI ORDER / REVIEW',title:'AIオーダーは、\n自動化だけでは完成しない。',sub:'導入39店。発注時間を減らしながら、修正の質・棚割・在庫精度まで含めて運用を成熟させる。',metric:'39店'},
 {no:2,ed:'ED03',role:'KEY NUMBER',k:'KEY METRICS',title:'修正は残る。\n売変も自動では改善しない。',sub:'自動化後も人の修正は一定量残る。見るべきは“修正回数”より、理由と結果。',metrics:[['22.27%','修正あり率'],['5.81%','導入後 売変率'],['+0.58pt','導入前比'],['0.39','修正率×売変率変化']]},
 {no:3,ed:'ED08',role:'DATA STORY',k:'DATA STORY',title:'“修正する店ほど悪い”\nとは言い切れない。',sub:'修正率と売変率変化には中程度の関係。回数ではなく、修正の意図・タイミング・例外運用を見る。',metric:'r = 0.39'},
 {no:4,ed:'ED06',role:'PROBLEM → SOLUTION',k:'CAUSE',title:'効かない修正は、\n運用に理由がある。',sub:'修正を一括りにせず、意味のある介入とノイズを分ける。',causes:['数値丸め','軽微変更','納品日都合','理由なし前日修正','AI推奨値との乖離']},
 {no:5,ed:'ED07',role:'FLOW',k:'OPERATION',title:'AI推奨 → 人の修正 →\n結果学習までを一本化。',sub:'週起案、前日修正、納品、売上・在庫確認を一つの運用フローとして設計し、修正理由を次回判断に残す。',flow:[['AI','推奨値','週起案'],['担当者','理由付き修正','前日確認'],['物流','納品','例外処理'],['分析','売上・在庫','次回学習']]},
 {no:6,ed:'ED11',role:'ACTION',k:'NEXT ACTION',title:'重点3店舗で、\n修正の“質”を改善する。',sub:'修正率を下げること自体を目的にせず、売変・在庫・欠品を含めて改善を見る。',actions:[['01','修正理由','修正の意図を残す'],['02','棚割 / MinMax','設定精度を上げる'],['03','例外商品','運用ルールを固定']]}
];

for (let i=1;i<=6;i++) if (!['A','B','C'].includes(sel(i))) { console.error(`slide ${i}: selection missing; expected A/B/C`); process.exit(3); }

const pptx = new pptxgen();
pptx.layout='LAYOUT_WIDE'; pptx.author='OpenAI'; pptx.lang='ja-JP';
pptx.theme={headFontFace:'Yu Gothic',bodyFontFace:'Yu Gothic',lang:'ja-JP'};
const C={A:{bg:'F3F0E7',ink:'111111',accent:'D2471D',signal:'F6B72B',paper:'FAF8F2',muted:'6C675E'},B:{bg:'FAFAF7',ink:'151515',accent:'315E9A',signal:'F2C84B',paper:'EEF2F6',muted:'68717C'},C:{bg:'EAF3F6',ink:'102A43',accent:'117A8B',signal:'54D4D9',paper:'F6FBFC',muted:'557187'}};
const JP='Yu Gothic', EN='Aptos';
const addText=(sl,t,x,y,w,h,o={})=>sl.addText(t,{x,y,w,h,fontFace:o.font||JP,fontSize:o.fs||18,bold:o.bold||false,color:o.color||'111111',margin:0,align:o.align||'left',valign:o.valign||'top',breakLine:false,fit:'shrink',charSpacing:o.tracking||undefined});
const rect=(sl,x,y,w,h,fill,line='111111',pt=1.5)=>sl.addShape(pptx.ShapeType.rect,{x,y,w,h,fill:{color:fill},line:{color:line,pt}});
const line=(sl,x,y,w,h,color='111111',pt=1.5)=>sl.addShape(pptx.ShapeType.line,{x,y,w,h,line:{color,pt}});
const ell=(sl,x,y,w,h,fill,lineColor=fill)=>sl.addShape(pptx.ShapeType.ellipse,{x,y,w,h,fill:{color:fill},line:{color:lineColor,pt:0.5}});

function meta(sl,s,v,p){
  addText(sl,s.k,0.62,0.34,3.4,0.25,{font:EN,fs:9.5,bold:true,color:p.ink,tracking:1.3});
  addText(sl,`${s.ed} / ${s.role}`,9.4,0.30,3.25,0.28,{font:EN,fs:8.5,bold:true,color:p.muted,align:'right',tracking:.6});
  addText(sl,`${String(s.no).padStart(2,'0')}  •  ${v}`,0.34,7.08,2.4,0.22,{font:EN,fs:8.3,bold:true,color:p.muted});
}

function drawA(sl,s,p){
  meta(sl,s,'A',p); line(sl,.62,.82,12.0,0,p.ink,1.2);
  if(s.no===1){
    addText(sl,s.title,.64,1.45,8.2,1.65,{fs:38,bold:true,color:p.ink});
    addText(sl,s.sub,.66,5.55,6.6,.95,{fs:15,bold:true,color:p.ink});
    rect(sl,9.7,1.52,2.75,4.25,p.ink,p.ink,1.2);
    addText(sl,'ADOPTION',10.0,1.86,2.1,.28,{font:EN,fs:9.5,bold:true,color:p.signal,tracking:1});
    addText(sl,s.metric,9.96,2.85,2.2,.78,{font:EN,fs:45,bold:true,color:'FFF9F4',align:'center'});
    addText(sl,'導入店舗',10.16,4.3,1.8,.3,{fs:12,bold:true,color:'FFF9F4',align:'center'});
    rect(sl,9.7,6.03,2.75,.58,p.accent,p.accent,0); addText(sl,'AUTOMATION ≠ OUTCOME',9.85,6.16,2.45,.18,{font:EN,fs:8.8,bold:true,color:'FFF9F4',align:'center'});
  }
  if(s.no===2){
    addText(sl,s.title,.64,1.2,7.6,1.25,{fs:32,bold:true,color:p.ink});
    addText(sl,s.sub,.64,2.65,9.4,.55,{fs:13,bold:true,color:p.muted});
    const xs=[.64,3.77,6.9,10.03];
    s.metrics.forEach((m,i)=>{const fill=i===1?p.ink:i===2?p.accent:p.paper; const col=(i===1||i===2)?'FFF9F4':p.ink; rect(sl,xs[i],3.72,2.62,2.35,fill,i===2?p.accent:p.ink,1.3);addText(sl,m[0],xs[i]+.18,4.2,2.26,.52,{font:EN,fs:i===2?23:25,bold:true,color:col,align:'center'});addText(sl,m[1],xs[i]+.18,5.35,2.26,.35,{fs:10.5,bold:true,color:col,align:'center'});});
  }
  if(s.no===3){
    addText(sl,s.title,.64,1.2,5.4,1.4,{fs:31,bold:true,color:p.ink}); addText(sl,s.sub,.64,4.9,4.55,1.0,{fs:13,bold:true,color:p.ink});
    rect(sl,6.2,1.45,6.1,4.95,p.paper,p.ink,1.3); line(sl,6.82,5.72,4.8,0,p.ink,1); line(sl,6.82,2.0,0,3.72,p.ink,1);
    [[7.35,5.0,0],[7.8,4.48,0],[8.4,4.62,1],[8.96,4.0,0],[9.45,4.15,0],[10.1,3.52,1],[10.8,3.08,0],[11.46,2.78,1]].forEach(([x,y,r])=>ell(sl,x,y,.11,.11,r?p.accent:p.ink));
    line(sl,7.2,5.05,4.15,-2.1,p.accent,2.1); rect(sl,10.15,1.78,1.55,.6,p.signal,p.ink,1); addText(sl,s.metric,10.25,1.94,1.35,.22,{font:EN,fs:12,bold:true,color:p.ink,align:'center'});
  }
  if(s.no===4){
    addText(sl,s.title,.64,1.2,7.1,1.4,{fs:32,bold:true,color:p.ink}); addText(sl,s.sub,.64,2.72,6.6,.5,{fs:13,bold:true,color:p.muted});
    const xs=[.64,3.05,5.46,7.87,10.28]; s.causes.forEach((x,i)=>{const fill=i===3?p.ink:i===4?p.accent:p.paper;const col=(i>=3)?'FFF9F4':p.ink;rect(sl,xs[i],3.8,2.03,2.3,fill,i===4?p.accent:p.ink,1.3);addText(sl,String(i+1).padStart(2,'0'),xs[i]+.12,4.1,.55,.28,{font:EN,fs:11,bold:true,color:i===3?p.signal:col});addText(sl,x,xs[i]+.16,4.72,1.7,.75,{fs:12.5,bold:true,color:col});});
  }
  if(s.no===5){
    addText(sl,s.title,.64,1.15,9.8,1.3,{fs:30,bold:true,color:p.ink}); addText(sl,s.sub,.64,2.55,9.6,.5,{fs:12.5,bold:true,color:p.muted}); const xs=[.64,3.74,6.84,9.94];
    s.flow.forEach((f,i)=>{const fill=i===1?p.ink:i===3?p.accent:p.paper;const col=(i===1||i===3)?'FFF9F4':p.ink;rect(sl,xs[i],3.72,2.6,2.35,fill,i===3?p.accent:p.ink,1.3);addText(sl,f[0],xs[i]+.18,4.05,2.2,.3,{font:EN,fs:10,bold:true,color:i===1?p.signal:col,align:'center'});addText(sl,f[1],xs[i]+.18,4.7,2.2,.35,{fs:13,bold:true,color:col,align:'center'});addText(sl,f[2],xs[i]+.18,5.38,2.2,.28,{fs:10,bold:true,color:col,align:'center'}); if(i<3)addText(sl,'→',xs[i]+2.64,4.75,.4,.34,{font:EN,fs:16,bold:true,color:p.ink,align:'center'});});
  }
  if(s.no===6){
    addText(sl,s.title,.64,1.28,6.5,1.45,{fs:32,bold:true,color:p.ink}); addText(sl,s.sub,.64,3.05,5.8,.72,{fs:13,bold:true,color:p.muted});
    const ys=[1.6,3.2,4.8]; s.actions.forEach((a,i)=>{rect(sl,7.35,ys[i],5.0,1.28,p.paper,p.ink,1.3);addText(sl,a[0],7.58,ys[i]+.25,.6,.38,{font:EN,fs:18,bold:true,color:i===2?p.accent:p.ink});addText(sl,a[1],8.45,ys[i]+.18,2.0,.3,{fs:14,bold:true,color:p.ink});addText(sl,a[2],8.45,ys[i]+.62,3.4,.28,{fs:10.5,bold:true,color:p.muted});}); addText(sl,'NEXT 3',.64,6.15,3.0,.52,{font:EN,fs:28,bold:true,color:p.accent});
  }
}

function drawB(sl,s,p){
  meta(sl,s,'B',p);
  if(s.no===1){
    addText(sl,s.title,.64,1.08,6.2,1.45,{fs:31,bold:true,color:p.ink}); addText(sl,'導入効果は、時間短縮だけでなく運用精度まで含めて評価する。',.64,6.1,5.9,.52,{fs:12.5,bold:true,color:p.ink}); line(sl,.64,5.95,5.9,0,p.ink,1.2);
    rect(sl,7.38,1.05,5.25,4.85,p.paper,p.ink,1.3); addText(sl,s.metric,7.72,1.6,4.55,.85,{font:EN,fs:55,bold:true,color:p.accent}); addText(sl,s.sub,7.72,3.15,4.25,1.5,{fs:14,bold:true,color:p.ink});
  }
  if(s.no===2){
    addText(sl,s.title,.64,1.0,9.6,1.25,{fs:29,bold:true,color:p.ink}); const xs=[.64,3.77,6.9,10.03]; s.metrics.forEach((m,i)=>{line(sl,xs[i],2.55,2.62,0,i===1?p.accent:p.ink,5);addText(sl,m[0],xs[i],2.95,2.55,.55,{font:EN,fs:25,bold:true,color:p.ink});addText(sl,m[1],xs[i],3.6,2.55,.3,{fs:10.2,bold:true,color:p.ink});});
    const bh=[.95,1.65,1.32,1.12],bx=[1.0,3.85,6.7,9.55]; bx.forEach((x,i)=>{rect(sl,x,6.25-bh[i],1.35,bh[i],i===1?p.accent:p.ink,i===1?p.accent:p.ink,0); addText(sl,['修正','売変','在庫','例外'][i],x,6.42,1.35,.22,{fs:9.5,bold:true,color:p.muted,align:'center'});});
  }
  if(s.no===3){
    addText(sl,s.title,.64,.98,9.6,1.25,{fs:29,bold:true,color:p.ink}); rect(sl,.64,2.6,7.05,3.85,p.paper,p.ink,1.2); line(sl,1.25,5.85,5.65,-2.0,p.accent,2.2); [[1.6,5.35],[2.3,4.75],[3.15,5.0],[4.05,4.18],[4.95,4.4],[5.85,3.65],[6.55,3.32]].forEach((d,i)=>ell(sl,d[0],d[1],.12,.12,i%3===1?p.accent:p.ink));
    rect(sl,8.1,2.6,4.55,3.85,'FFFFFF',p.ink,1.2); addText(sl,'CORRELATION',8.42,2.95,2.1,.25,{font:EN,fs:9.5,bold:true,color:p.muted,tracking:1}); addText(sl,s.metric,8.42,3.65,3.5,.65,{font:EN,fs:42,bold:true,color:p.accent}); addText(sl,s.sub,8.42,4.65,3.55,1.15,{fs:12.3,bold:true,color:p.ink});
  }
  if(s.no===4){
    addText(sl,s.title,.64,.98,9.5,1.25,{fs:29,bold:true,color:p.ink}); const labels=['頻出','軽微','物流起因','要確認','重点']; s.causes.forEach((x,i)=>{const y=2.4+i*.76;line(sl,.64,y,12.0,0,'C9CED4',1);addText(sl,String(i+1).padStart(2,'0'),.72,y+.12,.6,.25,{font:EN,fs:10,bold:true,color:p.ink});addText(sl,x,1.55,y+.1,6.3,.28,{fs:12.5,bold:true,color:p.ink});addText(sl,labels[i],10.0,y+.1,2.1,.28,{fs:11,bold:true,color:p.accent,align:'right'});});
  }
  if(s.no===5){
    addText(sl,s.title,.64,.98,10.0,1.25,{fs:28,bold:true,color:p.ink}); const xs=[.64,3.75,6.86,9.97]; s.flow.forEach((f,i)=>{rect(sl,xs[i],3.1,2.7,2.55,i===2?p.accent:'FFFFFF',i===2?p.accent:p.ink,1.2);addText(sl,f[0],xs[i]+.18,3.42,2.3,.3,{font:EN,fs:11,bold:true,color:i===2?'FFFFFF':p.ink,align:'center'});addText(sl,`${f[1]}\n${f[2]}`,xs[i]+.18,4.3,2.3,.75,{fs:13,bold:true,color:i===2?'FFFFFF':p.ink,align:'center'});});
  }
  if(s.no===6){
    addText(sl,s.title,.64,.98,9.5,1.25,{fs:30,bold:true,color:p.ink}); const ys=[2.45,3.65,4.85]; s.actions.forEach((a,i)=>{line(sl,.64,ys[i],12.0,0,p.ink,1.2);addText(sl,a[0],.7,ys[i]+.2,.65,.3,{font:EN,fs:17,bold:true,color:p.accent});addText(sl,`${a[1]} — ${a[2]}`,1.65,ys[i]+.18,7.8,.34,{fs:13,bold:true,color:p.ink});addText(sl,'担当 / 期限',10.2,ys[i]+.18,1.9,.3,{fs:10,bold:true,color:p.muted,align:'right'});});
  }
}

function drawC(sl,s,p){
  for(let x=.35;x<13.1;x+=.34) line(sl,x,.0,0,7.5,'D5E6EA',.25);
  for(let y=.2;y<7.4;y+=.34) line(sl,0,y,13.33,0,'D5E6EA',.25);
  meta(sl,s,'C',p); rect(sl,.62,.58,2.7,.4,p.bg,p.ink,1); addText(sl,`${s.ed} / ${s.role}`,.76,.69,2.35,.16,{font:EN,fs:8.5,bold:true,color:p.ink,tracking:.7});
  if(s.no===1){
    addText(sl,s.title,.64,1.35,7.8,1.5,{fs:33,bold:true,color:p.ink}); addText(sl,s.sub,.64,5.95,7.8,.55,{fs:12.5,bold:true,color:p.ink}); rect(sl,9.15,1.25,3.25,4.55,p.paper,p.ink,1.3); addText(sl,s.metric,9.45,1.8,2.65,.7,{font:EN,fs:45,bold:true,color:p.accent}); addText(sl,'STATUS: RUNNING\nMODEL: AI ORDER\nSTORE: 39\nLEAD: 2 DAYS\nMODE: HUMAN-IN-LOOP',9.5,3.0,2.45,1.9,{font:EN,fs:11,bold:true,color:p.ink});
  }
  if(s.no===2){
    addText(sl,s.title,.64,1.1,9.6,1.25,{fs:29,bold:true,color:p.ink}); const coords=[[.64,3.25],[6.78,3.25],[.64,5.05],[6.78,5.05]]; s.metrics.forEach((m,i)=>{rect(sl,coords[i][0],coords[i][1],5.55,1.35,p.paper,p.ink,1.2);addText(sl,m[0],coords[i][0]+.25,coords[i][1]+.28,1.75,.5,{font:EN,fs:25,bold:true,color:p.accent});addText(sl,m[1],coords[i][0]+2.2,coords[i][1]+.38,2.95,.32,{fs:12.5,bold:true,color:p.ink});});
  }
  if(s.no===3){
    addText(sl,s.title,.64,1.05,9.6,1.2,{fs:28,bold:true,color:p.ink}); rect(sl,.64,2.45,12.0,3.75,p.paper,p.ink,1.2);
    const nodes=[{x:1.55,y:3.7,w:1.65,t:'修正率',fill:p.bg,col:p.ink},{x:5.4,y:3.15,w:2.1,t:'修正理由',fill:p.accent,col:'FFFFFF'},{x:9.5,y:4.2,w:2.0,t:'売変率変化',fill:p.bg,col:p.ink}]; nodes.forEach(n=>{rect(sl,n.x,n.y,n.w,.7,n.fill,n.fill===p.accent?p.accent:p.ink,1.1);addText(sl,n.t,n.x+.08,n.y+.22,n.w-.16,.2,{fs:11.5,bold:true,color:n.col,align:'center'});});
    line(sl,3.2,4.04,2.2,-.45,p.ink,1.5); line(sl,7.5,3.52,2.0,.88,p.ink,1.5); addText(sl,s.metric,10.0,5.42,2.1,.5,{font:EN,fs:28,bold:true,color:p.accent,align:'right'});
  }
  if(s.no===4){
    addText(sl,s.title,.64,1.05,9.7,1.25,{fs:29,bold:true,color:p.ink}); const xs=[.64,3.07,5.5,7.93,10.36]; s.causes.forEach((x,i)=>{rect(sl,xs[i],3.6,2.0,1.95,p.paper,p.ink,1.2);addText(sl,String(i+1).padStart(2,'0'),xs[i]+.16,3.92,.55,.35,{font:EN,fs:14,bold:true,color:p.accent});addText(sl,x,xs[i]+.16,4.65,1.68,.55,{fs:11.5,bold:true,color:p.ink});});
  }
  if(s.no===5){
    addText(sl,s.title,.64,1.0,9.8,1.25,{fs:28,bold:true,color:p.ink}); const xs=[.64,3.76,6.88,10.0]; s.flow.forEach((f,i)=>{const fill=i===1?p.accent:p.paper;const col=i===1?'FFFFFF':p.ink;rect(sl,xs[i],3.1,2.7,2.65,fill,i===1?p.accent:p.ink,1.2);addText(sl,f[0],xs[i]+.18,3.45,2.3,.3,{fs:13,bold:true,color:col,align:'center'});addText(sl,`${f[1]}\n↓\n${f[2]}`,xs[i]+.18,4.15,2.3,.95,{fs:11.5,bold:true,color:col,align:'center'});});
  }
  if(s.no===6){
    addText(sl,s.title,.64,1.05,9.8,1.25,{fs:30,bold:true,color:p.ink}); const xs=[.64,4.78,8.92]; s.actions.forEach((a,i)=>{rect(sl,xs[i],3.2,3.55,2.6,p.paper,p.ink,1.2);addText(sl,a[0],xs[i]+.22,3.55,.8,.45,{font:EN,fs:22,bold:true,color:p.accent});addText(sl,a[1],xs[i]+.22,4.28,2.7,.34,{fs:14,bold:true,color:p.ink});addText(sl,a[2],xs[i]+.22,4.95,2.7,.55,{fs:11.5,bold:true,color:p.ink});});
  }
}

slidesData.forEach(s=>{ const v=sel(s.no), p=C[v]; const sl=pptx.addSlide(); sl.background={color:p.bg}; if(v==='A')drawA(sl,s,p); else if(v==='B')drawB(sl,s,p); else drawC(sl,s,p); });

pptx.writeFile({fileName:output}).then(()=>console.log(output));
