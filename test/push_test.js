// 战斗挤压回归测试：node test/push_test.js
// 对若干波（含密集波与首领波）布置固定阵容，逐帧记录：
//  pinnedMove = 单位本帧未主动行走（攻击/站定/眩晕）却被位移的最大距离（应为 0）
//  backPush   = 未主动行走时被推向国王方向(+y)的累计距离（应为 0）
//  maxDisp    = 交战期间离建造格中心的最大距离（仅因主动追击产生）
//  reset      = 波次结束后是否全部回到建造格
const LT=require('../lt_core.js');
const CASES=[[1,'Orc',[['h0BF','h0BS',6]]],[9,'Orc',[['h0BF','h0BS',14],['h0BF','h0BU',6]]],[10,'Orc',[['h0BF','h0BS',9],['h0C9','h0CC',6],['h0BV','h0BW',8]]],
  [11,'Paladin',null],[20,'Orc',[['h0C9','h0CC',18],['h0BV','h0BW',9],['h0C4','h0C2',9]]]];
function army(race,n){const ls=LT.D.races[race].lines;return ls.slice(0,3).map(id=>[id,(LT.D.units[id].upgrades||[])[0]||null,n]);}
let fail=0;const out=[];
for(const [wave,race,arm] of CASES){const g=LT.newGame({seed:5,race,aiRace:race});g.ai=[{cd:1e9,w:0},{cd:1e9,w:0}];const P=g.P[0];P.gold=1e6;P.foodCap=200;g.P[1].gold=1e6;g.P[1].foodCap=200;g.wave=wave-1;
  let mi=0,ri=0;for(const [id,up,n] of (arm||army(race,4)))for(let k=0;k<n;k++){const d=LT.D.units[up||id];const j=d.ranged?ri++:mi++;const c=[4,3,5,2,6,1,7,0,8][j%9];const r=(d.ranged?8:4)+(d.ranged?1:-1)*Math.floor(j/9);const o=LT.place(g,0,id,c,r);if(o.ok&&up)LT.upgrade(g,0,o.u.id,up);}
  const K1=g.lanes[1].king;K1.hp=K1.maxHp=1e9;   // opponent lane is empty in this test: keep its king alive so only lane 0 decides
  const L=g.lanes[0];LT.startWave(g);const S=new Map();let t=0;
  while(g.phase==='battle'&&t<240){const pre=new Map(L.units.map(u=>[u.id,[u.x,u.y]]));LT.step(g,1/20);t+=1/20;if(g.phase!=='battle')break;
    for(const u of L.units){if(!u.alive)continue;const s=S.get(u.id)||{pin:0,back:0,disp:0,drift:0};const p=pre.get(u.id);if(!p)continue;const dd=Math.hypot(u.x-p[0],u.y-p[1]);
      if(!u.moving){s.pin=Math.max(s.pin,dd);if(u.y>p[1])s.back+=u.y-p[1];}s.drift=Math.max(s.drift,u.y-(u.r+0.5));if(u.tgt)s.disp=Math.max(s.disp,Math.hypot(u.x-(u.c+0.5),u.y-(u.r+0.5)));S.set(u.id,s);}}
  // after the wave: let the build phase run a little and check everyone is home
  for(let i=0;i<20*60&&g.phase==='battle'&&!g.over;i++)LT.step(g,1/20);
  const home=g.over?'n/a(over)':g.phase==='build'&&L.units.filter(u=>u.alive).every(u=>Math.hypot(u.x-(u.c+0.5),u.y-(u.r+0.5))<0.15);
  const v=[...S.values()];const pin=Math.max(0,...v.map(s=>s.pin)),back=Math.max(0,...v.map(s=>s.back)),disp=Math.max(0,...v.map(s=>s.disp)),drift=Math.max(0,...v.map(s=>s.drift));
  const ok=pin<1e-6&&back<1e-6&&home!==false;if(!ok)fail++;
  out.push({wave,race,count:LT.D.waves[wave].count,fighters:L.units.length,leaks:L.leaks,t:+t.toFixed(1),pinnedMove:+pin.toFixed(4),backPush:+back.toFixed(4),maxDispWhileEngaged:+disp.toFixed(2),maxDriftTowardKing:+drift.toFixed(2),resetHome:home,ok});}
console.table(out);console.log(fail?`FAIL ${fail}`:'PASS');process.exitCode=fail?1:0;
