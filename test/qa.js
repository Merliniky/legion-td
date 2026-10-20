// headless QA: phone viewport, play several waves, screenshots + console errors
const { chromium } = require('/workspace/weapon-brawl-test/node_modules/playwright-core');
const URL='http://127.0.0.1:8765/index.html?debug&seed=7'+(process.env.Q||'');const OUT='/workspace/legion-td/shots/';const MAXW=+process.env.MAXW||5;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+' '+m.text());});
 await p.goto(URL);await p.waitForTimeout(1500);await p.screenshot({path:OUT+'0_title.png'});
 await p.tap('#startBtn',{force:true});await p.waitForTimeout(1200);
 const st=()=>p.evaluate(()=>{const g=__lt.G.g;return {wave:g.wave,phase:g.phase,timer:+g.timer.toFixed(1),gold:Math.floor(g.gold[0]),inc:g.income[0],units:g.lanes[0].units.length,aiUnits:g.lanes[1].units.length,kings:g.lanes.map(L=>Math.round(L.king.hp)),over:g.over,views:__lt.views.size,creeps:g.lanes[0].creeps.filter(c=>c.alive).length};});
 const tapCell=async(c,r)=>{const [x,y]=await p.evaluate(([c,r])=>__lt.cellScreen(c,r),[c,r]);await p.touchscreen.tap(x,y);await p.waitForTimeout(120);};
 const pick=async t=>{await p.tap(`#rosterGrid [data-t="${t}"]`,{force:true});await p.waitForTimeout(100);};
 console.log('start',await st());
 // build: 3 pikemen front, 2 archers behind (UI taps)
 await pick('pikeman');for(const c of [3,4,5])await tapCell(c,4);
 await pick('archer');for(const c of [4])await tapCell(c,7);
 console.log('after build',await st());
 await p.waitForTimeout(800);await p.screenshot({path:OUT+'1_build.png'});
 // tap a unit → info panel
 await tapCell(4,4);await p.waitForTimeout(300);await p.screenshot({path:OUT+'1b_info.png'});await p.tap('#iX',{force:true});
 // start wave early
 await p.tap('#goBtn',{force:true});await p.waitForTimeout(3500);console.log('wave1',await st());await p.screenshot({path:OUT+'2_battle.png'});
 await p.evaluate(()=>{__lt.G.speed=6;});
 let shotMerc=false,shotLate=false,lastW=1;
 for(let i=0;i<400;i++){const s=await st();if(s.over)break;
   if(s.phase==='build'){
     if(s.wave!==lastW){lastW=s.wave;console.log('build before wave',s.wave+1,s);
       // player bot: spend via UI: upgrade one, place one, send merc from wave 2
       await p.evaluate(()=>{__lt.G.speed=1;});
       if(s.wave>=2&&!shotMerc){await p.tap('.tab[data-tab="merc"]',{force:true});await p.tap('#mercGrid [data-m="imp"]',{force:true});await p.waitForTimeout(300);await p.screenshot({path:OUT+'3_merc.png'});shotMerc=true;await p.tap('.tab[data-tab="build"]',{force:true});}
       else if(s.wave>=2&&s.gold>=40){await p.tap('.tab[data-tab="merc"]',{force:true});await p.tap('#mercGrid [data-m="imp"]',{force:true});await p.tap('.tab[data-tab="build"]',{force:true});}
       await p.evaluate(()=>{const g=__lt.G.g;for(let k=0;k<12;k++){__lt.LT.AI.act(g,0,{merc:0});}});
       await p.evaluate(()=>{__lt.G.speed=6;});
       if(s.wave+1>=MAXW&&!shotLate){}
       await p.tap('#goBtn',{force:true});}
   }
   if(s.wave>=MAXW&&s.phase==='battle'&&!shotLate){await p.evaluate(()=>{__lt.G.speed=1;});await p.waitForTimeout(4000);await p.screenshot({path:OUT+'4_late.png'});shotLate=true;await p.evaluate(()=>{__lt.G.speed=6;});}
   if(process.env.FULL!=='1'&&s.wave>MAXW)break;
   await p.waitForTimeout(500);}
 const s=await st();console.log('end',s);
 if(s.over){await p.waitForTimeout(2500);await p.screenshot({path:OUT+'5_over.png'});}
 // opponent view
 await p.tap('#oppBtn',{force:true});await p.waitForTimeout(1200);await p.screenshot({path:OUT+'6_opp.png'});
 console.log('errors',errs.length?errs.slice(0,20):'none');await b.close();})();
