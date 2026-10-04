#!/usr/bin/env node
const path=require('path');
const cp=require('child_process');

const [cmd,...rest]=process.argv.slice(2);
function help(){
  console.log(`ppt-design\n\nCommands:\n  build <deck-spec.json> [--out output-dir] [--no-pptx] [--no-html]\n\nExample:\n  node tools/ppt-design.js build samples/deck-spec.business-plan.sample.v1.json --out ./output`);
}
if(!cmd||cmd==='help'||cmd==='--help'||cmd==='-h'){help();process.exit(0)}
if(cmd!=='build'){console.error(`unknown command: ${cmd}`);help();process.exit(2)}
if(!rest.length){help();process.exit(2)}
const compiler=path.resolve(__dirname,'deck_spec_compiler_v1.js');
const r=cp.spawnSync(process.execPath,[compiler,...rest],{stdio:'inherit'});
process.exit(r.status==null?1:r.status);
