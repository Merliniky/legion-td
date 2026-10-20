const LT=require('./lt_core.js');const N=+process.argv[2]||30;const val=Array(14).fill(0),lk=Array(14).fill(0),cnt=Array(14).fill(0),kh=Array(14).fill(0),bt=Array(14).fill(0);
for(let i=0;i<N;i++){const g=LT.newGame(77+i);let t=0,w=-1;while(!g.over&&t<5000){LT.AI.think(g,0,0.05);LT.step(g,0.05);t+=0.05;
 if(g.phase==='battle'&&g.wave!==w){w=g.wave;for(const L of g.lanes){val[w]+=L.units.reduce((a,u)=>a+u.value,0);cnt[w]++;}}
 for(const L of g.lanes){for(const e of L.events)if(e.k==='cleared'){lk[g.wave]+=e.leaks;bt[g.wave]+=e.t;kh[g.wave]+=L.king.hp;}L.events.length=0;}}}
for(let w=1;w<=12;w++)if(cnt[w])console.log('w'+w,'army',Math.round(val[w]/cnt[w]),'leaks',(lk[w]/cnt[w]).toFixed(1),'battle',(bt[w]/cnt[w]).toFixed(0)+'s','king',Math.round(kh[w]/cnt[w]),'n',cnt[w]);
