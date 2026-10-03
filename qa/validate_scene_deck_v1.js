#!/usr/bin/env node
const fs=require('fs');
const input=process.argv[2];
const reportPath=process.argv[3];
if(!input){console.error('usage: node validate_scene_deck_v1.js scene-deck.json [report.json]');process.exit(2)}
const deck=JSON.parse(fs.readFileSync(input,'utf8'));
const errors=[],warnings=[];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function issue(arr,slideId,elId,code,msg){arr.push({slide:slideId,element:elId||null,code,message:msg});}
if(deck.profile!=='SCENE-DECK-v1') errors.push({code:'profile',message:'profile must be SCENE-DECK-v1'});
if(!Array.isArray(deck.slides)||!deck.slides.length) errors.push({code:'slides',message:'slides must be a non-empty array'});
let elementCount=0,textCount=0,minFont=Infinity;
for(const slide of deck.slides||[]){
  if(!slide.id) issue(errors,'?',null,'slide_id','slide.id missing');
  if(!Array.isArray(slide.elements)){issue(errors,slide.id,null,'elements','elements missing');continue;}
  for(const [idx,e] of slide.elements.entries()){
    elementCount++;
    const id=e.id||`${e.type||'element'}#${idx+1}`;
    if(!e.type){issue(errors,slide.id,id,'type','element type missing');continue;}
    if(['text','rect','roundRect','ellipse','image','chart'].includes(e.type)){
      for(const k of ['x','y','w','h']) if(!finite(e[k])) issue(errors,slide.id,id,'geometry_missing',`${k} must be finite number`);
      if(['x','y','w','h'].every(k=>finite(e[k]))){
        if(e.x<0||e.y<0||e.w<0||e.h<0||e.x+e.w>100.0001||e.y+e.h>100.0001)
          issue(errors,slide.id,id,'out_of_bounds',`bbox ${e.x},${e.y},${e.w},${e.h} exceeds 0..100 canvas`);
        if(e.w===0||e.h===0) issue(warnings,slide.id,id,'zero_size','zero width/height');
      }
    }
    if(['line','connector'].includes(e.type)){
      for(const k of ['x1','y1','x2','y2']) if(!finite(e[k])) issue(errors,slide.id,id,'line_geometry_missing',`${k} must be finite number`);
      if(['x1','y1','x2','y2'].every(k=>finite(e[k]))&&[e.x1,e.y1,e.x2,e.y2].some(v=>v<0||v>100))
        issue(errors,slide.id,id,'line_out_of_bounds','line/connector endpoint outside 0..100');
    }
    if(e.type==='text'){
      textCount++;
      const size=Number(e.style?.fontSize||18);
      if(Number.isFinite(size)){minFont=Math.min(minFont,size);if(size<8.5) issue(warnings,slide.id,id,'small_font',`fontSize ${size}pt < 8.5pt`);}
      const text=Array.isArray(e.runs)?e.runs.map(r=>r.text||'').join(''):String(e.text||'');
      if(!text.trim()) issue(warnings,slide.id,id,'empty_text','text element is empty');
      if(finite(e.w)&&finite(e.h)&&e.w*e.h>0){const density=text.replace(/\s/g,'').length/(e.w*e.h);if(density>1.2) issue(warnings,slide.id,id,'high_text_density',`character density ${density.toFixed(2)} may overflow`);}
    }
  }
}
const report={profile:'SCENE-GEOMETRY-QA-v1',file:input,slides:(deck.slides||[]).length,elements:elementCount,textElements:textCount,minFontPt:minFont===Infinity?null:minFont,errors,warnings,pass:errors.length===0};
if(reportPath) fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8');
console.log(`${report.pass?'PASS':'FAIL'}: ${report.slides} slides / ${elementCount} elements / ${errors.length} errors / ${warnings.length} warnings${report.minFontPt?` / min font ${report.minFontPt}pt`:''}`);
if(errors.length){for(const x of errors) console.error(`${x.slide||''} ${x.element||''} ${x.code}: ${x.message}`);process.exit(1)}
