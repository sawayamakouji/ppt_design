#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const {evaluateDeckNavigation}=require('../tools/deck_navigation_policy.js');
const rules=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../deck/deck-director-rules.v3.json'),'utf8'));

function slide(i,section,extra={}){return {id:`S${i}`,storyStep:'generic',section,...extra};}
function check(name,plan,expected){const got=evaluateDeckNavigation(plan,rules);for(const [k,v] of Object.entries(expected)){const actual=k.split('.').reduce((o,p)=>o?.[p],got);if(actual!==v)throw new Error(`${name}: ${k} expected ${v} got ${actual}`);}console.log(`PASS ${name}`);}

check('short deck no agenda',{deck:{},slides:Array.from({length:7},(_,i)=>slide(i+1,'main'))},{'agenda.decision':'none','mainSlideCount':7});
check('8 slides 3 sections recommends agenda',{deck:{},slides:[...Array.from({length:3},(_,i)=>slide(i+1,'A')),...Array.from({length:3},(_,i)=>slide(i+4,'B')),...Array.from({length:2},(_,i)=>slide(i+7,'C'))]},{'agenda.decision':'recommended','majorSectionCount':3});
check('12 slides recommends agenda',{deck:{},slides:Array.from({length:12},(_,i)=>slide(i+1,'main'))},{'agenda.decision':'recommended'});
check('12 slide linear story may omit',{deck:{linearStory:true},slides:Array.from({length:12},(_,i)=>slide(i+1,'main'))},{'agenda.decision':'optional'});
check('20 slide deck requires agenda',{deck:{linearStory:true},slides:Array.from({length:20},(_,i)=>slide(i+1,'main'))},{'agenda.decision':'required'});
check('appendix excluded from count',{deck:{},slides:[...Array.from({length:7},(_,i)=>slide(i+1,'main')),...Array.from({length:12},(_,i)=>slide(i+8,'appendix',{appendix:true}))]},{'agenda.decision':'none','mainSlideCount':7,'appendixSlideCount':12});
check('4 sections recommends dividers',{deck:{},slides:[...Array.from({length:3},(_,i)=>slide(i+1,'A')),...Array.from({length:3},(_,i)=>slide(i+4,'B')),...Array.from({length:3},(_,i)=>slide(i+7,'C')),...Array.from({length:3},(_,i)=>slide(i+10,'D'))]},{'sectionDividers.decision':'recommended'});
console.log('Deck navigation policy v1: PASS');
