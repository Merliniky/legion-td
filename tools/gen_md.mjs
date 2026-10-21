// 生成 data/roster_mega.md（中文资料文档）: node tools/gen_md.mjs
import {createRequire} from 'module';import fs from 'fs';
const require=createRequire(import.meta.url);
const D=JSON.parse(fs.readFileSync(new URL('../data/roster_mega.json',import.meta.url)));
const LT=require('../lt_core.js');const {MODELS}=await import('../models.js');const {ABZ}=await import('../abil_zh.js');
const AT={normal:'普通',pierce:'穿刺',magic:'魔法',siege:'攻城',chaos:'混乱',hero:'英雄',spells:'法术'},AR={light:'轻甲',medium:'中甲',heavy:'重甲',fortified:'城甲',hero:'英雄甲',divine:'神圣',unarmored:'无甲'};
const out=[];const P=s=>out.push(s);
const est=f=>f&&f.est?' ⚠估':'';
const mdl=id=>{const m=MODELS[id];if(!m)return '—';if(m.p)return `程序化:${m.p}${m.k?' ×'+m.k:''}`;return `精灵:${m.s}${m.t!=null?' 着色#'+(m.t>>>0).toString(16).padStart(6,'0'):''}${m.k?' ×'+m.k:''}${m.d&&m.d.length?' +'+m.d.join('/'):''}`;};
const abil=u=>(u.fx||[]).map(f=>{const t=LT.fxText(f),n=f.name?(ABZ[f.name]||f.name):'';return (n&&!t.startsWith(n)?n+'：':'')+t+est(f)+(f.src==='book'?' 〔Book〕':'');}).join('<br>')||'—';//${est(f)}${f.src==='book'?' 〔Book〕':''}`).join('<br>')||'—';
P(`# 军团战争 Legion TD Mega 3.41 · 兵种与能力资料\n`);
P(`> 版本：**${D.version||'Legion TD Mega 3.41'}**　来源：${D.source}\n>\n> 可信度：${D.confidence}\n>\n> 标记说明：⚠估 = 推算/估计值（地图数据无法直接读出或经 Book 校准）；〔Book〕= 依据《Legion TD Mega Book 3.41》文字修正的技能行为。\n> 本文件由 \`tools/gen_md.mjs\` 从 \`data/roster_mega.json\` 自动生成；原始提取脚本见 \`tools/ltd_extract/\`。\n`);
P(`## 目录\n- 种族与兵种（${Object.keys(D.races).length} 个种族）\n- 召唤物（技能召唤）\n- 31 关怪物\n- 派兵（佣兵）\n- 国王\n- 经济\n- 伤害表\n- 模式\n- Book 备注 / 已知差异\n`);
P(`## 种族与兵种\n`);
for(const [rk,r] of Object.entries(D.races)){
  P(`### ${r.zh}（${rk}）\n`);if(r.desc)P(`*${r.desc}*\n`);if(r.note)P(`${r.note}\n`);
  P(`| 阶 | 兵种 | 总价值/人口 | 生命/护甲 | 攻击 | 射程/攻速 | 能力 | 升级到 | 模型 |\n|---|---|---|---|---|---|---|---|---|`);
  const seen=new Set();const rows=[];const walk=(id,depth)=>{if(seen.has(id))return;seen.add(id);const u=D.units[id];if(!u)return;rows.push([u,depth]);for(const n of u.upgrades||[])walk(n,depth+1);};
  for(const id of r.lines||[])walk(id,0);
  for(const [u,d] of rows){P(`| ${u.tier}${d?'→'.repeat(d):''} | **${u.zh}** ${u.en} | ${u.gold}金/${u.food} | ${u.hp} / ${u.armor} ${AR[u.armorType]||u.armorType} | ${u.dmg.join('-')} ${AT[u.attackType]||u.attackType} | ${u.range<=150?'近战':u.range} / ${u.cd}s | ${abil(u)} | ${(u.upgrades||[]).map(x=>D.units[x]?D.units[x].zh+'(+'+LT.upCost(u,D.units[x])+'金)':x).join('、')||'—'} | ${mdl(u.id)} |`);}
  P('');}
P(`## 召唤物（由兵种技能产生）\n\n| id | 名称 | 生命/护甲 | 攻击 | 模型 |\n|---|---|---|---|---|`);
for(const [id,s] of Object.entries(D.summoned))P(`| ${id} | ${s.zh||({'Mini Hydra':'小九头蛇','Imp':'小鬼'})[s.name]||s.name} ${s.name} | ${s.hp} / ${s.armor??'—'} ${AR[s.armorType]||s.armorType||''} | ${s.dmgMin}-${s.dmgMax} ${AT[s.attackType]||s.attackType||''} | ${mdl(id)} |`);
P(`\n## 31 关怪物\n\n| 关 | 怪物 | 数量(X3) | 生命/护甲 | 攻击 | 赏金/关卡奖励 | 推荐价值 | 能力 | 模型 |\n|---|---|---|---|---|---|---|---|---|`);
for(const w of D.waves)if(w)P(`| ${w.wave}${w.boss?' 👑BOSS':''} | ${w.zh} ${w.en} | ${w.count} | ${w.hp} / ${w.armor} ${AR[w.armorType]||w.armorType} | ${w.dmg.join('-')} ${AT[w.attackType]||w.attackType}${w.fly?' 飞行':''} | ${w.bounty}/${w.bonusGold??'—'} | ${w.recommendedValue} | ${(w.fx||[]).map(f=>LT.fxText(f)+est(f)).join('<br>')||[...new Set(w.abilities||[])].map(a=>ABZ[a]||a).join('、')||'—'} | ${mdl(w.id)} |`);
P(`\n## 派兵（佣兵 / Summons）\n派出后下一波进攻对手，并永久增加收入。\n\n| 兵种 | 商店 | 木材 | +收入 | 生命 | 攻击 | 库存/恢复 | 能力 | 模型 |\n|---|---|---|---|---|---|---|---|---|`);
for(const s of D.summons)P(`| ${s.zh} ${s.en} | ${s.shop} | ${s.lumber} | ${s.income} | ${s.hp} ${AR[s.armorType]||s.armorType} | ${s.dmg.join('-')} ${AT[s.attackType]||s.attackType} | ${s.stockMax}/${s.stockRegen}s | ${(s.fx||[]).map(f=>LT.fxText(f)+est(f)).join('<br>')||'—'} | ${mdl(s.id)} |`);
const K=D.king;P(`\n## 国王\n生命 ${K.hp}，法力 ${K.mana}（恢复 ${K.regen}/秒），护甲 ${K.armor} 英雄甲，攻击 ${K.dmg.join('-')} 英雄，射程 ${K.range}，攻速 ${K.cd}s。\n\n**升级（木材）**`);
for(const [k,u] of Object.entries(K.upgrades))P(`- ${k}：${u.lumber}木，+${u.income}收入，最多${u.max}级，${u.perLevel}${est(u)}`);
P(`\n**技能**${K.abilityNote?'（'+K.abilityNote+'）':''}`);for(const a of K.abilities||[])P(`- 第${a.wave}关解锁 ${a.zh}（${a.name}）：${LT.fxText(a)}${est(a)}`);
if(K.lateGame)P(`- 后期成长：${JSON.stringify(K.lateGame)} ⚠估`);P(`\n${K.note||''}\n\n> 引擎实现注：国王法力恢复按 2/秒 运行（估计值，略低于数据中的 ${K.regen}/秒，用于平衡技能频率）。`);
const E=D.economy;P(`\n## 经济\n`);for(const [k,v] of Object.entries(E))P(`- **${k}**：${typeof v==='object'?Object.entries(v).map(([a,b])=>a+'='+b).join('；'):v}`);
P(`\n## 伤害表（攻击类型 × 护甲类型）\n\n| 攻击＼护甲 | ${D.damageTable.columns.join(' | ')} |\n|---|${D.damageTable.columns.map(()=>'---').join('|')}|`);
for(const a of ['normal','pierce','magic','siege','chaos','spells','hero'])P(`| ${AT[a]} ${a} | ${D.damageTable[a].join(' | ')} |`);
P(`\n${D.damageTable.armorFormula}\n\n## 模式\n`);for(const [k,m] of Object.entries(D.modes))P(`- **${k}**：${m.zh}（数量×${(+m.countMul).toFixed(2)}，赏金×${m.bountyMul}）${est(m)}`);
P(`\n## Book 备注 / 已知差异\n`);for(const [k,v] of Object.entries(D.bookNotes||{}))P(`- ${k}：${v}`);
P(`\n## 模型说明\n- 精灵 = 复用「英雄冲突」HD 精灵图集（CC0），按兵种着色、缩放并叠加 3D 装饰（金冠/光环/法球/火焰/幽灵/发光眼/尖刺/盾/背旗）。\n- 程序化 = 新做的卡通 three.js 模型（飞艇、坦克、蜘蛛、雕像、树人、远古、小精灵、水元素、变形体、卵、螃蟹、地雷、炮塔、机器人、直升机、压路机、马车、弩车等），用于原素材中没有对应造型的兵种。\n- 同一条升级线：后续形态缩放更大、装饰更多。`);
fs.writeFileSync(new URL('../data/roster_mega.md',import.meta.url),out.join('\n')+'\n');console.log('lines',out.length);
