#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function usage(){
  console.error('usage: node deck_spec_compiler_v1.js deck-spec.json [--out output-dir] [--no-pptx] [--no-html]');
}
const argv = process.argv.slice(2);
const input = argv[0];
if(!input || input.startsWith('-')){ usage(); process.exit(2); }
let outDir = path.resolve(process.cwd(), 'ppt-design-output');
let makePptx = true;
let makeHtml = true;
for(let i=1;i<argv.length;i++){
  const a=argv[i];
  if(a==='--out'){ outDir=path.resolve(argv[++i]||''); if(!argv[i]){usage();process.exit(2);} }
  else if(a==='--no-pptx') makePptx=false;
  else if(a==='--no-html') makeHtml=false;
  else { console.error(`unknown option: ${a}`); usage(); process.exit(2); }
}

const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const QA = path.join(ROOT, 'qa');
const spec = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
fs.mkdirSync(outDir,{recursive:true});
const intermediateDir=path.join(outDir,'intermediate');
fs.mkdirSync(intermediateDir,{recursive:true});

function fail(msg){ throw new Error(msg); }
function uniq(xs){ return [...new Set((xs||[]).filter(Boolean))]; }
function runNode(file,args){
  const r=cp.spawnSync(process.execPath,[file,...args],{encoding:'utf8',cwd:ROOT});
  if(r.status!==0) fail((r.stderr||r.stdout||`failed: ${path.basename(file)}`).trim());
  return (r.stdout||'').trim();
}
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p,v){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(v,null,2),'utf8'); }

function validateSpec(d){
  const errors=[],warnings=[];
  if(!d||typeof d!=='object') errors.push('root must be an object');
  if(d?.version!=='1.0') errors.push('version must be 1.0');
  if(d?.profile!=='DECK-SPEC-v1') errors.push('profile must be DECK-SPEC-v1');
  if(!d?.deck?.title) errors.push('deck.title is required');
  if(!d?.deck?.audience) errors.push('deck.audience is required');
  if(!d?.deck?.objective) errors.push('deck.objective is required');
  if(!Array.isArray(d?.slides)||!d.slides.length) errors.push('slides[] is required');
  const evidenceIds=new Set((d.evidence||[]).map(e=>e?.id).filter(Boolean));
  const ids=new Set();
  const forbidden=new Set(['x','y','w','h','fontSize','geometry','left','top','width','height']);
  function geometryKeys(obj,trail=''){
    if(!obj||typeof obj!=='object'||Array.isArray(obj)) return [];
    const out=[];
    for(const [k,v] of Object.entries(obj)){
      const p=trail?`${trail}.${k}`:k;
      if(forbidden.has(k)) out.push(p);
      if(v&&typeof v==='object'&&!Array.isArray(v)) out.push(...geometryKeys(v,p));
    }
    return out;
  }
  for(const [i,s] of (d.slides||[]).entries()){
    const p=`slides[${i}]`;
    if(!s.id) errors.push(`${p}.id is required`);
    else if(ids.has(s.id)) errors.push(`duplicate slide id: ${s.id}`);
    else ids.add(s.id);
    if(!s.slideJob) errors.push(`${p}.slideJob is required`);
    if(!String(s.question||'').trim()) errors.push(`${p}.question is required`);
    if(!String(s.primaryClaim||'').trim()) errors.push(`${p}.primaryClaim is required`);
    if(!s.content||typeof s.content!=='object'||Array.isArray(s.content)) errors.push(`${p}.content must be an object`);
    const geo=geometryKeys(s.content||{},`${p}.content`);
    if(geo.length) errors.push(`${p} contains renderer geometry keys: ${geo.join(', ')}`);
    for(const ref of s.evidenceRefs||[]){
      if(evidenceIds.size && !evidenceIds.has(ref)) errors.push(`${p}.evidenceRefs contains unknown id: ${ref}`);
    }
    const detail=s.detailMode||'main';
    if(detail!=='appendix' && !(s.evidenceRefs||[]).length && !['opening','summary','action','decision','generic'].includes(s.slideJob)){
      warnings.push({code:'main_slide_without_evidence_ref',slide:s.id});
    }
  }
  return {pass:errors.length===0,errors,warnings};
}

const validation=validateSpec(spec);
if(!validation.pass){
  for(const e of validation.errors) console.error(`DECK-SPEC: ${e}`);
  process.exit(1);
}

function storyStep(job){
  const map={
    opening:'opening', summary:'opening', key_number:'kpi', compare:'breakdown', diagnose:'breakdown', breakdown:'breakdown',
    hierarchy:'hierarchy', process:'hierarchy', timeline:'hierarchy', matrix:'association', insight:'association', association:'association',
    evidence:'association', decision:'action', action:'action', generic:'generic', appendix:'generic'
  };
  return map[job]||'generic';
}
function payloadFor(s){
  const c={...(s.content||{})};
  const step=storyStep(s.slideJob);
  if(!c.title) c.title=s.primaryClaim;
  if(step==='opening'){
    c.title=c.title||s.primaryClaim;
    if(!c.lead && c.subtitle) c.lead=c.subtitle;
  }
  if(step==='kpi' && !Array.isArray(c.metrics)) c.metrics=[];
  if(['breakdown','association'].includes(step) && !Array.isArray(c.items)) c.items=[];
  if(step==='hierarchy' && !Array.isArray(c.stages)) c.stages=Array.isArray(c.items)?c.items:[];
  if(step==='action' && !Array.isArray(c.actions)) c.actions=[];
  return c;
}

const preserveAll=Boolean(spec.deck.preserveSequence);
const plan={
  version:'1.0',
  profile:'PRESENTATION-PLAN-v1',
  deck:{
    title:spec.deck.title,
    topic:spec.deck.topic||spec.deck.title,
    audience:spec.deck.audience,
    objective:spec.deck.objective,
    linearStory:Boolean(spec.deck.linearStory),
    majorSections:spec.deck.majorSections||[],
    targetSlides:spec.deck.targetSlides,
    decisionExpected:spec.deck.decisionExpected||''
  },
  slides:spec.slides.map(s=>({
    id:s.id,
    storyStep:storyStep(s.slideJob),
    question:s.question,
    claim:s.primaryClaim,
    payload:payloadFor(s),
    sourceRefs:uniq(s.evidenceRefs),
    notes:uniq([...(s.notes||[]),`slideJob=${s.slideJob}`,`detailMode=${s.detailMode||'main'}`,s.visualIntent?`visualIntent=${s.visualIntent}`:'']),
    section:s.section||'',
    appendix:(s.detailMode==='appendix'||s.slideJob==='appendix'),
    sequenceLocked:preserveAll||Boolean(s.sequenceLocked)||(s.detailMode==='appendix'||s.slideJob==='appendix'),
    deckLengthLocked:Boolean(s.deckLengthLocked)||(s.detailMode==='appendix'||s.slideJob==='appendix')
  })),
  suppressedEvidence:[],
  quality:{source:'DECK-SPEC-v1',evidenceCount:(spec.evidence||[]).length}
};

const specResolved={...spec,compiler:{profile:'DECK-SPEC-COMPILER-v1',validated:true,warnings:validation.warnings}};
const specResolvedPath=path.join(outDir,'deck-spec.resolved.json');
const planPath=path.join(intermediateDir,'presentation-plan.json');
const directedPath=path.join(intermediateDir,'presentation-plan.directed.json');
const bundlePath=path.join(intermediateDir,'design-lab.bundle.json');
const selectedBundlePath=path.join(intermediateDir,'design-lab.selected.json');
const rawScenePath=path.join(intermediateDir,'scene.raw.json');
const finalScenePath=path.join(outDir,'final.scene.json');
const readabilityPath=path.join(outDir,'readability-report.json');
const geometryPath=path.join(outDir,'scene-qa-report.json');
const qaPath=path.join(outDir,'qa-report.json');
const htmlPath=path.join(outDir,'final.html');
const pptxPath=path.join(outDir,'final.pptx');
writeJson(specResolvedPath,specResolved);
writeJson(planPath,plan);

runNode(path.join(TOOLS,'edit_length_then_direct_v3.js'),[planPath,directedPath]);
runNode(path.join(TOOLS,'resolve_directed_presentation_plan_to_design_lab_v3.js'),[directedPath,bundlePath,intermediateDir]);

function chooseDirection(){
  const mode=String(spec.design?.mode||'auto').toLowerCase();
  if(mode==='executive') return 'A';
  if(mode==='data') return 'B';
  if(mode==='technical') return 'C';
  const text=`${spec.deck.topic||''} ${spec.deck.objective||''} ${spec.deck.audience||''} ${spec.design?.tone||''}`.toLowerCase();
  if(/architecture|technical|cloud|system|it\b|ai\b|設計|構成|技術|基盤/.test(text)) return 'C';
  if(/analysis|analytics|kpi|evidence|research|評価|分析|検証|実績/.test(text)) return 'B';
  return 'A';
}
const direction=chooseDirection();
const bundle=readJson(bundlePath);
bundle.selections=Object.fromEntries((bundle.slideOrder||[]).map(id=>[id,direction]));
bundle.recommendations={...(bundle.recommendations||{}),selectedDirection:direction,selectionSource:spec.design?.mode||'auto'};
writeJson(selectedBundlePath,bundle);
runNode(path.join(TOOLS,'resolve_design_lab_bundle.js'),[selectedBundlePath,rawScenePath]);
runNode(path.join(TOOLS,'apply_readability_guard.js'),[rawScenePath,finalScenePath,readabilityPath]);
runNode(path.join(QA,'validate_scene_deck_v1.js'),[finalScenePath,geometryPath]);
if(makeHtml) runNode(path.join(TOOLS,'render_scene_deck_to_html.js'),[finalScenePath,htmlPath]);
if(makePptx) runNode(path.join(TOOLS,'compile_scene_deck_to_ppt.js'),[finalScenePath,pptxPath]);

const directed=readJson(directedPath);
const readability=readJson(readabilityPath);
const geometry=readJson(geometryPath);
const outputs={
  deckSpec:path.basename(specResolvedPath),
  scene:path.basename(finalScenePath),
  html:makeHtml?path.basename(htmlPath):null,
  pptx:makePptx?path.basename(pptxPath):null
};
const qa={
  profile:'DECK-BUILD-QA-v1',
  pass:Boolean(validation.pass&&readability.pass&&geometry.pass),
  deckTitle:spec.deck.title,
  selectedDirection:direction,
  slideCount:(readJson(finalScenePath).slides||[]).length,
  specValidation:validation,
  deckLengthEditor:directed.deckLengthEditor||{},
  deckDirector:directed.deckDirector?.quality||{},
  navigation:directed.deckDirector?.navigation||{},
  readability:{pass:readability.pass,operations:readability.operations?.length||0,errors:readability.errors||[],warnings:readability.warnings||[]},
  geometry:{pass:geometry.pass,errors:geometry.errors||[],warnings:geometry.warnings||[],minFontPt:geometry.minFontPt},
  outputs
};
writeJson(qaPath,qa);
console.log(`PASS: DECK-SPEC-v1 -> ${qa.slideCount} slides / direction ${direction}`);
console.log(outDir);
