// 战斗截图：OUT=before PORT=8765 RACE=Paladin WAVES=3,5 node test/hq_shots.js → shots/hq/<OUT>_w<N>.png（AI 代打，指定波次战斗中截图）
const {chromium}=require('./pw.js');
const PORT=process.env.PORT||8765,RACE=process.env.RACE||'Paladin',OUT=process.env.OUT||'after',WAVES=(process.env.WAVES||'3,5').split(',').map(Number),EXTRA=process.env.QS||'';
const VIDEO=process.env.VIDEO;const DIR='/workspace/legion-td/shots/hq/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,...(VIDEO?{recordVideo:{dir:'/tmp/hqvid',size:{width:390,height:844}}}:{})});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto(`http://127.0.0.1:${PORT}/index.html?debug&seed=7&mode=X3${EXTRA}`);await p.waitForFunction(()=>window.__lt&&__lt.ready,null,{timeout:30000});
 await p.tap(`.rpick[data-r="${RACE}"]`,{force:true});await p.waitForTimeout(500);await p.tap('#startBtn',{force:true});await p.waitForTimeout(1200);
 await p.evaluate(()=>{__lt.G.g.autoP0=true;});await p.tap('#goBtn',{force:true});
 const maxW=Math.max(...WAVES);const done=new Set();
 for(let i=0;i<2000&&done.size<WAVES.length;i++){const s=await p.evaluate(()=>{const g=__lt.G.g;return {w:g.wave,ph:g.phase,n:g.lanes[0].creeps.filter(c=>c.alive).length,u:g.lanes[0].units.length}});
   if(s.ph==='battle'&&WAVES.includes(s.w)&&!done.has(s.w)){await p.evaluate(()=>{__lt.G.speed=1;});
     // wait until the fight is engaged (creeps reached the build zone)
     for(let k=0;k<40;k++){const eng=await p.evaluate(()=>__lt.G.g.lanes[0].units.some(u=>u.tgt&&u.tgt.alive));if(eng)break;await p.waitForTimeout(250);}
     await p.waitForTimeout(VIDEO?10500:1600);await p.screenshot({path:`${DIR}${OUT}_w${s.w}.png`});done.add(s.w);continue;}
   await p.evaluate(()=>{__lt.G.speed=4;const g=__lt.G.g;if(g.phase==='build'&&g.timer>6)g.timer=6;});await p.waitForTimeout(250);}
 const vid=VIDEO?await p.video().path():null;await ctx.close();await b.close();
 console.log(JSON.stringify({out:OUT,waves:[...done],errs:errs.slice(0,5),nErr:errs.length,video:vid}));})();
