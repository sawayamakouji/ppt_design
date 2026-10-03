#!/usr/bin/env node
const fs=require('fs');
const input=process.argv[2];
const output=process.argv[3]||'/mnt/data/brief.parsed.v1.json';
if(!input){console.error('usage: node parse_brief_text.js brief.txt [brief.json]');process.exit(2)}
const raw=fs.readFileSync(input,'utf8').trim();
const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const kv={};
for(const line of lines){const m=line.match(/^([^:：]{1,18})[:：]\s*(.+)$/);if(m)kv[m[1].toLowerCase()]=m[2].trim()}
const lc=raw.toLowerCase();
const has=(...xs)=>xs.some(x=>lc.includes(x.toLowerCase()));
const val=(...keys)=>{for(const k of keys){if(kv[k])return kv[k]}return ''};
function audience(){if(has('役員','経営','取締役','executive','board'))return'executive';if(has('マネージャ','管理職','部長','店長'))return'manager';if(has('現場','店舗','担当者','従業員'))return'operational';if(has('エンジニア','開発','技術','architecture','technical'))return'technical';return'general'}
function objective(){if(has('承認','決裁','予算を取','意思決定'))return'approval';if(has('提案','企画','計画書','proposal'))return'proposal';if(has('分析','要因','検証','analysis'))return'analysis';if(has('報告','レビュー','実績','report'))return'report';if(has('研修','教育','training'))return'training';return'explain'}
const sm=raw.match(/(\d{1,2})\s*枚/);const slideCount=Math.max(3,Math.min(20,Number(sm?.[1]||val('枚数','slides')||6)));
function density(){if(has('文章多め','詳細','高密度','high density'))return'HIGH';if(has('簡潔','少なめ','一言','low density'))return'LOW';return'MED'}
function dataEmphasis(){if(has('数字多め','データ多め','kpi','チャート','分析','定量','実績'))return'HIGH';if(has('数字少なめ','概念中心'))return'LOW';return'MED'}
function novelty(){if(has('大胆','攻め','斬新','experimental','brutal','neon'))return'HIGH';if(has('堅め','保守','無難','serious'))return'LOW';return'MED'}
const tones=[];[['洗練','polished'],['堅め','serious'],['シンプル','simple'],['技術','technical'],['ポップ','playful'],['編集','editorial'],['高級','premium'],['分析','analytical']].forEach(([k,v])=>{if(has(k))tones.push(v)});
const topic=val('テーマ','topic')||lines[0]?.replace(/^テーマ[:：]\s*/,'')||'Presentation';
const title=val('タイトル','title')||topic;
const decision=val('決裁','判断','decision')||(objective()==='approval'?'承認・意思決定':'');
const metrics=[];
const amountRe=/(\d[\d,.]*)\s*(億円|万円|円|%|％|pt|店舗|店|人|件)/g;let m;const seen=new Set();
while((m=amountRe.exec(raw))){const s=m[1]+m[2];if(seen.has(s))continue;seen.add(s);const around=raw.slice(Math.max(0,m.index-12),Math.min(raw.length,m.index+m[0].length+12));let label='数値';if(/予算/.test(around))label='予算';else if(/対象業務/.test(around))label='対象業務';else if(/店舗|店/.test(m[2]))label='対象店舗';else if(/売上/.test(around))label='売上';else if(/粗利/.test(around))label='粗利';else if(/削減|時間/.test(around))label='削減効果';metrics.push({value:s.replace('％','%'),label})}
const points=(val('ポイント','要点','points')||'').split(/[、,／/]/).map(x=>x.trim()).filter(Boolean).map(x=>({title:x,text:''}));
const actions=(val('アクション','actions')||'').split(/[、,／/]/).map(x=>x.trim()).filter(Boolean).map((x,i)=>({title:x,text:'実行内容を具体化',what:x,who:'担当',when:i===0?'NOW':'NEXT'}));
const content={
  headline:val('結論','headline')||`${topic}の実行方針を明確にする`,
  lead:val('リード','lead')||`目的・根拠・実行計画を一つのストーリーで整理する。`,
  metrics,
  points,
  problem:{title:val('課題','problem')||'現状の課題',text:val('課題詳細','problem detail')||'作業・判断・情報が分散し、再利用しづらい。'},
  cause:{title:val('原因','cause')||'構造的な原因',text:'共通ルールと共通データ基盤が不足している。'},
  solution:{title:val('解決策','solution')||'共通基盤で一本化',text:'分析・判断・資料化を同じ流れで再利用可能にする。'},
  current:{label:'CURRENT',title:'現在',text:val('現状','current')||'個別作業と属人的判断が中心'},
  ideal:{label:'IDEAL',title:'目指す姿',text:val('理想','ideal')||'共通基盤で再利用・自動化'},
  stages:[{title:'DATA',text:'情報を整える',role:'DATA',step:'取得・整形',output:'trusted data'},{title:'AGENT',text:'分析・構成',role:'AGENT',step:'分析・構成',output:'draft'},{title:'HUMAN',text:'比較・判断',role:'HUMAN',step:'レビュー',output:'approved'},{title:'DELIVER',text:'実行・共有',role:'DELIVER',step:'配布・実行',output:'outcome'}],
  timeline:[{title:'NOW',text:'要件とPoCを確定',period:'0–1M'},{title:'NEXT',text:'対象業務へ展開',period:'2–3M'},{title:'LATER',text:'標準化・横展開',period:'4–6M'}],
  actions:actions.length?actions:[{title:'対象を決める',text:'優先業務を3件に絞る',what:'優先業務の決定',who:'Owner',when:'NOW'},{title:'PoCを回す',text:'効果と運用負荷を検証',what:'PoC実施',who:'Team',when:'NEXT'},{title:'標準化する',text:'成功パターンを横展開',what:'標準化',who:'Team',when:'LATER'}],
  chart:{type:'column',categories:['現状','Step1','Step2','目標'],series:[{name:'Index',values:[60,72,86,100]}]},
  evidence:[{title:'対象',text:'Briefで定義'},{title:'方法',text:'Pattern Resolver'},{title:'出力',text:'HTML / PPT'},{title:'検証',text:'Design Lint / PPT-SAFE'}]
};
if(content.points.length<3)content.points=[{title:'基盤',text:'共通データと共通ルール'},{title:'実装',text:'AI / Cloudで繰り返しを自動化'},{title:'運用',text:'人が判断すべき箇所を明確化'}];
if(content.metrics.length<3)content.metrics.push(...[{value:'3',label:'重点テーマ'},{value:'1',label:'共通基盤'},{value:'NEXT',label:'実装フェーズ'}].slice(0,3-content.metrics.length));
const out={version:'1.0',profile:'BRIEF-v1',rawText:raw,title,topic,audience:audience(),objective:objective(),decision,slideCount,tone:tones.length?tones:['polished'],density:density(),dataEmphasis:dataEmphasis(),novelty:novelty(),language:'ja-JP',medium:'both',constraints:[],content};
fs.writeFileSync(output,JSON.stringify(out,null,2),'utf8');console.log(output);
