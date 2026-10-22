const {chromium}=require('./pw.js');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,180)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,180));});
 await p.goto('http://127.0.0.1:8765/index.html?debug&seed=7&mode=X3&q=high&race=Paladin&autostart',{waitUntil:'load'});
 await p.waitForFunction(()=>window.__lt&&__lt.ready,{timeout:30000});
 await p.waitForTimeout(2500);
 const hq0=await p.evaluate(()=>['h09L','h09N','h09T','h002','h000','h005','h001','h00I'].map(id=>[id,!!__lt.hqReady(id)]));
 console.log('hq0',JSON.stringify(hq0));
 await p.evaluate(()=>{__lt.G.g.autoP0=true;if(__lt.G.g.phase==='build')__lt.LT.startWave(__lt.G.g);});
 const log=[];
 for(let i=0;i<300;i++){
  const s=await p.evaluate(()=>{const g=__lt.G.g,L=g.lanes[0],L1=g.lanes[1];let hq=0;for(const v of __lt.views.values())if(v.hq)hq++;
   return {w:g.wave,ph:g.phase,t:Math.round(g.timer),alive:L.creeps.filter(c=>c.alive).length,q:L.spawnQ.length,clr:!!L.cleared,clr1:!!L1.cleared,units:L.units.length,hq,leaks:L.leaks};});
  if(!log.length||log[log.length-1].w!==s.w||log[log.length-1].ph!==s.ph){log.push({i,...s});console.log(JSON.stringify(log[log.length-1]));}
  if(s.w>=5&&s.ph==='battle'&&s.alive>3){await p.evaluate(()=>{__lt.G.speed=1;});await p.waitForTimeout(2000);await p.screenshot({path:'/workspace/legion-td/shots/hq/after_w5.png'});console.log('SHOT after_w5');break;}
  await p.evaluate(()=>{__lt.G.speed=8;const g=__lt.G.g;if(g.phase==='build'&&g.timer>1.5)g.timer=1.5;});
  await p.waitForTimeout(120);
 }
 console.log('final',JSON.stringify({log:log.slice(-8),errs:errs.slice(0,10)}));
 await b.close();})();
