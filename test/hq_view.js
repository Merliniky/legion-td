// node test/hq_view.js <out> <query>  → shots/hq/<out>.png
const {chromium}=require('./pw.js');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:900,height:620}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});
 await p.goto('http://127.0.0.1:8765/test/hq_view.html?'+(process.argv[3]||''),{waitUntil:'load'});await p.waitForFunction(()=>window.done,null,{timeout:60000}).catch(e=>errs.push('timeout'));await p.waitForTimeout(300);
 await p.screenshot({path:`/workspace/legion-td/shots/hq/${process.argv[2]||'view'}.png`});console.log(JSON.stringify(errs.slice(0,5)));await b.close();})();
