#!/usr/bin/env node
const fs=require('fs');
const input=process.argv[2];
const reportPath=process.argv[3];
if(!input){console.error('usage: node validate_typography_density_v1.js scene-deck.json [report.json]');process.exit(2)}
const deck=JSON.parse(fs.readFileSync(input,'utf8'));
const MIN_FONT=8.5;
const errors=[],warnings=[];
const issue=(arr,slide,element,code,message,extra={})=>arr.push({slide,element,code,message,...extra});
let minFont=Infinity,textElements=0,highDensity=0;
function textOf(e){return Array.isArray(e.runs)?e.runs.map(r=>String(r.text||'')).join(''):String(e.text||'')}
function visualChars(s){let n=0;for(const ch of s.replace(/\r/g,'')){if(ch==='\n'){n+=2;continue;}if(/\s/.test(ch)){n+=0.25;continue;}n += /[\x00-\x7F]/.test(ch)?0.58:1.0;}return n}
function capacity(e,size){const wpx=(Number(e.w)||0)*16;const hpx=(Number(e.h)||0)*9;const fpx=size*96/72;const lineHeight=Number(e.style?.lineHeight||1.15);const charsPerLine=Math.max(1,wpx/(fpx*0.92));const lines=Math.max(1,hpx/(fpx*lineHeight));return charsPerLine*lines*0.82}
for(const slide of deck.slides||[]){
  for(const [idx,e] of (slide.elements||[]).entries()){
    if(e.type!=='text')continue;textElements++;
    const id=e.id||`text#${idx+1}`;
    const size=Number(e.style?.fontSize||18);if(Number.isFinite(size))minFont=Math.min(minFont,size);
    if(!Number.isFinite(size)||size<MIN_FONT-1e-9)issue(errors,slide.id,id,'font_below_floor',`fontSize ${size}pt < ${MIN_FONT}pt`,{fontSize:size,minFontPt:MIN_FONT});
    const txt=textOf(e).trim();if(!txt)continue;
    const cap=capacity(e,size),demand=visualChars(txt),ratio=cap?demand/cap:99;
    if(size<16){
      if(ratio>1.25){issue(errors,slide.id,id,'density_overload',`estimated text load ${(ratio*100).toFixed(0)}% exceeds hard limit`,{loadRatio:+ratio.toFixed(3)});highDensity++;}
      else if(ratio>0.90){issue(warnings,slide.id,id,'density_tight',`estimated text load ${(ratio*100).toFixed(0)}% leaves little rendering margin`,{loadRatio:+ratio.toFixed(3)});highDensity++;}
    }
    const contentChars=txt.replace(/\s/g,'').length;
    if(contentChars>110&&size<=10.5)issue(warnings,slide.id,id,'small_dense_copy','long copy is paired with near-minimum typography; prefer edit/split over shrinking',{characters:contentChars,fontSize:size});
  }
}
const report={profile:'TYPOGRAPHY-DENSITY-QA-v1',file:input,slides:(deck.slides||[]).length,textElements,minFontPt:minFont===Infinity?null:minFont,minRequiredPt:MIN_FONT,errors,warnings,highDensityFindings:highDensity,pass:errors.length===0};
if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8');
console.log(`${report.pass?'PASS':'FAIL'}: ${report.slides} slides / ${textElements} text / min ${report.minFontPt}pt / ${errors.length} errors / ${warnings.length} warnings`);
if(errors.length){for(const x of errors)console.error(`${x.slide} ${x.element} ${x.code}: ${x.message}`);process.exit(1)}
