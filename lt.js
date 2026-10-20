// 军团战争 (Legion TD) — renderer + UI. Logic lives in lt_core.js (window.LT). Rendering approach reused from 英雄冲突/宝石塔防.
import * as THREE from 'three';
import {SPR_UNITS,SPR_ALIAS,SPR_K,SPR_V} from './sprdata.js';
const LT=window.LT,S=SFX.S,$=id=>document.getElementById(id);
const DEBUG=/[?&]debug/.test(location.search);
const W=LT.W,H=LT.H,W2=W/2,H2=H/2;const B=LT.BUILD;
const cw=(x,y)=>[x-W2,y-H2];
const now=()=>performance.now()/1000;
// ---------- renderer / scene: saturated Clash-style daylight ----------
const cv=$('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
let PR=Math.min(2,devicePixelRatio||1);renderer.setPixelRatio(PR);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.98;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x76b9e6);scene.fog=new THREE.Fog(0x76b9e6,30,60);
const camera=new THREE.PerspectiveCamera(40,1,0.5,90);
scene.add(new THREE.HemisphereLight(0xdcefff,0x4f7a2c,1.05));
const sun=new THREE.DirectionalLight(0xfff0d0,2.45);sun.position.set(-6,15,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-10,right:10,top:13,bottom:-13,near:1,far:45});sun.shadow.bias=-0.0005;sun.shadow.normalBias=0.025;scene.add(sun);scene.add(sun.target);
const ramp=(()=>{const d=new Uint8Array([110,110,110,255,190,190,190,255,255,255,255,255]);const t=new THREE.DataTexture(d,3,1);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t;})();
const toonM={};const tmat=(c,em=0,ei=0)=>{const k=c+'|'+em+'|'+ei;return toonM[k]||(toonM[k]=new THREE.MeshToonMaterial({color:c,gradientMap:ramp,emissive:em||0,emissiveIntensity:ei}));};
function cnv(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const glowTex=cnv(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,.75)');g.addColorStop(0.6,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});
const puffTex=cnv(64,64,(x)=>{for(const [cx,cy,r] of [[32,34,20],[22,30,13],[42,28,14],[30,22,12],[38,40,12]]){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(0.7,'rgba(255,255,255,.7)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}});
const shadowTex=cnv(64,64,(x)=>{const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(0,0,0,.62)');g.addColorStop(0.5,'rgba(0,0,0,.34)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);});
const BOX=new THREE.BoxGeometry(1,1,1);
// ---------- lane board: spawn dirt / build zone grid / battlefield / king courtyard ----------
function boardTex(){const P=64;return cnv(W*P,H*P,(x,cw_,ch)=>{
  for(let i=0;i<W;i++)for(let j=0;j<H;j++){let c;
    if(j<B.r0)c=(i+j)%2?'#c9a26a':'#c09a62';
    else if(j<=B.r1)c=(i+j)%2?'#7fd04a':'#74c541';
    else if(j<15)c=(i+j)%2?'#62b535':'#5aab31';
    else c=(i+j)%2?'#c8c2b4':'#bdb7a8';
    x.fillStyle=c;x.fillRect(i*P,j*P,P,P);}
  for(let k=0;k<3600;k++){const l=Math.random();const yy=Math.random()*ch;if(yy<B.r0*P||yy>15*P)continue;x.fillStyle=l<0.5?`rgba(60,140,30,${0.16+Math.random()*0.2})`:`rgba(190,240,120,${0.1+Math.random()*0.16})`;x.fillRect(Math.random()*cw_,yy,2,4+Math.random()*4);}
  for(let k=0;k<900;k++){x.fillStyle=`rgba(120,80,40,${0.1+Math.random()*0.2})`;x.fillRect(Math.random()*cw_,Math.random()*B.r0*P,3,3);}
  // build zone grid + frame
  x.strokeStyle='rgba(255,255,255,0.22)';x.lineWidth=2;for(let i=1;i<W;i++){x.beginPath();x.moveTo(i*P,B.r0*P);x.lineTo(i*P,(B.r1+1)*P);x.stroke();}for(let j=B.r0;j<=B.r1+1;j++){x.beginPath();x.moveTo(0,j*P);x.lineTo(cw_,j*P);x.stroke();}
  x.strokeStyle='rgba(255,240,170,0.85)';x.lineWidth=5;x.setLineDash([18,10]);x.strokeRect(3,B.r0*P+2,cw_-6,(B.r1-B.r0+1)*P-4);x.setLineDash([]);
  // courtyard stone joints
  x.strokeStyle='rgba(90,80,70,0.35)';x.lineWidth=2;for(let j=15;j<=H;j++){x.beginPath();x.moveTo(0,j*P);x.lineTo(cw_,j*P);x.stroke();}
  for(let j=15;j<H;j++)for(let i=0;i<=W;i++){const o=(j%2)*P/2;x.beginPath();x.moveTo(i*P+o,j*P);x.lineTo(i*P+o,(j+1)*P);x.stroke();}
  // danger line (leak)
  const ly=LT.LEAK_Y*P;x.fillStyle='rgba(255,70,50,0.35)';x.fillRect(0,ly-3,cw_,6);
});}
{const t=boardTex();t.anisotropy=4;const p=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshToonMaterial({map:t,gradientMap:ramp}));p.rotation.x=-Math.PI/2;p.receiveShadow=true;scene.add(p);
  const out=new THREE.Mesh(new THREE.PlaneGeometry(90,90),tmat(0x62b23d));out.rotation.x=-Math.PI/2;out.position.y=-0.02;out.receiveShadow=true;scene.add(out);}
// side walls (instanced blocks + merlons)
{const blocks=[];const WT=0.5,WH=0.42,X=W2+WT/2;
  for(let j=0;j<H+1;j++){const z=-H2+j;for(const xs of [-1,1]){const c=(j%2)?0xb3aea4:0xc4bfb3;blocks.push([xs*X,WH/2,z,WT,WH,1.0,c]);if(j%2===0)blocks.push([xs*X,WH+0.1,z,WT*0.9,0.2,0.42,0xd3cec2]);}}
  const im=new THREE.InstancedMesh(BOX,tmat(0xffffff),blocks.length);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  blocks.forEach(([x,y,z,sx,sy,sz,col],i)=>{m.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx,sy,sz));im.setMatrixAt(i,m);im.setColorAt(i,c.setHex(col));});
  im.castShadow=im.receiveShadow=true;scene.add(im);}
function towerG(h,roof){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(0.62,0.72,h,10),tmat(0xbdb8ad));body.position.y=h/2;g.add(body);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.72,0.66,0.16,10),tmat(0xd6d1c5));rim.position.y=h+0.04;g.add(rim);
  const r=new THREE.Mesh(new THREE.ConeGeometry(0.78,0.8,10),tmat(roof));r.position.y=h+0.52;g.add(r);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,6),tmat(0xffd04a,0x7a5a00,0.3));tip.position.y=h+0.98;g.add(tip);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;}
for(const sx of [-1,1]){const t=towerG(1.35,0xe0453a);t.position.set(sx*(W2+0.45),0,-H2-0.3);scene.add(t);const t2=towerG(0.85,0x3b7fe6);t2.position.set(sx*(W2+0.45),0,H2+0.35);scene.add(t2);}
// spawn portal (top)
const portalSwirl=(()=>{const g=new THREE.Group();const st=tmat(0x9b93a6),st2=tmat(0x7f778c);
  for(const s of [-1,1]){const p=new THREE.Mesh(BOX,st);p.scale.set(0.42,1.45,0.55);p.position.set(s*1.25,0.72,0);g.add(p);const cap=new THREE.Mesh(BOX,st2);cap.scale.set(0.56,0.18,0.66);cap.position.set(s*1.25,1.5,0);g.add(cap);
    const cr=new THREE.Mesh(new THREE.OctahedronGeometry(0.16,0),new THREE.MeshPhongMaterial({color:0xc58aff,emissive:0xa040ff,emissiveIntensity:0.8,flatShading:true}));cr.position.set(s*1.25,1.78,0);g.add(cr);}
  const arch=new THREE.Mesh(new THREE.TorusGeometry(1.25,0.2,6,18,Math.PI),st);arch.position.y=1.45;g.add(arch);
  const tex=cnv(128,128,(x)=>{x.translate(64,64);for(let i=0;i<5;i++){x.rotate(Math.PI*2/5);const gr=x.createLinearGradient(0,0,60,0);gr.addColorStop(0,'rgba(255,230,255,1)');gr.addColorStop(1,'rgba(150,60,255,0)');x.strokeStyle=gr;x.lineWidth=9;x.beginPath();for(let a=0;a<3.2;a+=0.1){const r=a*19;x.lineTo(Math.cos(a)*r,Math.sin(a)*r);}x.stroke();}
    const rg=x.createRadialGradient(0,0,0,0,0,62);rg.addColorStop(0,'rgba(255,255,255,.9)');rg.addColorStop(0.35,'rgba(190,110,255,.55)');rg.addColorStop(1,'rgba(90,20,200,0)');x.fillStyle=rg;x.beginPath();x.arc(0,0,64,0,7);x.fill();});
  const back=new THREE.Mesh(new THREE.CircleGeometry(1.15,28),new THREE.MeshBasicMaterial({color:0x2a0d55}));back.position.set(0,1.1,-0.05);g.add(back);
  const sw=new THREE.Mesh(new THREE.CircleGeometry(1.15,28),new THREE.MeshBasicMaterial({map:tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));sw.position.set(0,1.1,0.02);g.add(sw);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(1.3,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:glowTex,color:0xa050ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));pool.position.set(0,0.02,0.7);g.add(pool);
  g.traverse(o=>{if(o.isMesh&&o.material.isMeshToonMaterial){o.castShadow=true;o.receiveShadow=true;}});g.position.set(0,0,-H2-0.25);scene.add(g);return sw;})();
// king's castle (bottom): low keep behind the king + banners
{const g=new THREE.Group();const st=tmat(0xc4bfb3),st2=tmat(0xd6d1c5);
  const wall=new THREE.Mesh(BOX,st);wall.scale.set(5.2,0.7,0.6);wall.position.set(0,0.35,0.55);g.add(wall);
  for(let i=-2;i<=2;i++){const m=new THREE.Mesh(BOX,st2);m.scale.set(0.42,0.24,0.62);m.position.set(i*1.2,0.82,0.55);g.add(m);}
  for(const s of [-1,1]){const t=towerG(1.0,0x3b7fe6);t.scale.setScalar(0.8);t.position.set(s*2.8,0,0.5);g.add(t);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.3,6),tmat(0x6a4a2a));pole.position.set(s*1.6,1.1,0.5);g.add(pole);
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.35),new THREE.MeshToonMaterial({color:0x3b7fe6,gradientMap:ramp,side:THREE.DoubleSide}));fl.position.set(s*1.6+0.28,1.55,0.5);g.add(fl);}
  const dais=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.1,0.16,16),tmat(0xe8e2d0));dais.position.set(0,0.08,-0.65);g.add(dais);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(1.25,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:glowTex,color:0x4aa8ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0.6}));gl.position.set(0,0.17,-0.65);g.add(gl);
  g.traverse(o=>{if(o.isMesh&&o.material.isMeshToonMaterial){o.castShadow=true;o.receiveShadow=true;}});
  const [kx,kz]=cw(LT.KING_POS.x,LT.KING_POS.y);g.position.set(kx,0,kz+0.65);scene.add(g);}
// decorations outside the lane (instanced Clash trees, bushes, flowers)
{const R=(()=>{let s=11;return ()=>(s=(s*16807)%2147483647)/2147483647;})();const spots=[];
  for(let i=0;i<80;i++){const side=R();let x,z;if(side<0.3){x=(R()-0.5)*(W+14);z=-H2-1.6-R()*6;}else if(side<0.65){x=-(W2+1.4+R()*5);z=(R()-0.5)*(H+8);}else{x=W2+1.4+R()*5;z=(R()-0.5)*(H+8);}
    if(Math.abs(x)<2.6&&z<-H2)continue;spots.push([x,z]);}
  const trunkG=new THREE.CylinderGeometry(0.08,0.12,0.5,6),puffG=new THREE.IcosahedronGeometry(0.5,0);
  const trunks=new THREE.InstancedMesh(trunkG,tmat(0x7a5230),spots.length),pf=new THREE.InstancedMesh(puffG,tmat(0xffffff),spots.length*3);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color(),v=new THREE.Vector3(),s=new THREE.Vector3();let pi=0;
  spots.forEach(([x,z],i)=>{const k=0.8+R()*0.6;m.compose(v.set(x,0.25*k,z),q,s.set(k,k,k));trunks.setMatrixAt(i,m);const base=[0x3f9a36,0x4aae3e,0x56b845][i%3];
    for(let j=0;j<3;j++){const a=j*2.1+R(),r=j?0.28*k:0;q.setFromEuler(new THREE.Euler(R()*3,R()*3,R()*3));const ps=(j?0.62:0.8)*k;m.compose(v.set(x+Math.cos(a)*r,(0.75+(j?0.1:0.25))*k,z+Math.sin(a)*r),q,s.set(ps,ps*0.9,ps));pf.setMatrixAt(pi,m);pf.setColorAt(pi++,c.setHex(base).offsetHSL(0,0,(R()-0.5)*0.08));}});
  q.identity();trunks.castShadow=pf.castShadow=true;scene.add(trunks,pf);
  const fl=new THREE.InstancedMesh(new THREE.SphereGeometry(0.07,6,4),tmat(0xffffff),160);for(let i=0;i<160;i++){const side=i%3;const x=side===0?(R()-0.5)*(W+10):side===1?-(W2+0.8+R()*4):W2+0.8+R()*4;const z=side===0?-H2-0.9-R()*4:(R()-0.5)*(H+6);m.compose(v.set(x,0.05,z),q,s.set(1,0.6,1));fl.setMatrixAt(i,m);fl.setColorAt(i,c.setHex([0xffffff,0xffe14a,0xff7ab0,0xb48aff][i%4]));}scene.add(fl);
  const bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.32,0),tmat(0x3c9a3a),40);for(let i=0;i<40;i++){const x=(i%2?1:-1)*(W2+0.95+R()*0.5),z=(R()-0.5)*(H+2);m.compose(v.set(x,0.16,z),q.setFromEuler(new THREE.Euler(R(),R()*6,0)),s.set(1,0.75,1));bush.setMatrixAt(i,m);}q.identity();bush.castShadow=true;scene.add(bush);}
// ---------- camera fit: whole lane between top HUD and bottom panel ----------
let PITCH=62*Math.PI/180;const camBase=new THREE.Vector3(),camLook=new THREE.Vector3();let shakeA=0;
function fitCamera(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;const portrait=h>w*1.1;camera.fov=portrait?40:34;PITCH=(portrait?60:52)*Math.PI/180;camera.updateProjectionMatrix();
  const top=portrait?118:96,bot=(($('ltPanel')&&$('ltPanel').offsetHeight)||236)+6;const yMin=-1+2*bot/h,yMax=1-2*top/h;const XW=W2+0.42,ZT=H2+0.3,ZB=H2+0.4;
  const pts=[[-XW,-ZT],[XW,-ZT],[-XW,ZB],[XW,ZB]].map(([x,z])=>new THREE.Vector3(x,0,z)).concat([[-XW,-ZT],[XW,-ZT]].map(([x,z])=>new THREE.Vector3(x,0.6,z)),[new THREE.Vector3(0,2.0,-H2-0.25)]);
  const dir=new THREE.Vector3(0,Math.sin(PITCH),Math.cos(PITCH));let lo=5,hi=90;
  const place=(d,s)=>{camLook.set(0,0,s);camera.position.copy(camLook).addScaledVector(dir,d);camera.lookAt(camLook);camera.updateMatrixWorld();};
  for(let it=0;it<32;it++){const d=(lo+hi)/2;place(d,0);let ok=true;const ys=[];for(const p of pts){const q=p.clone().project(camera);if(Math.abs(q.x)>0.98)ok=false;ys.push(q.y);}if(Math.max(...ys)-Math.min(...ys)>yMax-yMin)ok=false;if(ok)hi=d;else lo=d;}
  const mid=s=>{place(hi,s);const ys=pts.map(p=>p.clone().project(camera).y);return (Math.max(...ys)+Math.min(...ys))/2;};const want=(yMax+yMin)/2;let a=-H,b=H;const inc=mid(b)>mid(a);for(let it=0;it<30;it++){const m=(a+b)/2;if((mid(m)<want)===inc)a=m;else b=m;}place(hi,(a+b)/2);
  camBase.copy(camera.position);scene.fog.near=hi*1.4;scene.fog.far=hi*3;}
addEventListener('resize',()=>{fitCamera();});
function shake(a){shakeA=Math.max(shakeA,a);}
// ---------- sprites (same atlases + facing logic as the auto-battler / Gem TD) ----------
const sprLoader=new THREE.TextureLoader();const SPR={},SPR_USE={};
const baseType=t=>SPR_ALIAS[t]?SPR_ALIAS[t][0]:t;
function loadSpr(t){t=baseType(t);if(!SPR_UNITS.includes(t))return Promise.resolve(null);SPR_USE[t]=now();
  return SPR[t]||(SPR[t]=fetch(`assets/spr/${t}.json?v=${SPR_V}`).then(r=>r.json()).then(m=>Promise.all(m.pages.map((_,i)=>new Promise((res,rej)=>sprLoader.load(`assets/spr/${t}_p${i}.webp?v=${SPR_V}`,res,undefined,rej)))).then(tx=>{for(const x of tx){x.colorSpace=THREE.SRGBColorSpace;x.anisotropy=4;}m.tex=tx;return m;})).catch(e=>{console.warn('spr',t,e);return null;}));}
// free GPU memory: atlases not used by any view for a while (creep types of past waves)
function sprGC(){const used=new Set();for(const v of views.values())used.add(baseType(v.type));const t0=now();
  for(const t in SPR){if(used.has(t)){SPR_USE[t]=t0;continue;}if(t0-(SPR_USE[t]||0)<20||KEEP.has(t))continue;const p=SPR[t];delete SPR[t];p.then(m=>{if(m)for(const x of m.tex)x.dispose();});}}
const KEEP=new Set();
const shadowMat=new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false});const shadowGeo=new THREE.PlaneGeometry(1,1);shadowGeo.rotateX(-Math.PI/2);
const _cr=new THREE.Vector3(),_cf=new THREE.Vector3(),_sp=new THREE.Vector3(),_cp=new THREE.Vector3();
function camFacing(yaw){_cr.setFromMatrixColumn(camera.matrixWorld,0);_cr.y=0;_cr.normalize();_cf.setFromMatrixColumn(camera.matrixWorld,2);_cf.y=0;_cf.normalize().negate();const fx=Math.sin(yaw),fz=Math.cos(yaw);return Math.atan2(fx*_cr.x+fz*_cr.z,fx*_cf.x+fz*_cf.z)*180/Math.PI;}
const UNIT_K=1.05,SPR_PUSH=1.6;
const views=new Map();const unitLayer=new THREE.Group();scene.add(unitLayer);
const hpBgM=new THREE.SpriteMaterial({color:0x10131f,depthTest:false,transparent:true,opacity:0.85});
const hpFgM={c:new THREE.SpriteMaterial({color:0xff4a3a,depthTest:false}),b:new THREE.SpriteMaterial({color:0xff2a8a,depthTest:false}),u:new THREE.SpriteMaterial({color:0x5fdc5a,depthTest:false}),k:new THREE.SpriteMaterial({color:0x4ab8ff,depthTest:false}),m:new THREE.SpriteMaterial({color:0xc070ff,depthTest:false})};
const ringG=new THREE.RingGeometry(0.3,0.4,24).rotateX(-Math.PI/2);
const ringM={c:new THREE.MeshBasicMaterial({color:0xff3b3b,transparent:true,opacity:0.85,depthWrite:false}),u:new THREE.MeshBasicMaterial({color:0x3b9bff,transparent:true,opacity:0.85,depthWrite:false}),m:new THREE.MeshBasicMaterial({color:0xb050ff,transparent:true,opacity:0.9,depthWrite:false}),b:new THREE.MeshBasicMaterial({color:0xff2a8a,transparent:true,opacity:0.9,depthWrite:false})};
const typeOf=e=>e.isKing?'titan':e.type;
function makeView(e){const g=new THREE.Group();const [x,z]=cw(e.x,e.y);g.position.set(x,0,z);unitLayer.add(g);const kind=e.isKing?'k':e.side==='u'?'u':e.boss?'b':e.merc?'m':'c';
  const sh=new THREE.Mesh(shadowGeo,shadowMat);sh.position.y=0.02;sh.renderOrder=2;const sw=e.boss?1.1:e.isKing?1.2:0.55;sh.scale.set(sw*1.15,1,sw*0.75);g.add(sh);
  if(kind!=='k'){const rg=new THREE.Mesh(ringG,ringM[kind==='u'?'u':kind==='b'?'b':kind==='m'?'m':'c']);rg.position.y=0.03;rg.renderOrder=2;rg.scale.setScalar(e.boss?1.6:0.95);g.add(rg);}
  const bg=new THREE.Sprite(hpBgM);bg.center.set(0,0.5);bg.renderOrder=8;const fg=new THREE.Sprite(hpFgM.c);fg.center.set(0,0.5);fg.renderOrder=9;scene.add(bg);scene.add(fg);
  const type=typeOf(e);
  const v={e,kind,type,g,sh,bg,fg,spr:null,yaw:kind==='u'||kind==='k'?Math.PI:0,hover:e.fly?0.5:0,k:UNIT_K*(SPR_K[type]||1)*(e.boss?1.7:e.isKing?1.55:1),deadT:0,sprK:'',sprT:0,sprDir:-1,sprMir:false,sprPg:0,flash:0,topY:0.7,born:now(),hidden:false};
  v.tint=SPR_ALIAS[type]?new THREE.Color(SPR_ALIAS[type][1]):new THREE.Color(1,1,1);
  loadSpr(type).then(m=>{if(!m||v.gone)return;const tx=m.tex.map(t=>{const c=t.clone();c.needsUpdate=true;return c;});const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx[0],transparent:true,alphaTest:0.02,depthWrite:false}));sp.renderOrder=3;unitLayer.add(sp);v.spr=sp;v.m=m;v.tx=tx;});
  views.set(e.id,v);return v;}
function dropView(v){v.gone=true;unitLayer.remove(v.g);scene.remove(v.bg);scene.remove(v.fg);if(v.spr){unitLayer.remove(v.spr);v.spr.material.dispose();for(const t of v.tx)t.dispose();}views.delete(v.e.id);}
function dropAllViews(){for(const v of [...views.values()])dropView(v);}
function sprUpdate(v,dt){const m=v.m,e=v.e;const dead=!e.alive&&!e.inactive;let k=dead?'death':(v.one||(e.moving?'walk':'idle'));if(k==='walk'&&m.anims.walk.n<2)k='idle';
  if(k!==v.sprK){v.sprK=k;v.sprT=0;}v.sprT+=dt;const A=m.anims[k];let f=Math.floor(v.sprT*A.fps*(k==='attack'?v.atkSpd||1:1));if(A.loop)f%=A.n;else if(f>=A.n){f=A.n-1;if(k!=='death')v.one=null;}
  const a=camFacing(v.yaw),aa=Math.abs(a),step=180/(m.dirs.length-1);let di=v.sprDir;if(di<0||Math.abs(aa-di*step)>step*0.5+6)di=Math.max(0,Math.min(m.dirs.length-1,Math.round(aa/step)));
  let mir=v.sprMir;if(v.sprDir<0||(a<-4&&!mir)||(a>4&&mir))mir=a<0;v.sprDir=di;v.sprMir=mir;
  const F=m.frames[di][A.row][f],pg=F[0],t=v.tx[pg],PW=m.pages[pg][0],PH=m.pages[pg][1];
  if(pg!==v.sprPg||v.spr.material.map!==t){v.sprPg=pg;v.spr.material.map=t;v.spr.material.needsUpdate=true;}
  t.repeat.set((mir?-1:1)*F[3]/PW,F[4]/PH);t.offset.set((mir?F[1]+F[3]:F[1])/PW,1-(F[2]+F[4])/PH);v.spr.center.set(mir?1-F[5]/F[3]:F[5]/F[3],1-F[6]/F[4]);
  const age=now()-v.born,grow=Math.min(1,age/0.35);
  _sp.copy(v.g.position);_sp.y+=v.hover;_cp.copy(camera.position).sub(_sp);const dist=_cp.length(),push=Math.min(SPR_PUSH,dist*0.3);
  v.spr.position.copy(_sp).addScaledVector(_cp,push/dist);const ks=(dist-push)/dist*v.k*1.25*grow;v.spr.scale.set(F[3]/m.ppu*ks*(1+v.flash*0.12),F[4]/m.ppu*ks*(1-v.flash*0.08),1);
  if(!dead)v.topY=v.hover+Math.min(2.4,F[6]/m.ppu*v.k*1.25);
  v.flash=Math.max(0,v.flash-dt*5);const mc=v.spr.material.color;mc.copy(v.tint);if(v.gold)mc.lerp(new THREE.Color(0xffe080),0.25);mc.multiplyScalar(1+v.flash*2.2);
  v.spr.material.opacity=e.inactive?0.5:!dead?1:Math.max(0,1-Math.max(0,v.deadT-0.5)/0.4);}
function updateViews(dt){for(const v of [...views.values()]){const e=v.e;const dead=!e.alive&&!e.inactive;
    if(dead){v.deadT+=dt;if(v.kind==='c'||v.kind==='m'||v.kind==='b'){if(v.deadT>0.95){dropView(v);continue;}}
      else if(v.deadT>1.0&&!v.hidden){v.hidden=true;v.g.visible=false;if(v.spr)v.spr.visible=false;}}
    else{if(v.hidden||v.deadT>0){v.hidden=false;v.deadT=0;v.g.visible=true;if(v.spr)v.spr.visible=true;v.sprK='';v.one=null;v.born=now();if(v.kind==='u')v.yaw=Math.PI;}
      const [x,z]=cw(e.x,e.y);const dx=x-v.g.position.x,dz=z-v.g.position.z;if(e.moving&&dx*dx+dz*dz>1e-5)v.yaw=Math.atan2(dx,dz);else if(e.face!=null&&v.one)v.yaw=e.face;v.g.position.set(x,0,z);}
    if(v.spr&&v.m)sprUpdate(v,dt);
    const show=!!(!dead&&!e.inactive&&(e.hp<e.maxHp||e.boss||e.isKing));v.bg.visible=v.fg.visible=show;
    if(show){const bw=e.boss||e.isKing?1.4:0.8,y=v.topY+0.16;v.bg.position.set(v.g.position.x-bw/2-0.03,y,v.g.position.z);v.bg.scale.set(bw+0.06,e.isKing?0.2:0.15,1);
      const p=Math.max(0,e.hp/e.maxHp);v.fg.material=hpFgM[v.kind==='k'?'k':v.kind==='u'?'u':v.kind==='b'?'b':v.kind==='m'?'m':'c'];v.fg.position.set(v.g.position.x-bw/2,y,v.g.position.z+0.001);v.fg.scale.set(bw*p,e.isKing?0.14:0.1,1);}}}
// ---------- fx: pooled instanced billboards (additive glow + smoke) ----------
function makePool(cap,tex,blend,ro){const geo=new THREE.PlaneGeometry(1,1);const aA=new THREE.InstancedBufferAttribute(new Float32Array(cap),1);aA.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('aAlpha',aA);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:blend});
  mat.onBeforeCompile=sh=>{sh.vertexShader='attribute float aAlpha;\nvarying float vA;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvA=aAlpha;');sh.fragmentShader='varying float vA;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vA;');};
  const im=new THREE.InstancedMesh(geo,mat,cap);im.frustumCulled=false;im.renderOrder=ro;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);const c0=new THREE.Color(1,1,1);for(let i=0;i<cap;i++)im.setColorAt(i,c0);im.count=0;scene.add(im);
  const P=[];for(let i=0;i<cap;i++)P.push({on:false});return {im,aA,P,cap,cur:0,hi:0};}
const ADD=makePool(1400,glowTex,THREE.AdditiveBlending,7),SMK=makePool(500,puffTex,THREE.NormalBlending,5),ORB=makePool(600,glowTex,THREE.NormalBlending,6);
const _col=new THREE.Color();
function spawn(pool,o){for(let n=0;n<pool.cap;n++){const i=(pool.cur+n)%pool.cap;const p=pool.P[i];if(p.on)continue;pool.cur=(i+1)%pool.cap;
    p.on=true;p.i=i;p.x=o.x;p.y=o.y;p.z=o.z;p.vx=o.vx||0;p.vy=o.vy||0;p.vz=o.vz||0;p.g=o.g||0;p.drag=o.drag||0;p.age=0;p.life=o.life||0.5;p.s0=o.s0??0.2;p.s1=o.s1??p.s0;p.a0=o.a??1;p.rot=o.rot??Math.random()*6.28;p.vr=o.vr||0;p.fin=o.fin||0;
    _col.set(o.col??0xffffff);pool.im.setColorAt(i,_col);pool.im.instanceColor.needsUpdate=true;if(i>=pool.hi)pool.hi=i+1;return p;}return null;}
const _bq=new THREE.Quaternion(),_bz=new THREE.Quaternion(),_bv=new THREE.Vector3(),_bs=new THREE.Vector3(),_bm=new THREE.Matrix4(),_Z=new THREE.Vector3(0,0,1),_zero=new THREE.Matrix4().makeScale(0,0,0);
function stepPool(pool,dt){let hi=0;const aA=pool.aA.array;
  for(let i=0;i<pool.hi;i++){const p=pool.P[i];if(!p.on){pool.im.setMatrixAt(i,_zero);aA[i]=0;continue;}
    p.age+=dt;if(p.age>=p.life){p.on=false;pool.im.setMatrixAt(i,_zero);aA[i]=0;continue;}hi=i+1;
    const k=p.age/p.life;p.vy-=p.g*dt;if(p.drag){const d=Math.max(0,1-p.drag*dt);p.vx*=d;p.vy*=d;p.vz*=d;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rot+=p.vr*dt;
    const s=p.s0+(p.s1-p.s0)*k;_bq.copy(camera.quaternion).multiply(_bz.setFromAxisAngle(_Z,p.rot));_bm.compose(_bv.set(p.x,p.y,p.z),_bq,_bs.set(s,s,s));pool.im.setMatrixAt(i,_bm);
    aA[i]=p.a0*(p.fin&&k<p.fin?k/p.fin:1)*(1-k*k);}
  pool.hi=hi;pool.im.count=hi;pool.im.instanceMatrix.needsUpdate=true;pool.aA.needsUpdate=true;}
function sparks(x,y,z,col,n=8,sp=2,s=0.12,life=0.45){for(let i=0;i<n;i++){const a=Math.random()*6.28,v=sp*(0.4+Math.random()*0.6);spawn(ADD,{x,y,z,vx:Math.cos(a)*v,vy:1+Math.random()*sp,vz:Math.sin(a)*v,g:6,drag:1.5,life:life*(0.7+Math.random()*0.6),s0:s,s1:s*0.2,col});}}
function puffs(x,y,z,n=6,col=0xffffff,s=0.35,sp=0.9,life=0.6){for(let i=0;i<n;i++){const a=i/n*6.28+Math.random()*0.5;spawn(SMK,{x:x+Math.cos(a)*0.08,y:y+Math.random()*0.1,z:z+Math.sin(a)*0.08,vx:Math.cos(a)*sp,vy:0.35+Math.random()*0.5,vz:Math.sin(a)*sp,drag:3,life:life*(0.8+Math.random()*0.4),s0:s*0.5,s1:s*1.4,col,a:0.85,vr:(Math.random()-0.5)*2,fin:0.1});}}
function dust(x,z,n=8,s=0.3){puffs(x,0.08,z,n,0xe9dcc0,s,1.4,0.55);}
function glowFlash(x,y,z,col,s=0.8,life=0.16){spawn(ADD,{x,y,z,life,s0:s*0.6,s1:s,col,a:1});}
const rangeGeo=new THREE.RingGeometry(0.9,1,64);rangeGeo.rotateX(-Math.PI/2);const rings=[];const ringPool=[];
function ringFx(x,z,col,r,life=0.35,y=0.05){let m=ringPool.pop();if(!m){m=new THREE.Mesh(rangeGeo,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.renderOrder=2;}m.material.color.set(col);m.position.set(x,y,z);scene.add(m);rings.push({m,t:0,life,r});}
function stepRings(dt){for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.t+=dt;const k=r.t/r.life;const e=1-Math.pow(1-k,3);r.m.scale.set(r.r*(0.2+0.8*e),1,r.r*(0.2+0.8*e));r.m.material.opacity=0.95*(1-k);if(k>=1){scene.remove(r.m);ringPool.push(r.m);rings.splice(i,1);}}}
const pillarGeo=new THREE.CylinderGeometry(0.45,0.6,7,16,1,true);const pillars=[];
function pillar(x,z,col){const m=new THREE.Mesh(pillarGeo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,map:glowTex}));m.position.set(x,3.5,z);scene.add(m);pillars.push({m,t:0});}
function stepPillars(dt){for(let i=pillars.length-1;i>=0;i--){const p=pillars[i];p.t+=dt;const k=p.t/1.1;p.m.scale.set(1-k*0.6,1,1-k*0.6);p.m.material.opacity=0.75*(1-k);if(k>=1){scene.remove(p.m);p.m.material.dispose();pillars.splice(i,1);}}}
// projectiles: glowing head + trail along a small arc
const SHOT={p:{col:0xfff2b0,s:0.22,arc:0.5},m:{col:0x9a7aff,s:0.38,arc:0.25},c:{col:0xff4a6a,s:0.36,arc:0.2},n:{col:0xffffff,s:0.25,arc:0.4},s:{col:0xb08a5a,s:0.34,arc:0.9},k:{col:0x6ac8ff,s:0.45,arc:0.15}};
const shots=[];
function shotFx(src,tgt,wind,travel,st){const sv=views.get(src.id),tv=views.get(tgt.id);if(!tv)return;const y0=sv?sv.topY*0.7:1.2;const [x0,z0]=cw(src.x,src.y);
  shots.push({x0,z0,y0,tv,tx:tv.g.position.x,tz:tv.g.position.z,t:-wind,dur:Math.max(0.08,travel),st});}
function stepShots(dt){for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.t+=dt;if(s.t<0)continue;if(!s.tv.gone){s.tx=s.tv.g.position.x;s.tz=s.tv.g.position.z;}const k=Math.min(1,s.t/s.dur);
    const x=s.x0+(s.tx-s.x0)*k,z=s.z0+(s.tz-s.z0)*k,y=s.y0+(0.55-s.y0)*k+Math.sin(k*Math.PI)*s.st.arc;
    spawn(ADD,{x,y,z,life:0.12,s0:s.st.s,s1:s.st.s*0.4,col:s.st.col,a:0.9});spawn(ORB,{x,y,z,life:0.05,s0:s.st.s*0.5,s1:s.st.s*0.5,col:0xffffff,a:0.9});
    if(k>=1){glowFlash(s.tx,0.55,s.tz,s.st.col,s.st.s*2.6,0.18);shots.splice(i,1);}}}
// ---------- screen-space juice (damage numbers, coins, toasts, banners) ----------
const toScreen=(()=>{const v=new THREE.Vector3();return (x,y,z)=>{v.set(x,y,z).project(camera);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];};})();
const dmgPool=[];for(let i=0;i<30;i++){const d=document.createElement('div');d.className='dmg';document.body.appendChild(d);dmgPool.push({d,busy:false});}
function dmgText(x,y,z,s,cls){const slot=dmgPool.find(p=>!p.busy);if(!slot)return;const [sx,sy]=toScreen(x,y,z);const d=slot.d;slot.busy=true;d.className='dmg '+(cls||'');d.textContent=s;d.style.left=sx+'px';d.style.top=sy+'px';
  const dx=(Math.random()-0.5)*30;d.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-90%) scale(1.15)',opacity:1,offset:0.2},{transform:`translate(calc(-50% + ${dx}px),-190%) scale(1)`,opacity:0}],{duration:850,easing:'ease-out'}).onfinish=()=>{slot.busy=false;d.style.opacity=0;};}
const pendDmg=new Map();
function addDmg(e,v){const vw=views.get(e.id);if(!vw)return;let p=pendDmg.get(e.id);if(!p){p={sum:0,t:0,vw,king:e.isKing};pendDmg.set(e.id,p);}p.sum+=v;}
function flushDmg(dt){for(const [id,p] of pendDmg){p.t+=dt;if(p.t>0.3){pendDmg.delete(id);if(p.sum>=1&&!p.vw.gone){const g=p.vw.g.position;dmgText(g.x,p.vw.topY+0.4,g.z,(p.king?'-':'')+Math.round(p.sum),p.king?'king':p.vw.kind==='u'?'':'');}}}}
function bump(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
function toast(html,cls,dur=2200){const t=document.createElement('div');t.className='toast '+(cls||'');t.innerHTML=html;$('toasts').appendChild(t);while($('toasts').children.length>3)$('toasts').firstChild.remove();setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),400);},dur);}
function banner(main,sub,cls,icon){const b=$('banner2');b.className='';b.innerHTML=`<div class="rib ${cls||''}">${icon?`<img src="${icon}">`:''}<div><b>${main}</b>${sub?`<small>${sub}</small>`:''}</div></div>`;void b.offsetWidth;b.className='show';}
function flash(col){const f=$('flash');f.style.background=col;f.classList.remove('on');void f.offsetWidth;f.classList.add('on');}
const icon=t=>`assets/ui/${t}.png`;
// ---------- selection marks / build-zone highlight / range ring ----------
const tileGeo=new THREE.PlaneGeometry(0.9,0.9).rotateX(-Math.PI/2);
const freeTiles=new THREE.InstancedMesh(tileGeo,new THREE.MeshBasicMaterial({color:0x7aff8a,transparent:true,opacity:0.32,depthWrite:false}),W*(B.r1-B.r0+1));freeTiles.renderOrder=1;freeTiles.count=0;freeTiles.frustumCulled=false;scene.add(freeTiles);
const _m4=new THREE.Matrix4();
function showFree(on){if(!on||!G.g){freeTiles.count=0;return;}const L=G.g.lanes[0];let n=0;for(let r=B.r0;r<=B.r1;r++)for(let c=0;c<W;c++)if(LT.cellFree(L,c,r)){const [x,z]=cw(c+0.5,r+0.5);_m4.makeTranslation(x,0.03,z);freeTiles.setMatrixAt(n++,_m4);}freeTiles.count=n;freeTiles.instanceMatrix.needsUpdate=true;}
const selRing=new THREE.Mesh(new THREE.RingGeometry(0.4,0.5,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd75e,transparent:true,depthWrite:false}));selRing.renderOrder=3;selRing.visible=false;scene.add(selRing);
const range=new THREE.Group();{const r1=new THREE.Mesh(new THREE.RingGeometry(0.965,1,72).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,depthWrite:false}));const d1=new THREE.Mesh(new THREE.CircleGeometry(1,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.12,depthWrite:false}));range.add(r1,d1);}
range.position.y=0.04;range.visible=false;range.renderOrder=2;scene.add(range);
const hoverTile=new THREE.Mesh(tileGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.5,depthWrite:false}));hoverTile.renderOrder=2;hoverTile.visible=false;scene.add(hoverTile);
// ---------- game state / flow ----------
const G={g:null,view:0,speed:1,paused:false,tab:'build',pick:null,sel:null,acc:0,overShown:false,lastHud:''};
window.__lt={G,LT,views,scene,freeTiles,hoverTile,cellScreen:(c,r)=>{const [x,z]=cw(c+0.5,r+0.5);return toScreen(x,0,z);}};
function laneV(){return G.g.lanes[G.view];}
function newGame(){SFX.init();S.go();const seed=DEBUG&&/[?&]seed=(\d+)/.test(location.search)?+RegExp.$1:undefined;const g=LT.newGame(seed);
  if(DEBUG&&/[?&]gold=(\d+)/.test(location.search))g.gold[0]=+RegExp.$1;if(/[?&]fast/.test(location.search))g.timer=8;
  G.g=g;G.view=0;G.pick=null;G.sel=null;G.overShown=false;G.paused=false;G.acc=0;dropAllViews();shots.length=0;
  for(const id of ['ltTitle','ltOver','ltPause'])$(id).classList.remove('show');for(const id of ['ltHud','ltPanel'])$(id).classList.remove('hidden');$('viewTag').classList.add('hidden');
  SFX.setTrack('menu');setTab('build');renderRoster();renderMerc();renderKing();closeInfo();fitCamera();hud(true);
  banner('第 1 波 准备','建造你的兵团！','build');setTimeout(()=>toast('👆 选择下方兵种，再点击发光的格子建造'),900);}
// ---------- UI: roster / mercs / king / unit info ----------
const ATK_I={n:'⚔',p:'🏹',m:'✨',s:'💣',c:'☄'};
function renderRoster(){const g=G.g;$('rosterGrid').innerHTML=LT.ROSTER.map(t=>{const d=LT.U[t];return `<div class="ucard ${G.pick===t?'sel':''} ${g&&g.gold[0]<d.cost?'poor':''}" data-t="${t}"><img src="${icon(t)}" alt=""><span class="tp">${ATK_I[d.atk]}${d.rng>2?'远':'近'}</span><span class="cn">${d.n}</span><span class="cc">💰${d.cost}</span></div>`;}).join('');}
function renderMerc(){const g=G.g;const q={};if(g)for(const t of g.sendQ[0])q[t]=(q[t]||0)+1;
  $('mercGrid').innerHTML=LT.MERCS.map(t=>{const d=LT.MERC[t];return `<div class="ucard ${g&&g.gold[0]<d.cost?'poor':''}" data-m="${t}"><img src="${icon(t)}" alt=""><span class="inc">+${d.inc}</span>${q[t]?`<span class="qn" style="right:auto;left:3px;top:18px">×${q[t]}</span>`:''}<span class="cn">${d.n}</span><span class="cc">💰${d.cost}</span></div>`;}).join('');
  const n=g?g.sendQ[0].length:0;$('mHint').textContent=n?`已派出 ${n} 个佣兵，将在第 ${g.wave+1} 波进攻对手`:'派出的佣兵会在下一波进攻对手，并永久增加你的收入';}
function renderKing(){const g=G.g;if(!g)return;const k=g.lanes[0].king;const c=LT.KUP.cost[k.lvl];
  $('kingBox').innerHTML=`<div class="por"><img src="${icon('titan')}"></div><div class="ib"><div class="nm">泰坦国王<small>等级 ${k.lvl+1}/${LT.KUP.cost.length+1}</small></div>
  <div class="st"><span>生命</span><b>${Math.ceil(k.hp)}/${k.maxHp}</b><span>攻击</span><b>${k.dmg} ✨魔法</b><span>射程</span><b>${LT.KING.rng}</b><span>护甲</span><b>${LT.ARM[LT.KING.arm]}</b></div>
  <div class="ds">国王会攻击靠近的敌人。每波结束恢复10%生命。</div>
  <div class="row"><button class="dbtn upg" id="kUpBtn" ${c==null||g.gold[0]<c?'disabled':''}>${c==null?'已满级':`⬆ 强化国王 💰${c}<small>生命+${LT.KUP.hp} 攻击+${LT.KUP.dmg}</small>`}</button></div></div>`;
  const b=$('kUpBtn');if(b)b.onclick=()=>{const r=LT.kingUpgrade(G.g,0);if(r.ok){S.forge();const [x,z]=cw(LT.KING_POS.x,LT.KING_POS.y);if(G.view===0){pillar(x,z,0x6ac8ff);sparks(x,1,z,0x6ac8ff,24,3,0.15);}toast('👑 国王已强化！');}else{S.tick();toast(r.reason,'bad');}renderKing();hud(true);};}
function statRows(d){const dps=d.dmg*(d.dbl?2:1)/d.cd;return `<span>生命</span><b>${d.hp}</b><span>攻击</span><b>${d.dmg}${d.dbl?'×2':''} ${ATK_I[d.atk]}${LT.ATK[d.atk]}</b><span>射程</span><b>${d.rng>2?d.rng:'近战'}</b><span>攻速</span><b>${d.cd}s · DPS ${dps.toFixed(0)}</b><span>护甲</span><b>${LT.ARM[d.arm]}</b>${d.splash?`<span>溅射</span><b>${d.splash}</b>`:''}${d.heal?`<span>治疗</span><b>${d.heal}</b>`:''}`;}
function openInfo(u){G.sel=u.id;G.pick=null;showFree(false);renderRoster();const g=G.g,d=u.d;const up=d.up?LT.U[d.up]:null;const battle=g.phase==='battle'&&!u.inactive;const sv=LT.sellValue(g,u);
  $('infoBox').innerHTML=`<div class="por"><img src="${icon(u.type)}"></div><div class="ib"><div class="nm">${d.n}<small>${d.base?'已升级':'一级'} · 价值 ${u.value}</small></div><div class="st">${statRows(d)}</div><div class="ds">${d.d}${up?` → <b style="color:#7affa0">${up.n}</b>：${up.d}`:''}</div>
  <div class="row">${up?`<button class="dbtn upg" id="iUp" ${battle||g.gold[0]<up.cost?'disabled':''}>⬆ ${up.n} 💰${up.cost}</button>`:''}<button class="dbtn sell" id="iSell" ${battle?'disabled':''}>💰 出售 +${sv}</button><button class="dbtn x" id="iX">✖</button></div>${battle?'<div class="ds" style="color:#ff9a8a">战斗中无法升级或出售</div>':''}</div>`;
  $('infoBox').classList.remove('hidden2');for(const id of ['tBuild','tMerc','tKing'])$(id).classList.add('hidden2');
  const [x,z]=cw(u.c+0.5,u.r+0.5);selRing.position.set(x,0.04,z);selRing.visible=true;range.position.set(x,0.04,z);const rr=Math.max(1.2,d.rng);range.scale.set(rr,1,rr);range.visible=true;
  if($('iUp'))$('iUp').onclick=()=>{const r=LT.upgrade(G.g,0,u.id);if(r.ok)openInfo(u);else{S.tick();toast(r.reason,'bad');}};
  $('iSell').onclick=()=>{const r=LT.sell(G.g,0,u.id);if(r.ok){closeInfo();}else{S.tick();toast(r.reason,'bad');}};
  $('iX').onclick=()=>{S.tap();closeInfo();};}
function closeInfo(){G.sel=null;selRing.visible=false;range.visible=false;$('infoBox').classList.add('hidden2');setTab(G.tab);}
function setTab(t){G.tab=t;for(const b of document.querySelectorAll('#ltPanel .tab'))b.classList.toggle('on',b.dataset.tab===t);
  $('tBuild').classList.toggle('hidden2',t!=='build');$('tMerc').classList.toggle('hidden2',t!=='merc');$('tKing').classList.toggle('hidden2',t!=='king');
  if(G.sel==null)$('infoBox').classList.add('hidden2');if(t!=='build'){G.pick=null;showFree(false);}if(t==='king')renderKing();if(t==='merc')renderMerc();}
for(const b of document.querySelectorAll('#ltPanel .tab'))b.onclick=()=>{S.tap();if(G.sel!=null){G.sel=null;selRing.visible=false;range.visible=false;}setTab(b.dataset.tab);if(G.view!==0)setView(0);};
$('rosterGrid').addEventListener('click',ev=>{const c=ev.target.closest('.ucard');if(!c||!G.g)return;const t=c.dataset.t;if(G.view!==0)setView(0);
  if(G.pick===t){G.pick=null;showFree(false);}else{G.pick=t;showFree(true);const d=LT.U[t];setHint(`${d.n}：${d.d} · 点击发光格子建造`);if(G.g.gold[0]<d.cost)setHint(`金币不足（需要 ${d.cost}）`,true);}S.tap();renderRoster();});
$('mercGrid').addEventListener('click',ev=>{const c=ev.target.closest('.ucard');if(!c||!G.g)return;const t=c.dataset.m;const r=LT.sendMerc(G.g,0,t);
  if(r.ok){S.whoosh();const d=LT.MERC[t];toast(`🐺 已派出 <b>${d.n}</b>，下一波进攻对手 · 收入 <b>+${d.inc}</b>`,'gold',1600);bump($('pInc'));}else{S.tick();toast(r.reason,'bad');}renderMerc();hud(true);});
function setHint(s,bad){const h=$('bHint');h.textContent=s;h.classList.toggle('bad',!!bad);}
$('goBtn').onclick=()=>{const g=G.g;if(!g||g.phase!=='build')return;S.go();LT.startWave(g);};
$('speedBtn').onclick=()=>{G.speed=G.speed===1?2:1;$('speedBtn').textContent=G.speed+'×';$('speedBtn').classList.toggle('on',G.speed>1);S.tap();};
$('pauseBtn').onclick=()=>{G.paused=true;$('ltPause').classList.add('show');S.tap();};
$('resumeBtn').onclick=()=>{G.paused=false;$('ltPause').classList.remove('show');S.tap();};
$('restartBtn').onclick=()=>{newGame();};
const muteLbl=()=>{$('muteBtn').textContent=SFX.muted?'🔇 声音：关':'🔊 声音：开';};muteLbl();
$('muteBtn').onclick=()=>{SFX.setMuted(!SFX.muted);muteLbl();};
$('startBtn').onclick=()=>newGame();$('againBtn').onclick=()=>newGame();
$('oppBtn').onclick=()=>{S.tap();setView(G.view?0:1);};
function setView(v){if(!G.g)return;G.view=v;dropAllViews();shots.length=0;pendDmg.clear();$('viewTag').classList.toggle('hidden',v===0);$('eyeT').textContent=v?'↩ 返回':'👁 观战';
  if(v){G.pick=null;showFree(false);if(G.sel!=null){G.sel=null;selRing.visible=false;range.visible=false;$('infoBox').classList.add('hidden2');setTab(G.tab);}renderRoster();}}
// ---------- input: tap the lane ----------
const ray=new THREE.Raycaster(),_ndc=new THREE.Vector2(),groundP=new THREE.Plane(new THREE.Vector3(0,1,0),0),_hit=new THREE.Vector3();
function pickCell(cx,cy){_ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);ray.setFromCamera(_ndc,camera);if(!ray.ray.intersectPlane(groundP,_hit))return null;return {x:_hit.x+W2,y:_hit.z+H2};}
let downP=null;
cv.addEventListener('pointerdown',e=>{downP={x:e.clientX,y:e.clientY,t:now()};});
cv.addEventListener('pointerup',e=>{if(!downP)return;const d=Math.hypot(e.clientX-downP.x,e.clientY-downP.y);downP=null;if(d>14)return;tapAt(e.clientX,e.clientY);});
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!G.g||!G.pick||G.view!==0){hoverTile.visible=false;return;}const p=pickCell(e.clientX,e.clientY);if(!p){hoverTile.visible=false;return;}const c=Math.floor(p.x),r=Math.floor(p.y);
  if(LT.cellFree(G.g.lanes[0],c,r)){const [x,z]=cw(c+0.5,r+0.5);hoverTile.position.set(x,0.035,z);hoverTile.visible=true;}else hoverTile.visible=false;});
function tapAt(sx,sy){const g=G.g;if(!g||g.over||G.paused)return;const p=pickCell(sx,sy);if(!p)return;
  if(G.view!==0){// spectating: tap a unit just shows its name
    return;}
  const L=g.lanes[0];const c=Math.floor(p.x),r=Math.floor(p.y);
  // tap on a unit (its home cell, or its current body during battle)
  let u=L.units.find(u=>u.c===c&&u.r===r);if(!u){let bd=0.6;for(const x of L.units){if(!x.alive)continue;const d=Math.hypot(x.x-p.x,x.y-p.y);if(d<bd){bd=d;u=x;}}}
  if(u){S.tap();openInfo(u);return;}
  if(G.pick){const r2=LT.place(g,0,G.pick,c,r);if(r2.ok){setHint(`${LT.U[G.pick].n} 已建造 · 继续点击格子可再建造`);if(g.gold[0]<LT.U[G.pick].cost){G.pick=null;showFree(false);setHint('金币不足，等待下一波收入',true);}else showFree(true);renderRoster();}
    else{S.tick();setHint(r2.reason,true);if(r2.reason!=='这里不能建造')toast(r2.reason,'bad');}return;}
  if(G.sel!=null){closeInfo();return;}
  if(c>=B.c0&&c<=B.c1&&r>=B.r0&&r<=B.r1){setHint('先在下方选择一个兵种',true);if(G.tab!=='build')setTab('build');}}
// ---------- HUD ----------
function hud(force){const g=G.g;if(!g)return;const L0=g.lanes[0],L1=g.lanes[1];const bt=g.phase==='build';
  const key=[g.wave,Math.ceil(g.timer),Math.floor(g.gold[0]),g.income[0],g.phase,Math.ceil(L0.king.hp),Math.ceil(L1.king.hp),L0.king.maxHp,g.sendQ[0].length,g.sendQ[1].length,L0.creeps.filter(c=>c.alive).length,L1.units.length].join('|');
  if(!force&&key===G.lastHud)return;const goldCh=G.lastGold!==Math.floor(g.gold[0]);G.lastHud=key;G.lastGold=Math.floor(g.gold[0]);
  $('hWave').textContent=bt?g.wave+1:g.wave;$('hTimer').textContent=bt?Math.max(0,Math.ceil(g.timer)):'战';$('pTimer').classList.toggle('urgent',bt&&g.timer<8);$('pTimer').classList.toggle('battle',!bt);
  $('hGold').textContent=Math.floor(g.gold[0]);$('hInc').textContent='+'+g.income[0];
  $('kMe').style.width=(100*L0.king.hp/L0.king.maxHp)+'%';$('kMeT').textContent=Math.ceil(L0.king.hp);$('kOpp').style.width=(100*L1.king.hp/L1.king.maxHp)+'%';$('kOppT').textContent=Math.ceil(L1.king.hp);
  const gb=$('goBtn');if(bt){gb.textContent=`▶ 开战 ${Math.max(0,Math.ceil(g.timer))}s`;gb.classList.remove('fight');gb.disabled=false;}else{gb.textContent=`⚔ 剩余 ${G.view?L1.creeps.filter(c=>c.alive).length:L0.creeps.filter(c=>c.alive).length}`;gb.classList.add('fight');gb.disabled=true;}
  // next wave info
  const wn=bt?g.wave+1:g.wave;const wd=LT.waveDef(Math.max(1,wn));const inc=bt?g.sendQ[1].length:(L0.mercIn||0);
  $('nextInfo').innerHTML=`<span class="nl">${bt?'下一波':'本波'}</span><img src="${icon(wd.t)}"><span>${wd.n} ×${wd.cnt}</span><span class="tag ${wd.boss?'boss':''}">${LT.ARM[wd.arm]}</span><span class="tag">${ATK_I[wd.atk]}${LT.ATK[wd.atk]}</span>${wd.boss?'<span class="tag boss">首领</span>':''}${inc?`<span class="tag merc">🐺 敌方佣兵 ×${inc}</span>`:''}`;
  if(goldCh||force){renderRoster();if(G.tab==='merc')renderMerc();if(G.tab==='king')renderKing();if(G.sel!=null){const u=L0.units.find(x=>x.id===G.sel);if(u&&$('iUp')){const up=LT.U[u.d.up];$('iUp').disabled=(g.phase==='battle'&&!u.inactive)||g.gold[0]<up.cost;}}}}
// ---------- events from the sim → fx / sfx / ui ----------
let sndT={};const sndOk=(k,gap)=>{const t=now();if(t-(sndT[k]||0)<gap)return false;sndT[k]=t;return true;};
function atkSound(e,ranged){const a=e.isKing?'k':e.d&&e.d.atk||e.atk;if(ranged){if(a==='m'||a==='k')S.magic();else if(a==='c')S.fireball();else S.bow();}else{if(e.boss)S.roar();else if(a==='c')S.heavy();else if(Math.random()<0.5)S.slash();else S.clash();}}
function onEvents(L,lane){const g=G.g;const vis=lane===G.view;
  for(const ev of L.events){switch(ev.k){
    case 'place':{if(!vis)break;const [x,z]=cw(ev.u.x,ev.u.y);dust(x,z,9,0.32);sparks(x,0.5,z,0x7aff8a,10,2,0.13);ringFx(x,z,0x7aff8a,0.8);if(lane===0)S.pop();break;}
    case 'upgrade':{if(!vis)break;const [x,z]=cw(ev.u.c+0.5,ev.u.r+0.5);pillar(x,z,0xffd75e);sparks(x,0.8,z,0xffd75e,22,2.6,0.15);ringFx(x,z,0xffd75e,1.3,0.5);if(lane===0){S.merge();banner('升级！',ev.u.d.n,'combine',icon(ev.u.type));}const v=views.get(ev.u.id);if(v){dropView(v);}break;}
    case 'sell':{if(!vis)break;const [x,z]=cw(ev.u.c+0.5,ev.u.r+0.5);puffs(x,0.3,z,8,0xffffff,0.4);if(lane===0){S.coin();dmgText(x,1,z,'+'+ev.v,'gold');}break;}
    case 'atk':{if(!vis)break;const v=views.get(ev.e.id);if(v&&!ev.e.isKing){v.one='attack';v.sprK='';v.atkSpd=Math.max(1,0.8/Math.max(0.3,(ev.wind+0.25)));if(ev.t)v.yaw=Math.atan2(ev.t.x-ev.e.x,ev.t.y-ev.e.y);}
      if(ev.ranged){const a=ev.e.isKing?'k':ev.e.d&&ev.e.d.atk||ev.e.atk;shotFx(ev.e,ev.t,ev.wind,ev.travel,SHOT[a]||SHOT.p);}
      if(sndOk('atk'+(ev.ranged?1:0),0.07))atkSound(ev.e,ev.ranged);break;}
    case 'hit':{if(!vis)break;const v=views.get(ev.e.id);if(v){v.flash=1;const p=v.g.position;if(Math.random()<0.5)sparks(p.x,0.6,p.z,ev.e.side==='u'?0xffa060:0xffe0a0,4,1.6,0.1,0.3);}addDmg(ev.e,ev.v);
      if(ev.e.isKing){bump(lane===0?$('kMe').parentNode.parentNode:$('oppBtn'));if(sndOk('kh',0.3))S.lifeLost();shake(0.05);}else if(sndOk('hit',0.06))S.hit();break;}
    case 'splash':{if(!vis)break;const [x,z]=cw(ev.x,ev.y);ringFx(x,z,0xffb84a,ev.r,0.3);break;}
    case 'heal':{if(!vis)break;const v=views.get(ev.e.id);if(v){const p=v.g.position;sparks(p.x,0.8,p.z,0x7affa0,10,1.4,0.14);ringFx(p.x,p.z,0x7affa0,2.5,0.4);}break;}
    case 'die':{if(!vis)break;const v=views.get(ev.e.id);if(v){const p=v.g.position;puffs(p.x,0.3,p.z,6,0xffffff,0.4);if(ev.e.boss){shake(0.3);flash('rgba(255,215,94,.4)');sparks(p.x,1,p.z,0xffd75e,40,4,0.18);}}if(sndOk('die',0.1))S.death();break;}
    case 'gold':{if(lane!==0||!vis)break;const [x,z]=cw(ev.x,ev.y);dmgText(x,1.2,z,'+'+ev.v,'gold');if(sndOk('coin',0.12))S.coin();break;}
    case 'leak':{if(vis){const [x,z]=cw(ev.e.x,ev.e.y);dmgText(x,1.4,z,'漏怪！','leak');}if(lane===0&&sndOk('leak',0.5)){S.lifeLost();$('kMe').parentNode.parentNode.classList.remove('hit');void $('kMe').offsetWidth;$('kMe').parentNode.parentNode.classList.add('hit');}break;}
    case 'kingdie':{if(vis){const [x,z]=cw(LT.KING_POS.x,LT.KING_POS.y);sparks(x,1,z,0xff6a3a,60,5,0.2,0.9);puffs(x,0.5,z,16,0x888888,0.8,2);shake(0.5);flash('rgba(255,80,40,.5)');}S.boom();break;}
    case 'kingup':break;
    case 'wave':{if(lane!==0)break;closeInfoIfBattle();G.pick=null;showFree(false);renderRoster();const wd=ev.wd;S.horn();if(wd.boss){S.bossHorn();SFX.setTrack('boss');}else SFX.setTrack('battle');
      const mi=L.mercIn||0;banner(`第 ${ev.w} 波`,`${wd.n} ×${wd.cnt}${wd.esc?` + ${wd.esc.n} ×${wd.esc.cnt}`:''}${mi?` · 敌方佣兵 ×${mi}`:''}`,'wave',icon(wd.t));if(g.sendQ)renderMerc();break;}
    case 'cleared':{if(lane===0){toast(ev.leaks?`本波结束 · 漏怪 <b>${ev.leaks}</b>`:'✨ 完美防守！无漏怪','gold',1800);}else if(G.view===0&&ev.leaks)toast(`🤖 对手漏掉了 ${ev.leaks} 个敌人`,'',1500);break;}
    case 'income':{if(lane!==0)break;S.coinIn&&S.coinIn();banner(`第 ${g.wave+1} 波 准备`,`收入 +${ev.v} · 过关奖励 +${ev.bonus}`,'build');SFX.setTrack('menu');
      if(g.wave===2)setTimeout(()=>toast('🐺 试试「派兵」：派佣兵进攻对手，还能提高收入！'),1500);break;}
  }}
  L.events.length=0;}
function closeInfoIfBattle(){if(G.sel!=null){const u=G.g.lanes[0].units.find(x=>x.id===G.sel);if(u)openInfo(u);else closeInfo();}}
// ---------- view sync (which entities of the watched lane have sprites) ----------
function syncViews(){const L=laneV();const want=new Set();
  for(const u of L.units){want.add(u.id);if(!views.has(u.id))makeView(u);}
  for(const c of L.creeps){if(views.has(c.id))want.add(c.id);else if(c.alive){makeView(c);want.add(c.id);}}
  if(!L.king.id)L.king.id='K'+L.owner;want.add(L.king.id);if(!views.has(L.king.id)&&L.king.alive)makeView(L.king);else if(views.has(L.king.id))want.add(L.king.id);
  for(const v of [...views.values()])if(!want.has(v.e.id))dropView(v);
  // keep upgraded/sold units' views fresh
  for(const v of views.values())if(v.kind==='u'&&v.type!==v.e.type){dropView(v);makeView(v.e);}}
// ---------- main loop ----------
let last=now(),gcT=0;const DT=1/30;
function frame(){requestAnimationFrame(frame);const t=now();let dt=Math.min(0.05,t-last);last=t;const g=G.g;
  if(g){if(!G.paused&&!g.over){G.acc+=dt*G.speed;let n=0;while(G.acc>=DT&&n<8){LT.step(g,DT);G.acc-=DT;n++;onEvents(g.lanes[0],0);onEvents(g.lanes[1],1);}}
    else{onEvents(g.lanes[0],0);onEvents(g.lanes[1],1);}
    syncViews();hud();
    if(g.over&&!G.overShown){G.overShown=true;setTimeout(showOver,1400);}}
  const vdt=G.paused?0:dt*(G.speed>1?1.4:1);updateViews(vdt);stepPool(ADD,vdt);stepPool(SMK,vdt);stepPool(ORB,vdt);stepShots(vdt);stepRings(vdt);stepPillars(vdt);flushDmg(dt);
  portalSwirl.rotation.z-=dt*1.6;selRing.material.opacity=0.65+0.35*Math.sin(t*6);
  if(shakeA>0){shakeA=Math.max(0,shakeA-dt*1.4);camera.position.set(camBase.x+(Math.random()-0.5)*shakeA,camBase.y+(Math.random()-0.5)*shakeA,camBase.z);}else camera.position.copy(camBase);
  gcT+=dt;if(gcT>5){gcT=0;sprGC();}
  renderer.render(scene,camera);}
function showOver(){const g=G.g;const win=g.over==='win';const L0=g.lanes[0],L1=g.lanes[1];
  $('oTitle').textContent=win?'胜利！':'失败';$('oTitle').className='go-title '+(win?'win':'lose');
  const why=win?(L1.king.alive?`守住了全部 ${LT.MAXW} 波！`:'对手的国王被击倒了！'):'你的国王阵亡了……';
  $('oSub').innerHTML=`${why}<br>到达第 <b>${g.wave}</b> 波 · 击杀 <b>${g.kills[0]}</b> · 漏怪 <b>${g.leaked[0]}</b><br>派兵花费 <b>${g.sent[0]}</b> · 最终收入 <b>+${g.income[0]}</b> · 兵团 <b>${L0.units.length}</b> 个`;
  $('ltOver').classList.add('show');SFX.setTrack(null);win?S.win():S.lose();}
fitCamera();requestAnimationFrame(frame);
// preload the starting roster atlases so the first placement pops instantly
for(const t of ['pikeman','archer','titan'])KEEP.add(baseType(t));for(const t of KEEP)loadSpr(t);
if(/[?&]autostart/.test(location.search))newGame();
