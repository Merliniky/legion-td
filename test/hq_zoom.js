// close-up of HQ showcase rows: node test/hq_zoom.js → shots/hq/zoom_<i>.png
const {chromium}=require('./pw.js');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('http://127.0.0.1:8765/index.html?showcase=hq'+(process.env.QS||''),{waitUntil:'load'});await p.waitForFunction(()=>window.__lt&&window.__lt.ready);await p.waitForTimeout(+(process.env.WAIT||5000));
 const rows=[[0,5],[5,10],[10,15],[15,17]];
 for(let i=0;i<rows.length;i++){await p.evaluate(([a,z])=>{const L=window.__lt;const vs=[...L.views.values()].slice(a,z);let x=0,zz=0;for(const v of vs){x+=v.g.position.x;zz+=v.g.position.z;}x/=vs.length;zz/=vs.length;
   L.camera.fov=13;L.camera.updateProjectionMatrix();L.camera.lookAt(x,0.5,zz);for(const v of L.views.values())if(v.label)v.label.style.display='none';},rows[i]);
  await p.waitForTimeout(400);await p.screenshot({path:`/workspace/legion-td/shots/hq/zoom_${i}.png`,clip:{x:0,y:250,width:390,height:330}});}
 console.log(JSON.stringify({errs}));await b.close();})();
