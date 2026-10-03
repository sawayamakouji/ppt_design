#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
const output = process.argv[3] || '/mnt/data/presentation-plan.length-edited.v1.json';
if (!input) {
  console.error('usage: node edit_deck_length.js presentation-plan.json [output.json]');
  process.exit(2);
}

const plan = JSON.parse(fs.readFileSync(input, 'utf8'));
if (plan.profile !== 'PRESENTATION-PLAN-v1') throw new Error('profile must be PRESENTATION-PLAN-v1');
const rules = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../deck/deck-length-editor-rules.v1.json'), 'utf8'));

const norm = s => String(s || '').replace(/[\s　。、,.・:：!?！？()（）\-→/]/g, '').toLowerCase();
const unique = xs => [...new Set((xs || []).filter(Boolean))];
const locked = s => Boolean(s.sequenceLocked || s.positionLocked || s.deckLengthLocked);
const causal = s => String(s.causalStatus || '').trim();
const arr = (s, key) => Array.isArray(s?.payload?.[key]) ? s.payload[key] : [];

function audienceClass(deck) {
  const a = String(deck?.audience || '').toLowerCase();
  const o = String(deck?.objective || '').toLowerCase();
  if (/役員|executive|board|経営/.test(a)) return 'executive';
  if (/管理|manager|management/.test(a)) return 'management';
  if (/update|status|進捗/.test(o)) return 'update';
  return 'standard';
}
function compatible(a, b) {
  if (locked(a) || locked(b)) return false;
  if (rules.merge.requireSameStoryStep && a.storyStep !== b.storyStep) return false;
  if (!rules.merge.allowedStorySteps.includes(a.storyStep)) return false;
  if (rules.merge.requireCompatibleCausalStatus && causal(a) && causal(b) && causal(a) !== causal(b)) return false;
  return true;
}
function canMerge(a, b) {
  if (!compatible(a, b)) return false;
  const m = arr(a,'metrics').length + arr(b,'metrics').length;
  const i = arr(a,'items').length + arr(b,'items').length;
  const ac = arr(a,'actions').length + arr(b,'actions').length;
  if (m && m > rules.merge.maxCombinedMetrics) return false;
  if (i && i > rules.merge.maxCombinedItems) return false;
  if (ac && ac > rules.merge.maxCombinedActions) return false;
  const sameQ = norm(a.question) && norm(a.question) === norm(b.question);
  const sameClaim = norm(a.claim) && norm(a.claim) === norm(b.claim);
  const sharedRefs = (a.sourceRefs || []).some(x => (b.sourceRefs || []).includes(x));
  return sameQ || sameClaim || sharedRefs;
}
function mergePayload(a,b) {
  const p = {...(a.payload || {})};
  for (const key of ['metrics','items','actions','stages']) {
    const v = [...arr(a,key), ...arr(b,key)];
    if (v.length) p[key] = v;
  }
  if (!p.title) p.title = a.payload?.title || b.payload?.title || a.claim;
  return p;
}
function mergeSlides(a,b) {
  return {
    ...a,
    id: `${a.id}+${b.id}`,
    question: a.question || b.question,
    claim: a.claim === b.claim ? a.claim : (a.claim || b.claim),
    payload: mergePayload(a,b),
    sourceRefs: unique([...(a.sourceRefs||[]), ...(b.sourceRefs||[])]),
    notes: unique([...(a.notes||[]), ...(b.notes||[]), `mergedFrom=${a.id},${b.id}`]),
    deckLength: {operation:'MERGE', sourceIds:[a.id,b.id]}
  };
}
function isDroppableDuplicate(prev, cur) {
  if (!prev || locked(cur)) return false;
  if (rules.drop.requireExplicitOptionalOrAllowDrop && !(cur.optional || cur.allowDrop || cur.deckLength?.allowDrop)) return false;
  if (rules.safety.neverDropOpening && cur.storyStep === 'opening') return false;
  if (rules.safety.neverDropActionClose && cur.storyStep === 'action') return false;
  const dupQ = norm(prev.question) && norm(prev.question) === norm(cur.question);
  const dupC = norm(prev.claim) && norm(prev.claim) === norm(cur.claim);
  return dupQ || dupC;
}
function oversizedKey(s) {
  const limits = rules.payloadLimits;
  if (arr(s,'items').length > limits.items) return ['items', limits.items];
  if (arr(s,'stages').length > limits.stages) return ['stages', limits.stages];
  if (arr(s,'actions').length > limits.actions) return ['actions', limits.actions];
  const body = String(s.payload?.body || s.payload?.lead || s.payload?.text || '');
  if (body.length > limits.bodyChars) return ['body', limits.bodyChars];
  return null;
}
function splitSlide(s) {
  if (locked(s) || !rules.split.allowedStorySteps.includes(s.storyStep)) return null;
  const over = oversizedKey(s);
  if (!over || over[0] === 'body') return null;
  const [key, limit] = over;
  const values = arr(s,key);
  const chunks = [];
  for (let i=0;i<values.length;i+=limit) chunks.push(values.slice(i,i+limit));
  if (chunks.length < 2) return null;
  return chunks.map((chunk, idx) => ({
    ...s,
    id: `${s.id}.${idx+1}`,
    claim: s.claim,
    payload: {...(s.payload||{}), [key]: chunk, title: `${s.payload?.title || s.claim}｜${idx===0?'上位':'続き'}`},
    notes: unique([...(s.notes||[]), `splitFrom=${s.id}`, `part=${idx+1}/${chunks.length}`]),
    deckLength: {operation:'SPLIT', sourceIds:[s.id], part:idx+1, parts:chunks.length}
  }));
}

const beforeSlides = plan.slides.map(s => ({...s}));
const operations = [];
let working = [];

for (const s of beforeSlides) {
  const prev = working.at(-1);
  if (isDroppableDuplicate(prev, s)) {
    operations.push({type:'DROP', sourceIds:[s.id], reason:'explicit optional duplicate of adjacent slide', reversible:true});
    continue;
  }
  working.push(s);
}

const merged = [];
for (let i=0;i<working.length;i++) {
  const a = working[i], b = working[i+1];
  if (b && canMerge(a,b)) {
    const m = mergeSlides(a,b);
    merged.push(m);
    operations.push({type:'MERGE', sourceIds:[a.id,b.id], resultIds:[m.id], reason:'adjacent slides share the same page job/evidence and fit one readable page', reversible:true});
    i++;
  } else merged.push(a);
}

const edited = [];
for (const s of merged) {
  const parts = splitSlide(s);
  if (parts) {
    edited.push(...parts);
    operations.push({type:'SPLIT', sourceIds:[s.id], resultIds:parts.map(x=>x.id), reason:'structured payload exceeds page-safe item count', reversible:true});
  } else edited.push(s);
}

const audience = audienceClass(plan.deck);
const range = rules.targetRanges[audience] || rules.targetRanges.standard;
const warnings = [];
if (edited.length < range.min) warnings.push({type:'deck_too_short', current:edited.length, target:range});
if (edited.length > range.max) warnings.push({type:'deck_too_long', current:edited.length, target:range});

const out = {
  ...plan,
  slides: edited,
  deckLengthEditor: {
    profile:'DECK-LENGTH-EDITOR-v1',
    audienceClass: audience,
    targetRange: range,
    beforeCount: beforeSlides.length,
    afterCount: edited.length,
    operations,
    warnings,
    policy: {
      autoAppliedOnlySafeReversibleEdits: true,
      evidenceInvented: false,
      claimsStrengthened: false,
      locksRespected: true
    }
  }
};
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, JSON.stringify(out,null,2), 'utf8');
console.log(output);
