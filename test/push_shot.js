// 战斗挤压前后对比截图：node test/push_shot.js <baseURL> <out.png>
// Paladin 阵容打第11波（54只发条地精，密集），战斗约20秒时截图，并统计我方单位向国王方向的最大漂移
const {chromium}=require('/workspace/weapon-brawl-test/node_modules/playwright-core');
const [base,out]=process.argv.slice(2);
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto(base+'/index.html?race=Paladin&ai=Paladin&autostart&debug&seed=5');await p.waitForFunction(()=>window.__lt&&__lt.ready&&__lt.G.g,null,{timeout:60000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const {G,LT}=__lt;const g=G.g;g.ai=[{cd:1e9,w:0},{cd:1e9,w:0}];g.autoP0=false;const P=g.P[0];P.gold=1e6;P.foodCap=200;g.wave=10;
   const K1=g.lanes[1].king;K1.hp=K1.maxHp=1e9;let mi=0,ri=0;
   for(const id of LT.D.races.Paladin.lines.slice(0,3)){const up=(LT.D.units[id].upgrades||[])[0];for(let k=0;k<4;k++){const d=LT.D.units[up||id];const j=d.ranged?ri++:mi++;const c=[4,3,5,2,6,1,7,0,8][j%9];const r=(d.ranged?8:4)+(d.ranged?1:-1)*Math.floor(j/9);const o=LT.place(g,0,id,c,r);if(o.ok&&up)LT.upgrade(g,0,o.u.id,up);}}
   window.__drift=0;const st=LT.step;LT.step=function(g2,dt){st(g2,dt);for(const u of g2.lanes[0].units)if(u.alive&&g2.phase==='battle')window.__drift=Math.max(window.__drift,u.y-(u.r+0.5));};
   G.speed=1;LT.startWave(g);});
 await p.waitForTimeout(20000);await p.screenshot({path:out});
 const r=await p.evaluate(()=>({drift:+__drift.toFixed(2),wave:__lt.G.g.wave,phase:__lt.G.g.phase,alive:__lt.G.g.lanes[0].units.filter(u=>u.alive).length}));
 console.log(JSON.stringify({out,...r,errs:errs.length,first:errs[0]}));await b.close();})();
