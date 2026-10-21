// node sim.js [race] [aiRace] [seeds] — AI vs AI balance / crash check
const LT=require('./lt_core.js');
const races=process.argv[2]?[process.argv[2]]:LT.RACES;const n=+(process.argv[4]||2);
const res={};
for(const r of races){let waves=0,wins=0,leaks=0;
  for(let s=1;s<=n;s++){const g=LT.newGame({seed:s*7919,race:r,aiRace:process.argv[3]||'Random',mode:process.env.MODE||'X3'});g.autoP0=true;let t=0;
    while(!g.over&&t<4*3600){LT.step(g,1/20);t+=1/20;if(g.phase==='build'&&g.timer>12)g.timer=12;}
    waves+=g.wave;if(g.over==='win')wins++;leaks+=g.P[0].leaked;}
  res[r]=`avgWave ${(waves/n).toFixed(1)} wins ${wins}/${n} leaks/g ${(leaks/n).toFixed(0)}`;console.log(r.padEnd(11),res[r]);}
