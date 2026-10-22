// headless QA per race: 390x844 phone, race pick via UI, build via UI taps, then AI-assisted play for several waves.
// usage: RACE=Beast MAXW=6 node test/qa_race.js   → shots/races/<race>_*.png, prints JSON summary
const { chromium } = require('./pw.js');
const BT=+process.env.BUILDT||10;const RACE=process.env.RACE||'Beast',MAXW=+process.env.MAXW||6,MODE=process.env.MODE||'X3';const OUT='/workspace/legion-td/shots/races/';
const URL=`http://127.0.0.1:8765/index.html?debug&seed=11&mode=${MODE}`;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.type()+' '+m.text());});
 await p.goto(URL);await p.waitForFunction(()=>window.__lt&&__lt.ready,null,{timeout:20000});
 await p.tap(`.rpick[data-r="${RACE}"]`,{force:true});await p.waitForTimeout(700);if(RACE==='Beast')await p.screenshot({path:OUT+'_title.png'});
 await p.tap('#startBtn',{force:true});await p.waitForTimeout(1500);
 // hook: tally ability counters + event kinds before the UI consumes them
 await p.evaluate(()=>{const LT=__lt.LT,st=LT.step;window.__ev={};LT.step=function(g,dt){st(g,dt);for(const L of g.lanes)for(const e of L.events)__ev[e.k]=(__ev[e.k]||0)+1;};});
 const st=()=>p.evaluate(()=>{const g=__lt.G.g;const P=g.P[0];return {race:P.race,ai:g.P[1].race,wave:g.wave,phase:g.phase,gold:Math.floor(P.gold),lum:Math.floor(P.lumber),inc:P.income,val:P.value,units:g.lanes[0].units.length,aiUnits:g.lanes[1].units.length,kings:g.lanes.map(L=>Math.round(L.king.hp)),over:g.over,views:__lt.views.size};});
 const tapCell=async(c,r)=>{const [x,y]=await p.evaluate(([c,r])=>__lt.cellScreen(c,r),[c,r]);await p.touchscreen.tap(x,y);await p.waitForTimeout(150);};
 const lines=await p.evaluate(()=>__lt.LT.raceLines(__lt.G.g,0));
 // place two tier-1 units through the UI
 await p.tap(`#rosterGrid [data-t="${lines[0]}"]`,{force:true});await p.waitForTimeout(150);for(const c of [3,5])await tapCell(c,4);
 await p.waitForTimeout(1500);await p.screenshot({path:OUT+RACE+'_1build.png'});
 await tapCell(3,4);await p.waitForTimeout(600);await p.screenshot({path:OUT+RACE+'_2info.png'});if(await p.$('#iX'))await p.tap('#iX',{force:true});
 await p.evaluate(()=>{__lt.G.g.autoP0=true;});   // AI plays the rest for the player (same race)
 await p.tap('#goBtn',{force:true});await p.waitForTimeout(2500);
 let shotB=false,shotL=false;
 for(let i=0;i<900;i++){const s=await st();if(s.over||s.wave>MAXW)break;
   if(s.phase==='battle'&&s.wave>=3&&!shotB){await p.evaluate(()=>{__lt.G.speed=1;});await p.waitForTimeout(5000);await p.screenshot({path:OUT+RACE+'_3battle.png'});shotB=true;}
   await p.evaluate((BT)=>{__lt.G.speed=4;const g=__lt.G.g;if(g.phase==="build"&&g.timer>BT)g.timer=BT;},BT);
   if(s.wave===MAXW&&s.phase==='battle'&&!shotL){await p.evaluate(()=>{__lt.G.speed=1;});await p.waitForTimeout(3500);await p.screenshot({path:OUT+RACE+'_4late.png'});shotL=true;}
   await p.waitForTimeout(400);}
 const s=await st();const fx=await p.evaluate(()=>{const o={};for(const L of __lt.G.g.lanes)for(const k in (L.fxc||{}))o[k]=(o[k]||0)+L.fxc[k];return o;});const ev=await p.evaluate(()=>__ev);
 // info of the strongest unit at the end (ability text panel)
 await p.evaluate(()=>{__lt.G.paused=true;});
 console.log(JSON.stringify({race:RACE,end:s,fx,ev,errs:errs.slice(0,8),nErr:errs.length}));
 await b.close();})().catch(e=>{console.log(JSON.stringify({race:RACE,fatal:String(e)}));process.exit(1);});
