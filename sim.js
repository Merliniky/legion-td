// node sim.js [games] — AI vs AI balance check (both lanes driven by the AI)
const LT=require('./lt_core.js');const N=+process.argv[2]||50;const res={win:0,lose:0},waves=[],leaks=Array(13).fill(0);
for(let i=0;i<N;i++){const g=LT.newGame(1000+i);let t=0;while(!g.over&&t<4000){LT.AI.think(g,0,0.05);LT.step(g,0.05);t+=0.05;
  for(const L of g.lanes){for(const e of L.events)if(e.k==='cleared')leaks[g.wave]+=e.leaks;L.events.length=0;}}
  res[g.over]=(res[g.over]||0)+1;waves.push(g.wave);if(i<3)console.log('game',i,g.over,'wave',g.wave,'kings',g.lanes.map(L=>Math.round(L.king.hp)),'gold',g.gold,'inc',g.income,'units',g.lanes.map(L=>L.units.length),'t',Math.round(t));}
console.log(res,'avg wave',waves.reduce((a,b)=>a+b,0)/N,'leaks/wave',leaks.map(x=>(x/N/2).toFixed(1)).join(' '));
