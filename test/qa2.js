const { chromium } = require('./pw.js');
const OUT='/workspace/legion-td/shots/';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+' '+m.text());});
 await p.goto('http://127.0.0.1:8765/index.html?debug&seed=3');await p.waitForTimeout(1200);await p.tap('#startBtn',{force:true});await p.waitForTimeout(800);
 const st=()=>p.evaluate(()=>{const g=__lt.G.g;return {wave:g.wave,phase:g.phase,gold:Math.floor(g.gold[0]),inc:g.income[0],kings:g.lanes.map(L=>Math.round(L.king.hp)),over:g.over};});
 const tapCell=async(c,r)=>{const [x,y]=await p.evaluate(([c,r])=>__lt.cellScreen(c,r),[c,r]);await p.touchscreen.tap(x,y);await p.waitForTimeout(100);};
 await p.tap('#rosterGrid [data-t="dwarf"]',{force:true});await tapCell(4,4);await p.tap('#rosterGrid [data-t="archer"]',{force:true});await tapCell(3,7);await tapCell(5,7);
 await tapCell(4,4);await p.waitForTimeout(300);await p.screenshot({path:OUT+'1c_info2.png'});await p.tap('#iX',{force:true});
 await p.tap('.tab[data-tab="king"]',{force:true});await p.waitForTimeout(300);await p.screenshot({path:OUT+'1d_king.png'});await p.tap('.tab[data-tab="build"]',{force:true});
 await p.tap('#goBtn',{force:true});await p.waitForTimeout(5500);await p.screenshot({path:OUT+'2b_battle.png'});
 await p.tap('#rosterGrid [data-t="pikeman"]',{force:true});await tapCell(6,9);console.log('mid-battle place',await p.evaluate(()=>__lt.G.g.lanes[0].units.map(u=>u.type+(u.inactive?'(待命)':'')).join(',')));
 await p.tap('#oppBtn',{force:true});await p.waitForTimeout(1500);await p.screenshot({path:OUT+'6_opp.png'});console.log('views in opp',await p.evaluate(()=>__lt.views.size));
 await p.tap('#oppBtn',{force:true});await p.waitForTimeout(500);
 // pause / resume
 await p.tap('#pauseBtn',{force:true});await p.waitForTimeout(400);await p.screenshot({path:OUT+'7_pause.png'});await p.tap('#resumeBtn',{force:true});
 // sell during build test + lose path: never build again, fast-forward
 await p.evaluate(()=>{__lt.G.speed=8;});
 for(let i=0;i<500;i++){const s=await st();if(s.over)break;if(s.phase==='build')await p.tap('#goBtn',{force:true});await p.waitForTimeout(400);}
 console.log('end',await st());await p.waitForTimeout(2500);await p.screenshot({path:OUT+'5_lose.png'});
 await p.tap('#againBtn',{force:true});await p.waitForTimeout(800);console.log('restart',await st());
 console.log('errors',errs.length?errs.slice(0,20):'none');await b.close();})();
