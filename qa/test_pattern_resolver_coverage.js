#!/usr/bin/env node
const fs=require('fs'),cp=require('child_process'),path=require('path');
const registry=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../patterns/pattern-registry.v1.json'),'utf8'));
const resolver=path.resolve(__dirname,'../tools/resolve_pattern_deck_to_scene.js');
function genericContent(fam){
  const base={kicker:'COVERAGE TEST',title:`${fam} coverage`,lead:'coverage'};
  if(fam==='ED01') return {...base,metric:'100',metricLabel:'TEST'};
  if(fam==='ED02') return {message:'One clear message',support:'support',claim:'claim',reality:'reality',question:'question',source:'source'};
  if(fam==='ED03') return {title:'KPI',value:'123',delta:'+10%',current:70,target:100,targetLabel:'100',metrics:[{value:'1',label:'A'},{value:'2',label:'B'},{value:'3',label:'C'},{value:'4',label:'D'}],left:{value:'70',label:'A'},right:{value:'30',label:'B'}};
  if(fam==='ED04') return {title:'Three',items:[{title:'A',text:'a',severity:'H'},{title:'B',text:'b',severity:'M'},{title:'C',text:'c',severity:'L'}]};
  if(fam==='ED05') return {title:'Compare',current:{title:'Current',text:'c'},ideal:{title:'Ideal',text:'i'},left:{title:'A',text:'a'},right:{title:'B',text:'b'},items:[{title:'A',text:'a'},{title:'B',text:'b'},{title:'C',text:'c'}]};
  if(fam==='ED06') return {title:'Problem',problem:{title:'P',text:'p'},cause:{title:'C',text:'c'},solution:{title:'S',text:'s'},pain:{title:'P',text:'p'},idea:{title:'I',text:'i'},value:{title:'V',text:'v'},items:[{title:'p1'},{title:'p2'},{title:'p3'}]};
  if(fam==='ED07') return {title:'Flow',hub:{title:'HUB'},stages:[{title:'A',role:'A',step:'a',output:'a'},{title:'B',role:'B',step:'b',output:'b'},{title:'C',role:'C',step:'c',output:'c'},{title:'D',role:'D',step:'d',output:'d'},{title:'E',role:'E',step:'e',output:'e'}]};
  if(fam==='ED08') return {title:'Data',lead:'lead',annotation:'note',chart:{type:'column',categories:['A','B','C'],series:[{name:'S',values:[1,2,3]}]},items:[{label:'A',value:10},{label:'B',value:7},{label:'C',value:4},{label:'D',value:2}],panels:[{title:'P1',type:'column',categories:['A','B'],series:[{values:[1,2]}]},{title:'P2',type:'column',categories:['A','B'],series:[{values:[2,3]}]},{title:'P3',type:'column',categories:['A','B'],series:[{values:[3,4]}]}]};
  if(fam==='ED09') return {title:'Matrix',highlight:'TR',xLabel:'X',yLabel:'Y',quadrants:[{title:'A'},{title:'B'},{title:'C'},{title:'D'}],items:[{label:'A',x:20,y:30,size:10},{label:'B',x:70,y:80,size:20},{label:'C',x:50,y:60,size:14},{label:'D',x:30,y:75,size:12}]};
  if(fam==='ED10') return {title:'Timeline',stages:[{title:'A',period:'1',progress:20},{title:'B',period:'2',progress:40},{title:'C',period:'3',progress:70},{title:'D',period:'4',progress:90},{title:'E',period:'5',progress:100}]};
  if(fam==='ED11') return {title:'Action',ask:'Approve next phase',deadline:'By Friday',actions:[{title:'A',what:'A',who:'X',when:'Now',text:'a'},{title:'B',what:'B',who:'Y',when:'Next',text:'b'},{title:'C',what:'C',who:'Z',when:'Later',text:'c'}],items:[{risk:'R1',countermeasure:'C1'},{risk:'R2',countermeasure:'C2'}]};
  if(fam==='ED12') return {title:'Evidence',columns:['A','B','C'],rows:[['1','2','3'],['4','5','6']],stages:[{title:'A',text:'a'},{title:'B',text:'b'},{title:'C',text:'c'},{title:'D',text:'d'},{title:'E',text:'e'}],items:[{term:'A',definition:'a',title:'A',text:'a'},{term:'B',definition:'b',title:'B',text:'b'},{term:'C',definition:'c',title:'C',text:'c'}]};
  return base;
}
let ok=0,fail=[];
for(const [fam,meta] of Object.entries(registry.families)) for(const v of Object.keys(meta.variants)){
  const req={version:'1.0',profile:'PATTERN-DECK-v1',deck:{title:'coverage'},slides:[{id:'s',pattern:`${fam}-${v}`,density:'MED',theme:'TH01',composition:'CM02',content:genericContent(fam)}]};
  const inp=path.join('/tmp',`pattern-${fam}-${v}.json`),out=path.join('/tmp',`scene-${fam}-${v}.json`);fs.writeFileSync(inp,JSON.stringify(req));
  try{cp.execFileSync('node',[resolver,inp,out],{stdio:'pipe'});const d=JSON.parse(fs.readFileSync(out));if(d.profile!=='SCENE-DECK-v1'||!d.slides[0].elements.length)throw new Error('empty scene');ok++;}catch(e){fail.push(`${fam}-${v}: ${e.stderr?.toString()||e.message}`)}
}
console.log(JSON.stringify({ok,failed:fail.length,fail},null,2));
if(fail.length)process.exit(1);
