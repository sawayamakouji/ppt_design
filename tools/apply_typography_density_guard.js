#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const input=process.argv[2];
const output=process.argv[3] || input;
const reportPath=process.argv[4];
if(!input){console.error('usage: node apply_typography_density_guard.js scene-deck.json [output.json] [report.json]');process.exit(2)}
const deck=JSON.parse(fs.readFileSync(input,'utf8'));
const MIN_FONT=8.5;
const operations=[],errors=[],warnings=[];
function textOf(e){return Array.isArray(e.runs)?e.runs.map(r=>String(r.text||'')).join(''):String(e.text||'')}
function visualChars(s){let n=0;for(const ch of String(s).replace(/\r/g,'')){if(ch==='\n'){n+=2;continue;}if(/\s/.test(ch)){n+=0.25;continue;}n += /[\x00-\x7F]/.test(ch)?0.58:1;}return n}
function capacity(e,size){const wpx=(Number(e.w)||0)*16,hpx=(Number(e.h)||0)*9,fpx=size*96/72;const lh=Number(e.style?.lineHeight||1.15);const cpl=Math.max(1,wpx/(fpx*0.92));const lines=Math.max(1,hpx/(fpx*lh));return cpl*lines*0.82}
for(const slide of deck.slides||[]){
  for(const [idx,e] of (slide.elements||[]).entries()){
    if(e.type!=='text')continue;
    e.style=e.style||{};
    const id=e.id||`text#${idx+1}`;
    const size=Number(e.style.fontSize||18);
    const txt=textOf(e).trim();
    if(Number.isFinite(size)&&size<MIN_FONT){
      const ratio=txt?visualChars(txt)/capacity(e,MIN_FONT):0;
      if(size<16 && ratio>1.25){
        errors.push({slide:slide.id,element:id,code:'requires_editorial_reflow',message:`raising ${size}pt to ${MIN_FONT}pt would overload the text box`,loadRatio:+ratio.toFixed(3),recommended:['shorten_copy','change_pattern','split_page','move_detail_to_appendix']});
      }else{
        e.style.fontSize=MIN_FONT;
        operations.push({slide:slide.id,element:id,action:'raise_font_floor',fromPt:size,toPt:MIN_FONT,projectedLoad:+ratio.toFixed(3)});
      }
    }
    const finalSize=Number(e.style.fontSize||18);
    if(txt && finalSize<16){
      const ratio=visualChars(txt)/capacity(e,finalSize);
      if(ratio>1.25)errors.push({slide:slide.id,element:id,code:'density_overload',message:`estimated text load ${(ratio*100).toFixed(0)}% exceeds hard limit`,loadRatio:+ratio.toFixed(3),recommended:['shorten_copy','change_pattern','split_page']});
      else if(ratio>0.90)warnings.push({slide:slide.id,element:id,code:'density_tight',message:`estimated text load ${(ratio*100).toFixed(0)}% leaves little renderer margin`,loadRatio:+ratio.toFixed(3)});
    }
  }
}
const report={profile:'TYPOGRAPHY-DENSITY-GUARD-v1',file:input,output,minFontPt:MIN_FONT,operations,errors,warnings,pass:errors.length===0};
if(reportPath){fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8')}
if(errors.length){console.error(`FAIL: ${errors.length} typography/density errors; no output written`);for(const x of errors)console.error(`${x.slide} ${x.element} ${x.code}: ${x.message}`);process.exit(1)}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(deck,null,2),'utf8');
console.log(`PASS: ${operations.length} font-floor fixes / ${warnings.length} density warnings -> ${output}`);
