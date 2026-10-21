// 截图各种族模型展示：node test/showcase.js [key ...]  → shots/races/showcase_<key>.png
const {chromium}=require('/workspace/weapon-brawl-test/node_modules/playwright-core');
const keys=process.argv.slice(2).length?process.argv.slice(2):['Arctic','Beast','Demi-Human','Element','Elf','Ghost','Goblin','Hybrid','Marine','Mech','Nature','Paladin','Prophet','Shadow','Undead','Orc','waves','summons'];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const res={};for(const k of keys){const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8765/index.html?showcase='+encodeURIComponent(k),{waitUntil:'load'});
  await p.waitForFunction(()=>window.__lt&&window.__lt.ready,null,{timeout:60000}).catch(()=>{});await p.waitForTimeout(6000);
  await p.screenshot({path:`/workspace/legion-td/shots/races/showcase_${k}.png`});res[k]={errs:errs.length,first:errs[0]};await p.close();}
 console.log(JSON.stringify(res));await b.close();})();
