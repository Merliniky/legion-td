// 战斗性能采样：PORT=8765 WAVE=1 node test/perf_battle.js → 可见网格数(≈draw calls)、三角形、单位数、fps(无GPU仅作相对比较)
const {chromium}=require('./pw.js');
const PORT=process.env.PORT||8765,WAVE=+process.env.WAVE||1;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://127.0.0.1:${PORT}/index.html?debug&seed=11&mode=X3`);await p.waitForFunction(()=>window.__lt&&__lt.ready,null,{timeout:30000});
 await p.tap('.rpick[data-r="Mech"]',{force:true}).catch(()=>p.click('.rpick[data-r="Mech"]',{force:true}));await p.waitForTimeout(500);await p.click('#startBtn',{force:true});await p.waitForTimeout(1000);
 await p.evaluate(()=>{__lt.G.g.autoP0=true;});await p.click('#goBtn',{force:true});
 for(let i=0;i<600;i++){const s=await p.evaluate(()=>[__lt.G.g.wave,__lt.G.g.phase]);if(s[0]>=WAVE&&s[1]==='battle')break;await p.evaluate(()=>{__lt.G.speed=4;const g=__lt.G.g;if(g.phase==='build'&&g.timer>8)g.timer=8;});await p.waitForTimeout(300);}
 await p.evaluate(()=>{__lt.G.speed=1;});await p.waitForTimeout(2500);
 const r=await p.evaluate(()=>new Promise(res=>{let f=0,mx=0,tri=0,un=0;const t0=performance.now();const step=()=>{f++;if(f%10===0){let m=0,t=0;__lt.scene.traverseVisible(o=>{if(o.isMesh||o.isSprite||o.isPoints){m++;const g=o.geometry;if(g&&o.isMesh)t+=(g.index?g.index.count:g.attributes.position.count)/3;}});if(m>mx){mx=m;tri=t;un=__lt.G.g.lanes.reduce((a,L)=>a+L.units.length,0);}}
   if(performance.now()-t0<5000)requestAnimationFrame(step);else res({maxMeshes:mx,tris:Math.round(tri),units:un,fps:+(f/5).toFixed(1),heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null});};requestAnimationFrame(step);}));
 console.log(JSON.stringify({wave:WAVE,...r,errs:errs.length}));await b.close();})();
