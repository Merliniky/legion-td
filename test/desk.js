const { chromium } = require('/workspace/weapon-brawl-test/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:8765/index.html?debug&autostart');await p.waitForTimeout(2000);await p.screenshot({path:'/workspace/legion-td/shots/8_desktop.png'});console.log('desk errors',errs);await b.close();})();
