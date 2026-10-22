// OUT=after WAVES=2,4,5 [VIDEO=1] [QS='&q=high'] node test/hq_after.js
const {chromium}=require('./pw.js');const fs=require('fs');
const PORT=process.env.PORT||8765,RACE=process.env.RACE||'Paladin',OUT=process.env.OUT||'after';
const WAVES=(process.env.WAVES||'2,4,5').split(',').map(Number),EXTRA=process.env.QS||'&q=high',VIDEO=!!process.env.VIDEO;
const DIR='/workspace/legion-td/shots/hq/',VIDDIR='/tmp/hqvid2';
fs.mkdirSync(VIDDIR,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,...(VIDEO?{recordVideo:{dir:VIDDIR,size:{width:390,height:844}}}:{})});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
 await p.goto(`http://127.0.0.1:${PORT}/index.html?debug&seed=7&mode=X3&race=${RACE}&autostart${EXTRA}`,{waitUntil:'load',timeout:60000});
 await p.waitForFunction(()=>window.__lt&&__lt.ready,{timeout:60000});
 await p.waitForTimeout(2000);
 await p.waitForFunction(()=>__lt.hqReady('h09L')&&__lt.hqReady('h002'),{timeout:60000}).catch(e=>errs.push('hq:'+e.message));
 await p.evaluate(()=>{__lt.G.g.autoP0=true;});
 // kick off if still in build
 await p.evaluate(()=>{const g=__lt.G.g;if(g.phase==='build')__lt.LT.startWave(g);});
 const want=new Set(WAVES),done=new Set();let loops=0;let videoWave=null;
 while(done.size<want.size&&loops++<800){
  const s=await p.evaluate((wantArr)=>{const g=__lt.G.g,L=g.lanes[0];
    // force-skip waves we don't need to watch: clear both lanes so endWave fires
    if(g.phase==='battle'&&!wantArr.includes(g.wave)){
      for(const Ln of g.lanes){Ln.spawnQ.length=0;for(const c of Ln.creeps)c.alive=false;Ln.pend.length=0;Ln.cleared=true;}
      // endWave is private; clear via stepping — mark and call through step by zeroing king? Use income path: both cleared → endWave on next step
    }
    return {w:g.wave,ph:g.phase,alive:L.creeps.filter(c=>c.alive).length,hq:[...__lt.views.values()].filter(v=>v.hq).length};},WAVES);
  if(s.ph==='battle'&&want.has(s.w)&&!done.has(s.w)){
    await p.evaluate(()=>{__lt.G.speed=1;});
    for(let k=0;k<40;k++){const eng=await p.evaluate(()=>{const L=__lt.G.g.lanes[0];return L.units.some(u=>u.tgt&&u.tgt.alive)||L.creeps.filter(c=>c.alive&&c.y>4).length>=5;});if(eng)break;await p.waitForTimeout(200);}
    const hold=(VIDEO&&videoWave==null)?10000:1600;
    if(VIDEO&&videoWave==null)videoWave=s.w;
    await p.waitForTimeout(hold);
    await p.screenshot({path:`${DIR}${OUT}_w${s.w}.png`});done.add(s.w);
    // after shot, skip rest of this wave so we can move on
    await p.evaluate(()=>{for(const Ln of __lt.G.g.lanes){Ln.spawnQ.length=0;for(const c of Ln.creeps)c.alive=false;Ln.pend.length=0;Ln.cleared=true;}__lt.G.speed=8;});
    await p.waitForTimeout(400);continue;}
  await p.evaluate(()=>{__lt.G.speed=8;const g=__lt.G.g;if(g.phase==='build'&&g.timer>1.2)g.timer=1.2;
    if(g.phase==='battle'){for(const Ln of g.lanes){if(!Ln.cleared){/* let wanted waves play; unwatched cleared above */}}}
  });
  await p.waitForTimeout(150);
 }
 const info=await p.evaluate(()=>{let hq=0,tk=0;for(const v of __lt.views.values()){if(v.hq)hq++;else if(v.proc)tk++;}return {hq,tk,tier:__lt.quality(),heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null,doneWaves:true};});
 const vid=VIDEO?await p.video().path():null;await ctx.close();await b.close();
 console.log(JSON.stringify({out:OUT,waves:[...done],videoWave,info,errs:errs.slice(0,8),nErr:errs.length,video:vid}));
})().catch(e=>{console.error(String(e));process.exit(1);});
