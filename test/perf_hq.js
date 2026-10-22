// HQ perf at a phone viewport: PORT=8765 WAVE=5 QS='&q=high' node test/perf_hq.js
// → per-frame draw calls + triangles (incl. shadow + post passes, via renderer.render hook), visible units, JS heap, fps (swiftshader: relative only), quality tier
const {chromium}=require('./pw.js');
const PORT=process.env.PORT||8765,WAVE=+process.env.WAVE||5,QS=process.env.QS||'',RACE=process.env.RACE||'Paladin';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-precise-memory-info']});
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());if(m.text().startsWith('[quality]'))errs.push(m.text());});
 await p.goto(`http://127.0.0.1:${PORT}/index.html?debug&seed=11&mode=X3&ai=Paladin${QS}`);await p.waitForFunction(()=>window.__lt&&__lt.ready,null,{timeout:30000});
 await p.click(`.rpick[data-r="${RACE}"]`,{force:true});await p.waitForTimeout(500);await p.click('#startBtn',{force:true});await p.waitForTimeout(1000);
 await p.evaluate(()=>{__lt.G.g.autoP0=true;});await p.click('#goBtn',{force:true});
 for(let i=0;i<900;i++){const s=await p.evaluate(()=>[__lt.G.g.wave,__lt.G.g.phase]);if(s[0]>=WAVE&&s[1]==='battle')break;await p.evaluate(()=>{__lt.G.speed=4;const g=__lt.G.g;if(g.phase==='build'&&g.timer>6)g.timer=6;});await p.waitForTimeout(250);}
 await p.evaluate(()=>{__lt.G.speed=1;});
 // wait until the fight is engaged (creeps reached units)
 for(let i=0;i<40;i++){const n=await p.evaluate(()=>{const L=__lt.G.g.lanes[0];return L.creeps.filter(c=>c.alive&&c.y>3.5).length;});if(n>5)break;await p.waitForTimeout(250);}
 await p.waitForTimeout(800);
 const r=await p.evaluate(()=>new Promise(res=>{const R=__lt.renderer;const orig=R.render.bind(R);let calls=0,tri=0,fr=0,mxC=0,mxT=0,fc=0,ft=0;
   R.render=function(s,c){orig(s,c);calls+=R.info.render.calls;tri+=R.info.render.triangles;};
   const t0=performance.now();let views=0,hq=0;const step=()=>{fr++;if(fr>1){mxC=Math.max(mxC,calls);mxT=Math.max(mxT,tri);fc+=calls;ft+=tri;}calls=0;tri=0;let a=0,h=0;for(const v of __lt.views.values()){if(!v.e.alive&&!v.e.inactive)continue;a++;if(v.hq)h++;}views=Math.max(views,a);hq=Math.max(hq,h);
     if(performance.now()-t0<5000)requestAnimationFrame(step);else{R.render=orig;res({avgCalls:Math.round(fc/(fr-1)),maxCalls:mxC,avgTris:Math.round(ft/(fr-1)),maxTris:mxT,liveViews:views,hqViews:hq,fps:+(fr/5).toFixed(1),heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null,gpuGeo:R.info.memory.geometries,gpuTex:R.info.memory.textures,programs:R.info.programs.length,tier:__lt.quality()});}};requestAnimationFrame(step);}));
 console.log(JSON.stringify({wave:WAVE,qs:QS,...r,errs}));await b.close();})();
