// 军团战争 · Legion TD Mega 3.41 复刻 — renderer + UI. Logic: lt_core.js (window.LT). Models: models.js (sprite reuse + procedural toon meshes).
import * as THREE from 'three';
import {SPR_UNITS,SPR_K,SPR_V} from './sprdata.js';
import {MODELS,modelOf} from './models.js';
import {ABZ as ABZ_} from './abil_zh.js';
const LT=window.LT,S=SFX.S,$=id=>document.getElementById(id);
const Q=location.search;const DEBUG=/[?&]debug/.test(Q);const SHOWCASE=(Q.match(/[?&]showcase=([^&]+)/)||[])[1];
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
// ---------- sprites: lazy per-race atlas loading (only the types currently needed are fetched) ----------
const sprLoader=new THREE.TextureLoader();const SPR={},SPR_USE={};const KEEP=new Set();
function loadSpr(t){if(!t||!SPR_UNITS.includes(t))return Promise.resolve(null);SPR_USE[t]=now();
  return SPR[t]||(SPR[t]=fetch(`assets/spr/${t}.json?v=${SPR_V}`).then(r=>r.json()).then(m=>Promise.all(m.pages.map((_,i)=>new Promise((res,rej)=>sprLoader.load(`assets/spr/${t}_p${i}.webp?v=${SPR_V}`,res,undefined,rej)))).then(tx=>{for(const x of tx){x.colorSpace=THREE.SRGBColorSpace;x.anisotropy=4;}m.tex=tx;return m;})).catch(e=>{console.warn('spr',t,e);return null;}));}
function sprGC(){const used=new Set();for(const v of views.values())if(v.spec.s)used.add(v.spec.s);const t0=now();
  for(const t in SPR){if(used.has(t)||KEEP.has(t)){SPR_USE[t]=t0;continue;}if(t0-(SPR_USE[t]||0)<25)continue;const p=SPR[t];delete SPR[t];p.then(m=>{if(m)for(const x of m.tex)x.dispose();});}}
const shadowMat=new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false});const shadowGeo=new THREE.PlaneGeometry(1,1);shadowGeo.rotateX(-Math.PI/2);
const _cr=new THREE.Vector3(),_cf=new THREE.Vector3(),_sp=new THREE.Vector3(),_cp=new THREE.Vector3();
function camFacing(yaw){_cr.setFromMatrixColumn(camera.matrixWorld,0);_cr.y=0;_cr.normalize();_cf.setFromMatrixColumn(camera.matrixWorld,2);_cf.y=0;_cf.normalize().negate();const fx=Math.sin(yaw),fz=Math.cos(yaw);return Math.atan2(fx*_cr.x+fz*_cr.z,fx*_cf.x+fz*_cf.z)*180/Math.PI;}
const UNIT_K=1.05,SPR_PUSH=1.6;
const views=new Map();const unitLayer=new THREE.Group();scene.add(unitLayer);
const hpBgM=new THREE.SpriteMaterial({color:0x10131f,depthTest:false,transparent:true,opacity:0.85});
const hpFgM={c:new THREE.SpriteMaterial({color:0xff4a3a,depthTest:false}),b:new THREE.SpriteMaterial({color:0xff2a8a,depthTest:false}),u:new THREE.SpriteMaterial({color:0x5fdc5a,depthTest:false}),k:new THREE.SpriteMaterial({color:0x4ab8ff,depthTest:false}),m:new THREE.SpriteMaterial({color:0xc070ff,depthTest:false}),s:new THREE.SpriteMaterial({color:0x8affe0,depthTest:false})};
const mpFgM=new THREE.SpriteMaterial({color:0x5a8aff,depthTest:false});
const ringG=new THREE.RingGeometry(0.3,0.4,24).rotateX(-Math.PI/2);
const ringM={c:new THREE.MeshBasicMaterial({color:0xff3b3b,transparent:true,opacity:0.85,depthWrite:false}),u:new THREE.MeshBasicMaterial({color:0x3b9bff,transparent:true,opacity:0.85,depthWrite:false}),m:new THREE.MeshBasicMaterial({color:0xb050ff,transparent:true,opacity:0.9,depthWrite:false}),b:new THREE.MeshBasicMaterial({color:0xff2a8a,transparent:true,opacity:0.9,depthWrite:false}),s:new THREE.MeshBasicMaterial({color:0x6affd0,transparent:true,opacity:0.85,depthWrite:false})};
const specOf=e=>e.isKing?MODELS.king:modelOf(e.type);
// ---------- procedural toon models (things the reused creature sprites cannot represent: machines, trees, elementals, crabs…) ----------
const CYL=(rt,rb,h,s=10)=>new THREE.CylinderGeometry(rt,rb,h,s),SPH=(r,a=12,b=9)=>new THREE.SphereGeometry(r,a,b),CONE=(r,h,s=8)=>new THREE.ConeGeometry(r,h,s);
function mk(geo,col,x=0,y=0,z=0,em){const m=new THREE.Mesh(geo,em?new THREE.MeshBasicMaterial({color:col}):tmat(col));m.position.set(x,y,z);m.castShadow=true;return m;}
const glowMat=c=>new THREE.SpriteMaterial({map:glowTex,color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
function glowSpr(c,s,x=0,y=0,z=0){const g=new THREE.Sprite(glowMat(c));g.scale.set(s,s,1);g.position.set(x,y,z);return g;}
const PROC={
  mine(c,c2){const g=new THREE.Group();g.add(mk(CYL(0.3,0.34,0.12,14),c,0,0.06));g.add(mk(CYL(0.12,0.16,0.08,10),0x3a3a3a,0,0.15));const l=mk(SPH(0.07),0xff3a2a,0,0.22,0,1);g.add(l);g.userData.blink=l;for(let i=0;i<6;i++){const a=i/6*6.28;g.add(mk(CONE(0.04,0.1,5),0x8a8a8a,Math.cos(a)*0.3,0.08,Math.sin(a)*0.3));}return g;},
  turret(c,c2){const g=new THREE.Group();g.add(mk(CYL(0.36,0.42,0.18,8),c2,0,0.09));g.add(mk(CYL(0.1,0.1,0.4,8),c2,0,0.35));const h=new THREE.Group();h.position.y=0.6;h.add(mk(new THREE.BoxGeometry(0.42,0.26,0.36),c));for(const s of[-1,1]){const b=mk(CYL(0.04,0.04,0.5,6),0x3a3a3a,s*0.1,0,0.3);b.rotation.x=Math.PI/2;h.add(b);}g.add(h);g.userData.head=h;return g;},
  robot(c,c2){const g=new THREE.Group();for(const s of[-1,1]){g.add(mk(new THREE.BoxGeometry(0.14,0.36,0.16),c2,s*0.16,0.18));g.add(mk(new THREE.BoxGeometry(0.12,0.34,0.12),c2,s*0.34,0.55));g.add(mk(SPH(0.09),c,s*0.36,0.36));}
    g.add(mk(new THREE.BoxGeometry(0.5,0.42,0.36),c,0,0.58));g.add(mk(new THREE.BoxGeometry(0.28,0.2,0.26),c,0,0.9));g.add(mk(SPH(0.05),0xffd02a,0.07,0.92,0.13,1));g.add(mk(SPH(0.05),0xffd02a,-0.07,0.92,0.13,1));g.add(mk(CYL(0.02,0.02,0.2,4),0x3a3a3a,0,1.08));return g;},
  gyro(c,c2){const g=new THREE.Group();g.add(mk(SPH(0.24),c,0,0.5));g.add(mk(CYL(0.05,0.05,0.4,6),c2,0,0.8));const r=new THREE.Group();r.position.y=1.0;for(let i=0;i<3;i++){const b=mk(new THREE.BoxGeometry(0.9,0.03,0.08),0x5a4a3a);b.rotation.y=i*2.09;r.add(b);}g.add(r);g.userData.rotor=r;
    const t=mk(CYL(0.04,0.08,0.5,6),c,0,0.5,-0.35);t.rotation.x=Math.PI/2;g.add(t);g.add(mk(SPH(0.09),0x9ad8ff,0,0.55,0.2));return g;},
  copter(c,c2){const g=PROC.gyro(c,c2);g.add(mk(new THREE.BoxGeometry(0.5,0.12,0.3),c2,0,0.25));for(const s of[-1,1]){const p=mk(CYL(0.05,0.05,0.3,6),0x3a3a3a,s*0.3,0.45,0.1);p.rotation.x=Math.PI/2;g.add(p);}return g;},
  roller(c,c2){const g=new THREE.Group();const r=mk(CYL(0.26,0.26,0.8,14),0x6a6a6a,0,0.26,0.35);r.rotation.z=Math.PI/2;g.add(r);g.add(mk(new THREE.BoxGeometry(0.7,0.4,0.6),c,0,0.4,-0.15));g.add(mk(CYL(0.08,0.1,0.5,8),0x3a3a3a,0.2,0.8,-0.3));g.add(mk(new THREE.BoxGeometry(0.36,0.3,0.3),c2,-0.1,0.75,-0.1));
    for(const s of[-1,1]){const w=mk(CYL(0.18,0.18,0.1,12),0x3a3a3a,s*0.38,0.18,-0.3);w.rotation.z=Math.PI/2;g.add(w);}g.userData.smoke=[0.2,1.1,-0.3];return g;},
  tank(c,c2){const g=new THREE.Group();for(const s of[-1,1]){g.add(mk(new THREE.BoxGeometry(0.2,0.24,0.92),0x4a4a4a,s*0.33,0.12));for(let i=0;i<4;i++){const w=mk(CYL(0.09,0.09,0.22,10),0x2a2a2a,s*0.33,0.1,-0.33+i*0.22);w.rotation.z=Math.PI/2;g.add(w);}}
    g.add(mk(new THREE.BoxGeometry(0.58,0.22,0.8),c,0,0.33));const fr=mk(new THREE.BoxGeometry(0.58,0.14,0.2),c,0,0.3,0.44);fr.rotation.x=0.5;g.add(fr);
    const t=new THREE.Group();t.position.y=0.5;t.add(mk(CYL(0.26,0.3,0.2,10),c));t.add(mk(CYL(0.1,0.1,0.06,8),c2,-0.08,0.13,-0.06));const b=mk(CYL(0.06,0.07,0.75,8),c2,0,0.03,0.45);b.rotation.x=Math.PI/2;t.add(b);t.add(mk(CYL(0.085,0.085,0.12,8),0x2a2a2a,0,0.03,0.82)).rotation.x=Math.PI/2;g.add(t);g.userData.head=t;
    g.add(mk(CYL(0.04,0.05,0.18,6),0x3a3a3a,0.18,0.5,-0.36));g.userData.smoke=[0.18,0.62,-0.36];return g;},
  wagon(c,c2){const g=new THREE.Group();g.add(mk(new THREE.BoxGeometry(0.6,0.28,0.8),c,0,0.36));for(const sx of[-1,1])for(const sz of[-1,1]){const w=mk(CYL(0.16,0.16,0.08,10),0x4a3a2a,sx*0.34,0.16,sz*0.28);w.rotation.z=Math.PI/2;g.add(w);}
    const arm=new THREE.Group();arm.position.set(0,0.55,-0.2);const a=mk(new THREE.BoxGeometry(0.08,0.08,0.7),0x6a5a4a,0,0,0.3);arm.add(a);arm.add(mk(SPH(0.14),c2,0,0.05,0.62));arm.rotation.x=-0.6;g.add(arm);g.userData.arm=arm;return g;},
  ballista(c,c2){const g=PROC.wagon(c,c2);const bw=mk(new THREE.BoxGeometry(0.9,0.06,0.06),c2,0,0.62,0.2);g.add(bw);return g;},
  airship(c,c2){const g=new THREE.Group();const b=mk(SPH(0.4,16,10),c2,0,1.05);b.scale.set(0.9,0.8,1.5);g.add(b);
    for(const z of [-0.3,0.3]){const band=mk(new THREE.TorusGeometry(0.37,0.035,6,20),c,0,1.05,z);band.scale.set(0.95,0.85,1);g.add(band);}
    g.add(mk(CONE(0.16,0.3,10),c,0,1.05,0.62)).rotation.x=Math.PI/2;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;const f=mk(new THREE.BoxGeometry(0.04,0.34,0.3),c,Math.sin(a)*0.22,1.05+Math.cos(a)*0.22,-0.62);f.rotation.z=-a;g.add(f);}
    for(const s of[-1,1])g.add(mk(CYL(0.012,0.012,0.36,4),0x3a3a3a,s*0.14,0.72,0)).rotation.z=s*0.3;
    const gd=mk(new THREE.BoxGeometry(0.34,0.2,0.62),c,0,0.5);g.add(gd);for(const z of [-0.18,0,0.18])for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.01,0.06,0.08),0xffe07a,s*0.175,0.53,z,1));
    for(const s of[-1,1]){const cn=mk(CYL(0.04,0.05,0.3,6),0x2a2a2a,s*0.2,0.42,0.18);cn.rotation.x=Math.PI/2;g.add(cn);}
    const p=new THREE.Group();p.position.set(0,0.5,-0.36);for(let i=0;i<2;i++){const q=mk(new THREE.BoxGeometry(0.5,0.06,0.03),0x3a3a3a);q.rotation.z=i*1.57;p.add(q);}g.add(p);g.userData.prop=p;return g;},
  spider(c,c2){const g=new THREE.Group();g.add(mk(SPH(0.26),c,0,0.32,-0.12));g.add(mk(SPH(0.16),c,0,0.3,0.2));g.add(mk(SPH(0.04),c2,0.06,0.36,0.34,1));g.add(mk(SPH(0.04),c2,-0.06,0.36,0.34,1));
    const legs=[];for(const s of[-1,1])for(let i=0;i<4;i++){const l=new THREE.Group();l.position.set(s*0.14,0.32,0.15-i*0.12);const a=mk(CYL(0.025,0.02,0.45,5),c,s*0.2,0.05,0);a.rotation.z=s*1.1;l.add(a);const b2=mk(CYL(0.02,0.015,0.4,5),c,s*0.4,-0.14,0);b2.rotation.z=-s*0.4;l.add(b2);g.add(l);legs.push(l);}
    g.add(mk(SPH(0.12),c2,0,0.36,-0.32));g.userData.legs=legs;return g;},
  crab(c){const g=new THREE.Group();const b=mk(SPH(0.3,14,8),c,0,0.25);b.scale.set(1.3,0.55,1);g.add(b);const legs=[];
    for(const s of[-1,1]){for(let i=0;i<3;i++){const l=mk(CYL(0.03,0.02,0.32,5),c,s*0.38,0.15,-0.1+i*0.12);l.rotation.z=s*0.9;g.add(l);legs.push(l);}
      const cl=new THREE.Group();cl.position.set(s*0.3,0.3,0.32);cl.add(mk(SPH(0.13),c,0,0,0.05));cl.add(mk(CONE(0.07,0.2,6),c,s*0.04,0.05,0.2)).rotation.x=1.5;g.add(cl);legs.push(cl);
      g.add(mk(SPH(0.05),0x111111,s*0.1,0.42,0.22));}g.userData.legs=legs;return g;},
  tree(c,c2){const g=new THREE.Group();g.add(mk(CYL(0.11,0.22,1.05,8),c,0,0.52));for(const s of[-1,1]){const a=mk(CYL(0.04,0.07,0.5,6),c,s*0.24,0.72);a.rotation.z=-s*1.0;g.add(a);g.add(mk(SPH(0.12,8,6),c2,s*0.45,0.9));g.add(mk(CYL(0.05,0.09,0.32,5),c,s*0.18,0.1,0.05)).rotation.z=s*0.7;}
    const cr=new THREE.Group();cr.position.y=1.25;for(const [x,y,z,r] of [[0,0.12,0,0.3],[0.22,0,0.05,0.2],[-0.22,0,0,0.2],[0,-0.04,0.18,0.18],[0,0.04,-0.2,0.2]])cr.add(mk(new THREE.IcosahedronGeometry(r,0),c2,x,y,z));g.add(cr);
    g.add(mk(new THREE.BoxGeometry(0.16,0.04,0.02),0x2a1a0a,0,0.62,0.17));g.add(mk(SPH(0.045),0xffe08a,0.06,0.78,0.15,1));g.add(mk(SPH(0.045),0xffe08a,-0.06,0.78,0.15,1));g.userData.crown=cr;return g;},
  ancient(c,c2){const g=PROC.tree(c,c2);g.scale.set(1.15,1,1.15);for(let i=0;i<4;i++){const a=i*1.57+0.6;g.add(mk(CONE(0.07,0.4,5),c,Math.cos(a)*0.22,0.15,Math.sin(a)*0.22)).rotation.set(Math.sin(a)*0.7,0,-Math.cos(a)*0.7);}return g;},
  wisp(c){const g=new THREE.Group();g.add(mk(SPH(0.16),0xffffff,0,0.7,0,1));g.add(glowSpr(c,1.1,0,0.7));g.add(glowSpr(0xffffff,0.45,0,0.7));g.userData.glow=true;g.userData.trail=c;return g;},
  water(c){const g=new THREE.Group();const m=new THREE.MeshToonMaterial({color:c,gradientMap:ramp,transparent:true,opacity:0.85,emissive:c,emissiveIntensity:0.25});
    const add=(geo,x,y,z,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;g.add(o);return o;};
    add(CONE(0.34,0.6,10),0,0.3,0).rotation.x=Math.PI;add(SPH(0.3),0,0.7,0,1,1.1,1);add(SPH(0.16),0,1.05,0.04);for(const s of[-1,1])add(SPH(0.11),s*0.34,0.75,0.1,1,1.4,1);
    g.add(mk(SPH(0.035),0xffffff,0.06,1.08,0.17,1));g.add(mk(SPH(0.035),0xffffff,-0.06,1.08,0.17,1));g.userData.trail=0x9ad8ff;return g;},
  statue(c,c2){const g=new THREE.Group();g.add(mk(new THREE.BoxGeometry(0.5,0.16,0.5),0x5a5a6a,0,0.08));const b=mk(new THREE.OctahedronGeometry(0.32,0),c,0,0.65);b.scale.set(0.8,1.5,0.8);g.add(b);for(const s of[-1,1]){const w=mk(new THREE.BoxGeometry(0.4,0.06,0.18),c,s*0.36,0.85);w.rotation.z=s*0.5;g.add(w);}g.add(glowSpr(c2,0.5,0,0.8,0.15));return g;},
  egg(c,c2){const g=new THREE.Group();for(const [x,z,s] of [[0,0,1],[0.25,0.12,0.7],[-0.22,0.1,0.75],[0.05,-0.24,0.65]]){const e=mk(SPH(0.2),c,x,0.22*s,z);e.scale.set(s,s*1.3,s);g.add(e);}g.add(mk(SPH(0.18,10,6),c2,0,0.05,0)).scale.set(2,0.3,2);return g;},
  morph(c){const g=new THREE.Group();const m=mk(new THREE.IcosahedronGeometry(0.32,0),c,0,0.7);g.add(m);g.add(glowSpr(c,1.0,0,0.7));const q=document.createElement('canvas');q.width=q.height=64;const x=q.getContext('2d');x.font='900 52px sans-serif';x.fillStyle='#fff';x.textAlign='center';x.fillText('?',32,52);
    const t=new THREE.CanvasTexture(q);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));sp.scale.set(0.5,0.5,1);sp.position.y=1.2;sp.renderOrder=9;g.add(sp);g.userData.spin=m;return g;},
};
function buildProc(spec){const f=PROC[spec.p]||PROC.morph;const g=f(spec.c||0x888888,spec.c2||0x444444);return g;}
// ---------- decorations: each unit's defining trait (crowns for leaders, auras for aura-casters, orbs for casters, flames, ghosts…) ----------
const torusG=new THREE.TorusGeometry(0.2,0.025,6,24).rotateX(Math.PI/2);
function addDeco(v){const d=v.spec.d||[];v.deco={};for(const s of d){const [k,cs]=s.split(':');const col=cs?parseInt(cs):0xffd75e;
    if(k==='aura'){const m=new THREE.Mesh(new THREE.RingGeometry(0.42,0.6,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:col,map:glowTex,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.y=0.035;m.renderOrder=2;v.g.add(m);v.deco.aura=m;}
    else if(k==='halo'){const m=new THREE.Mesh(torusG,new THREE.MeshBasicMaterial({color:col===0xffd75e?0xfff0a0:col,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false}));unitLayer.add(m);v.deco.halo=m;}
    else if(k==='crown'){const g=new THREE.Group();g.add(mk(CYL(0.13,0.12,0.08,10),0xffc83a));for(let i=0;i<5;i++){const a=i/5*6.28;g.add(mk(CONE(0.035,0.1,4),0xffd75e,Math.cos(a)*0.11,0.08,Math.sin(a)*0.11));}g.add(mk(SPH(0.03),0xff3a5a,0,0.03,0.12,1));unitLayer.add(g);v.deco.crown=g;}
    else if(k==='orb'){const g=new THREE.Group();for(let i=0;i<2;i++){const o=glowSpr(col,0.32);o.userData.ph=i*Math.PI;g.add(o);g.add(mk(SPH(0.05),0xffffff,0,0,0,1));}unitLayer.add(g);v.deco.orb=g;}
    else if(k==='fire'){v.deco.fire=col;}
    else if(k==='ghost'){v.deco.ghost=true;v.hover=Math.max(v.hover,0.18);}
    else if(k==='eyes'){const g=new THREE.Group();g.add(glowSpr(col,0.16,-0.06,0,0));g.add(glowSpr(col,0.16,0.06,0,0));unitLayer.add(g);v.deco.eyes=g;}
    else if(k==='spikes'){const g=new THREE.Group();for(const s of[-1,1])for(let i=0;i<2;i++){const c=mk(CONE(0.04,0.16,5),0xd8d8e8,s*(0.2+i*0.06),0.02*i,0);c.rotation.z=-s*0.6;g.add(c);}unitLayer.add(g);v.deco.spikes=g;}
    else if(k==='shield'){const g=new THREE.Group();const m=mk(CYL(0.15,0.15,0.04,12),0xd8c070);m.rotation.x=Math.PI/2;g.add(m);g.add(mk(SPH(0.04),0xffffff,0,0,0.03,1));unitLayer.add(g);v.deco.shield=g;}
    else if(k==='banner'){const g=new THREE.Group();g.add(mk(CYL(0.015,0.015,0.9,5),0x6a4a2a,0,0.45));const f=new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.2),new THREE.MeshToonMaterial({color:v.kind==='u'?0x3b7fe6:0xd8342a,gradientMap:ramp,side:THREE.DoubleSide}));f.position.set(0.15,0.78,0);g.add(f);v.g.add(g);g.position.set(-0.22,0,-0.12);v.deco.banner=f;}}}
// head-anchored decorations follow the billboard sprite (pushed toward the camera like the sprite itself)
const _r=new THREE.Vector3();
function decoUpdate(v,dt,t,anchor,top,ks){const D=v.deco;if(!D)return;_r.setFromMatrixColumn(camera.matrixWorld,0);
  const at=(o,y,side=0)=>{o.position.copy(anchor);o.position.y+=y;o.position.addScaledVector(_r,side*ks);};
  if(D.halo){at(D.halo,top+0.08*ks);D.halo.scale.setScalar(ks*1.1);}
  if(D.crown){at(D.crown,top-0.02);D.crown.scale.setScalar(ks);D.crown.rotation.y=t*1.2;}
  if(D.eyes){at(D.eyes,top-0.2*ks);D.eyes.quaternion.copy(camera.quaternion);D.eyes.scale.setScalar(ks);}
  if(D.spikes){at(D.spikes,top*0.72);D.spikes.quaternion.copy(camera.quaternion);D.spikes.scale.setScalar(ks);}
  if(D.shield){at(D.shield,top*0.45,0.24);D.shield.quaternion.copy(camera.quaternion);D.shield.scale.setScalar(ks);}
  if(D.orb){at(D.orb,top*0.6);D.orb.children.forEach((o,i)=>{const a=t*2.4+(i>>1)*Math.PI;o.position.set(Math.cos(a)*0.42*ks,Math.sin(t*3+i)*0.06,Math.sin(a)*0.42*ks);});}
  if(D.aura){const p=1+0.08*Math.sin(t*3);D.aura.scale.set(p*(v.spec.k||1),1,p*(v.spec.k||1));D.aura.rotation.y=t*0.5;}
  if(D.banner)D.banner.rotation.y=Math.sin(t*3+v.e.id)*0.35;
  if(D.fire&&!v.e.inactive&&v.e.alive){v.fireT=(v.fireT||0)-dt;if(v.fireT<=0){v.fireT=0.12;const a=Math.random()*6.28;spawn(ADD,{x:anchor.x+Math.cos(a)*0.18*ks,y:anchor.y+top*(0.3+Math.random()*0.6),z:anchor.z+Math.sin(a)*0.18*ks,vy:0.8,life:0.5,s0:0.22*ks,s1:0.05,col:D.fire,a:0.85});}}}
function dropDeco(v){if(!v.deco)return;for(const k of ['halo','crown','eyes','spikes','shield','orb'])if(v.deco[k])unitLayer.remove(v.deco[k]);}
function kindOf(e){return e.isKing?'k':e.side==='u'?'u':e.side==='s'?'s':e.boss?'b':e.merc?'m':'c';}
function makeView(e){const g=new THREE.Group();const [x,z]=cw(e.x,e.y);g.position.set(x,0,z);unitLayer.add(g);const kind=kindOf(e);const spec=specOf(e);
  const sh=new THREE.Mesh(shadowGeo,shadowMat);sh.position.y=0.02;sh.renderOrder=2;const sw=(e.boss?1.1:e.isKing?1.2:0.55)*Math.max(0.8,Math.min(1.4,spec.k||1));sh.scale.set(sw*1.15,1,sw*0.75);g.add(sh);
  if(kind!=='k'){const rg=new THREE.Mesh(ringG,ringM[kind]||ringM.c);rg.position.y=0.03;rg.renderOrder=2;rg.scale.setScalar(e.boss?1.6:0.95);g.add(rg);}
  const bg=new THREE.Sprite(hpBgM);bg.center.set(0,0.5);bg.renderOrder=8;const fg=new THREE.Sprite(hpFgM.c);fg.center.set(0,0.5);fg.renderOrder=9;const mp=new THREE.Sprite(mpFgM);mp.center.set(0,0.5);mp.renderOrder=9;scene.add(bg,fg,mp);
  const v={e,kind,type:e.isKing?'king':e.type,spec,g,sh,bg,fg,mp,spr:null,yaw:kind==='u'||kind==='k'||kind==='s'?Math.PI:0,hover:(e.fly||spec.fly)?0.5:0,
    k:UNIT_K*(spec.s?(SPR_K[spec.s]||1):1)*(spec.k||1)*(e.boss?1.45:1),deadT:0,sprK:'',sprT:0,sprDir:-1,sprMir:false,sprPg:0,flash:0,topY:0.7,born:now(),hidden:false};
  v.tint=new THREE.Color(spec.t!=null?spec.t:0xffffff);
  if(spec.p){const m=buildProc(spec);m.scale.setScalar((spec.k||1)*(e.boss?1.45:1));m.position.y=v.hover;g.add(m);v.proc=m;v.topY=v.hover+1.0*(spec.k||1);m.traverse(o=>{if(o.isMesh&&o.material.isMeshToonMaterial){o.material=o.material.clone();}});}
  else loadSpr(spec.s).then(m=>{if(!m||v.gone)return;const tx=m.tex.map(t=>{const c=t.clone();c.needsUpdate=true;return c;});const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx[0],transparent:true,alphaTest:0.02,depthWrite:false}));sp.renderOrder=3;unitLayer.add(sp);v.spr=sp;v.m=m;v.tx=tx;});
  addDeco(v);views.set(e.id,v);return v;}
function dropView(v){v.gone=true;unitLayer.remove(v.g);scene.remove(v.bg,v.fg,v.mp);dropDeco(v);if(v.spr){unitLayer.remove(v.spr);v.spr.material.dispose();for(const t of v.tx)t.dispose();}views.delete(v.e.id);}
function dropAllViews(){for(const v of [...views.values()])dropView(v);}
function sprUpdate(v,dt){const m=v.m,e=v.e;const dead=!e.alive&&!e.inactive;let k=dead?'death':(v.one||(e.moving?'walk':'idle'));if(k==='walk'&&m.anims.walk.n<2)k='idle';
  if(k!==v.sprK){v.sprK=k;v.sprT=0;}v.sprT+=dt;const A=m.anims[k];let f=Math.floor(v.sprT*A.fps*(k==='attack'?v.atkSpd||1:1));if(A.loop)f%=A.n;else if(f>=A.n){f=A.n-1;if(k!=='death')v.one=null;}
  const a=camFacing(v.yaw),aa=Math.abs(a),step=180/(m.dirs.length-1);let di=v.sprDir;if(di<0||Math.abs(aa-di*step)>step*0.5+6)di=Math.max(0,Math.min(m.dirs.length-1,Math.round(aa/step)));
  let mir=v.sprMir;if(v.sprDir<0||(a<-4&&!mir)||(a>4&&mir))mir=a<0;v.sprDir=di;v.sprMir=mir;
  const F=m.frames[di][A.row][f],pg=F[0],t=v.tx[pg],PW=m.pages[pg][0],PH=m.pages[pg][1];
  if(pg!==v.sprPg||v.spr.material.map!==t){v.sprPg=pg;v.spr.material.map=t;v.spr.material.needsUpdate=true;}
  t.repeat.set((mir?-1:1)*F[3]/PW,F[4]/PH);t.offset.set((mir?F[1]+F[3]:F[1])/PW,1-(F[2]+F[4])/PH);v.spr.center.set(mir?1-F[5]/F[3]:F[5]/F[3],1-F[6]/F[4]);
  const age=now()-v.born,grow=Math.min(1,age/0.35);const bob=v.deco&&v.deco.ghost?Math.sin(now()*2.5+e.id)*0.06:0;
  _sp.copy(v.g.position);_sp.y+=v.hover+bob;_cp.copy(camera.position).sub(_sp);const dist=_cp.length(),push=Math.min(SPR_PUSH,dist*0.3);
  v.spr.position.copy(_sp).addScaledVector(_cp,push/dist);const ks=(dist-push)/dist*v.k*1.25*grow;v.spr.scale.set(F[3]/m.ppu*ks*(1+v.flash*0.12),F[4]/m.ppu*ks*(1-v.flash*0.08),1);
  const headH=Math.min(2.6,F[6]/m.ppu*v.k*1.25);if(!dead)v.topY=v.hover+headH;
  v.flash=Math.max(0,v.flash-dt*5);const mc=v.spr.material.color;mc.copy(v.tint);mc.multiplyScalar(1+v.flash*2.2);
  const ga=v.deco&&v.deco.ghost?0.68:1;v.spr.material.opacity=(e.inactive?0.5:!dead?1:Math.max(0,1-Math.max(0,v.deadT-0.5)/0.4))*ga;
  decoUpdate(v,dt,now(),v.spr.position,F[6]/m.ppu*ks,ks*0.8);}
// procedural model animation: idle bob, walking legs, rotors, attack lunge, death sink
function procUpdate(v,dt){const m=v.proc,e=v.e,t=now();const dead=!e.alive&&!e.inactive;const u=m.userData;const k0=(v.spec.k||1)*(e.boss?1.45:1);
  if(u.rotor)u.rotor.rotation.y+=dt*18;if(u.prop)u.prop.rotation.z+=dt*14;if(u.spin){u.spin.rotation.y+=dt*1.5;u.spin.rotation.x+=dt*0.7;}
  if(u.blink)u.blink.visible=Math.sin(t*6)>0;
  if(u.legs)u.legs.forEach((l,i)=>{l.rotation.x=e.moving?Math.sin(t*14+i*1.3)*0.35:0;});
  if(u.crown)u.crown.rotation.z=Math.sin(t*1.3+e.id)*0.04;
  if(u.head&&v.e.face!=null&&v.one)u.head.rotation.y=v.e.face-v.yaw;
  const fl=(v.hover?Math.sin(t*2.2+e.id)*0.08:0);let lunge=0;if(v.one==='attack'){v.atkT2=(v.atkT2||0)+dt;lunge=Math.sin(Math.min(1,v.atkT2/0.3)*Math.PI);if(v.atkT2>0.3){v.one=null;v.atkT2=0;}if(u.arm)u.arm.rotation.x=-0.6+lunge*1.3;}
  m.rotation.y=v.yaw;const fx=Math.sin(v.yaw)*lunge*0.15,fz=Math.cos(v.yaw)*lunge*0.15;
  if(dead){v.deathT=(v.deathT||0)+dt;m.position.y=v.hover-v.deathT*0.6;m.rotation.z=Math.min(1.2,v.deathT*2);}else{v.deathT=0;m.rotation.z=0;m.position.set(fx,v.hover+fl,fz);}
  const fk=1+v.flash*0.1;m.scale.setScalar(k0*fk*Math.min(1,(now()-v.born)/0.3));v.flash=Math.max(0,v.flash-dt*5);
  if(u.glow||u.trail){if(Math.random()<dt*10&&!dead)spawn(ADD,{x:v.g.position.x,y:0.7*k0+v.hover,z:v.g.position.z,vy:0.3,life:0.5,s0:0.25*k0,s1:0.05,col:u.trail||v.spec.c,a:0.7});}
  if(u.smoke&&e.moving&&Math.random()<dt*6)puffs(v.g.position.x,0.9*k0,v.g.position.z,1,0x777777,0.25,0.3,0.7);
  m.visible=!(dead&&v.deathT>1.2);
  _sp.copy(v.g.position);decoUpdate(v,dt,t,_sp,v.topY,k0*0.9);}
function updateViews(dt){for(const v of [...views.values()]){const e=v.e;const dead=!e.alive&&!e.inactive;
    if(dead){v.deadT+=dt;if(v.kind==='c'||v.kind==='m'||v.kind==='b'||v.kind==='s'){if(v.deadT>1.1){dropView(v);continue;}}
      else if(v.deadT>1.2&&!v.hidden){v.hidden=true;v.g.visible=false;if(v.spr)v.spr.visible=false;}}
    else{if(v.hidden||v.deadT>0){v.hidden=false;v.deadT=0;v.g.visible=true;if(v.spr)v.spr.visible=true;v.sprK='';v.one=null;v.born=now();if(v.kind==='u')v.yaw=Math.PI;}
      const [x,z]=cw(e.x,e.y);const dx=x-v.g.position.x,dz=z-v.g.position.z;if(e.moving&&dx*dx+dz*dz>1e-5)v.yaw=Math.atan2(dx,dz);else if(e.face!=null&&v.one)v.yaw=e.face;v.g.position.set(x,0,z);}
    if(v.proc)procUpdate(v,dt);else if(v.spr&&v.m)sprUpdate(v,dt);
    const hd=v.hidden||(dead&&v.deadT>0.6);for(const k of ['halo','crown','eyes','spikes','shield','orb'])if(v.deco&&v.deco[k])v.deco[k].visible=!hd;
    const show=!!(!dead&&!e.inactive&&(e.hp<e.maxHp||e.boss||e.isKing||SHOWCASE));v.bg.visible=v.fg.visible=show&&!SHOWCASE;
    const mm=e.d&&e.d.manaMax;v.mp.visible=show&&!SHOWCASE&&!!mm&&v.kind==='u';
    if(show){const bw=e.boss||e.isKing?1.4:0.8,y=v.topY+0.16;v.bg.position.set(v.g.position.x-bw/2-0.03,y,v.g.position.z);v.bg.scale.set(bw+0.06,e.isKing?0.2:(mm?0.2:0.15),1);
      const p=Math.max(0,e.hp/e.maxHp);v.fg.material=hpFgM[v.kind]||hpFgM.c;v.fg.position.set(v.g.position.x-bw/2,y+(mm?0.025:0),v.g.position.z+0.001);v.fg.scale.set(bw*p,e.isKing?0.14:0.1,1);
      if(mm){v.mp.position.set(v.g.position.x-bw/2,y-0.05,v.g.position.z+0.001);v.mp.scale.set(bw*Math.min(1,(e.mana||0)/mm),0.05,1);}}}}
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
// ---------- portraits (generated on demand from the same models; cached) ----------
const POR=new Map();let porR=null,porScene=null,porCam=null;
function porProc(spec){if(!porR){porR=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});porR.setSize(96,96);porR.outputColorSpace=THREE.SRGBColorSpace;porScene=new THREE.Scene();porScene.add(new THREE.HemisphereLight(0xffffff,0x667788,1.6));const d=new THREE.DirectionalLight(0xffffff,2);d.position.set(-2,4,4);porScene.add(d);porCam=new THREE.PerspectiveCamera(30,1,0.1,20);}
  const m=buildProc(spec);porScene.add(m);const bb=new THREE.Box3().setFromObject(m);const c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());const r=Math.max(sz.x,sz.y,sz.z)*0.62+0.05;
  porCam.position.set(c.x+r*0.6,c.y+r*0.9,c.z+r*2.6);porCam.lookAt(c);porR.setClearColor(0,0);porR.render(porScene,porCam);porScene.remove(m);
  const cv2=document.createElement('canvas');cv2.width=cv2.height=96;cv2.getContext('2d').drawImage(porR.domElement,0,0);return cv2;}
function porDeco(x,spec){const d=spec.d||[];for(const s of d){const [k,cs]=s.split(':');const col=cs?'#'+parseInt(cs).toString(16).padStart(6,'0'):'#ffd75e';
  if(k==='crown'){x.font='18px serif';x.textAlign='center';x.fillText('👑',48,18);}
  else if(k==='aura'||k==='halo'||k==='orb'||k==='fire'){x.globalCompositeOperation='destination-over';const g=x.createRadialGradient(48,k==='aura'?84:48,2,48,k==='aura'?84:48,k==='aura'?36:46);g.addColorStop(0,col+'aa');g.addColorStop(1,col+'00');x.fillStyle=g;x.fillRect(0,0,96,96);x.globalCompositeOperation='source-over';}}}
function porSpr(spec){return loadSpr(spec.s).then(m=>{if(!m)return null;const F=m.frames[0][0][0];const img=m.tex[F[0]].image;const cv2=document.createElement('canvas');cv2.width=cv2.height=96;const x=cv2.getContext('2d');
  const sc=Math.min(88/F[3],88/F[4]);const w=F[3]*sc,h=F[4]*sc;x.drawImage(img,F[1],F[2],F[3],F[4],(96-w)/2,96-h-2,w,h);
  if(spec.t!=null&&spec.t!==0xffffff){x.globalCompositeOperation='multiply';x.fillStyle='#'+spec.t.toString(16).padStart(6,'0');x.fillRect(0,0,96,96);x.globalCompositeOperation='destination-in';x.drawImage(img,F[1],F[2],F[3],F[4],(96-w)/2,96-h-2,w,h);x.globalCompositeOperation='source-over';}
  porDeco(x,spec);return cv2;});}
function portrait(id){if(POR.has(id))return POR.get(id);const spec=id==='king'?MODELS.king:modelOf(id);const p=spec.p?Promise.resolve(porProc(spec)):porSpr(spec);POR.set(id,p);return p;}
const porTag=(id,cls='pi')=>`<canvas class="${cls}" data-por="${id}" width="96" height="96"></canvas>`;
function fillPor(root){for(const c of root.querySelectorAll('canvas[data-por]')){if(c.dataset.done)continue;c.dataset.done=1;portrait(c.dataset.por).then(src=>{if(src)c.getContext('2d').drawImage(src,0,0);});}}
// ---------- game state / flow ----------
const G={g:null,view:0,speed:1,paused:false,tab:'build',pick:null,sel:null,acc:0,overShown:false,lastHud:'',race:null,mode:'X3'};
window.__lt={G,LT,views,scene,freeTiles,hoverTile,MODELS,portrait,cellScreen:(c,r)=>{const [x,z]=cw(c+0.5,r+0.5);return toScreen(x,0,z);}};
const D=()=>LT.D;const U=id=>LT.D.units[id];
function laneV(){return G.g.lanes[G.view];}
const RACE_EMO={Arctic:'❄️',Beast:'🐻',Element:'🌀',Elf:'🧝',Ghost:'👻',Goblin:'💣',Hybrid:'❓','Demi-Human':'🪓',Marine:'🦈',Mech:'⚙️',Nature:'🌳',Paladin:'🛡️',Prophet:'🔮',Shadow:'💀',Undead:'⚰️',Orc:'🪖',Random:'🎲'};
function raceZh(r){return r==='Random'?'随机':LT.D.races[r].zh;}
function preloadRace(race){if(!race||race==='Random')return;const ids=[];const walk=id=>{const u=U(id);if(!u)return;ids.push(id);(u.upgrades||[]).forEach(walk);};(LT.D.races[race].lines||[]).forEach(walk);
  for(const id of ids){const s=modelOf(id);if(s.s){KEEP.add(s.s);loadSpr(s.s);}}}
function newGame(){SFX.init();S.go();const seed=DEBUG&&/[?&]seed=(\d+)/.test(Q)?+RegExp.$1:undefined;
  const g=LT.newGame({seed,race:G.race||'Random',aiRace:(Q.match(/[?&]ai=([^&]+)/)||[])[1]||'Random',mode:G.mode});
  if(DEBUG&&/[?&]gold=(\d+)/.test(Q)){g.P[0].gold=+RegExp.$1;g.P[0].lumber=+RegExp.$1;g.P[0].foodCap=200;}if(/[?&]fast/.test(Q))g.timer=8;
  G.g=g;G.view=0;G.pick=null;G.sel=null;G.overShown=false;G.paused=false;G.acc=0;dropAllViews();shots.length=0;KEEP.clear();preloadRace(g.P[0].race);KEEP.add('giant');
  for(const id of ['ltTitle','ltOver','ltPause'])$(id).classList.remove('show');for(const id of ['ltHud','ltPanel'])$(id).classList.remove('hidden');$('viewTag').classList.add('hidden');
  $('hMode').textContent=g.mode;$('oppName').textContent='🤖 '+raceZh(g.P[1].race);
  SFX.setTrack('menu');setTab('build');renderRoster();renderMerc();renderKing();renderEco();closeInfo();fitCamera();hud(true);
  banner(`${raceZh(g.P[0].race)} · 第 1 波 准备`,`对手：${raceZh(g.P[1].race)} · 模式 ${g.mode}`,'build');setTimeout(()=>toast('👆 选择下方兵种，再点击发光的格子建造'),900);}
// ---------- UI: roster ----------
const ATK_I={normal:'⚔',pierce:'🏹',magic:'✨',siege:'💣',chaos:'☄',hero:'👑',spells:'✨',unknown:'💥'};
const atkZh=a=>LT.ATK[a]||'特殊',armZh=a=>LT.ARM[a]||a;
function lines(){return LT.raceLines(G.g,0)||[];}
function renderRoster(){const g=G.g;if(!g)return;const P=g.P[0];const ls=lines();
  $('rosterGrid').innerHTML=ls.map((t,i)=>{const d=U(t);return `<div class="ucard ${G.pick===t?'sel':''} ${P.gold<d.gold?'poor':''}" data-t="${t}">${porTag(t)}<span class="tp">${ATK_I[d.attackType]||'⚔'}${d.ranged?'远':'近'}</span><span class="tier">${i+1}阶</span><span class="cn">${d.zh}</span><span class="cc">💰${d.gold} 🍖${d.food||1}</span></div>`;}).join('');
  fillPor($('rosterGrid'));
  if(P.race==='Prophet'&&!G.pick){const n=P.rerolls+1;setHint(n<=5?`先知：兵种随机抽取 · 「经济」页可花 ${50*n}金/${50*n}木 重抽（${P.rerolls}/5）`:'先知：重抽次数已用完');}}
function renderMerc(){const g=G.g;if(!g)return;const P=g.P[0];const q={};for(const t of g.sendQ[0])q[t]=(q[t]||0)+1;
  $('mercGrid').innerHTML=LT.D.summons.map(s=>{const st=P.stock[s.id];return `<div class="ucard ${P.lumber<s.lumber||st.n<1?'poor':''}" data-m="${s.id}">${porTag(s.id)}<span class="inc">+${s.income}</span><span class="stk">库存${st.n}/${s.stockMax||1}</span>${q[s.id]?`<span class="qn" style="right:auto;left:3px;top:2px">×${q[s.id]}</span>`:''}<span class="cn">${s.zh}</span><span class="cc l">🌲${s.lumber}</span></div>`;}).join('');
  fillPor($('mercGrid'));const n=g.sendQ[0].length;$('mHint').textContent=n?`已派出 ${n} 个，将在第 ${g.wave+(g.phase==='build'?1:2)} 波进攻对手 · 收入 +${P.income}`:'派出的兵会在下一波进攻对手，并永久增加你的收入（消耗木材，有库存冷却）';}
function renderEco(){const g=G.g;if(!g)return;const P=g.P[0];const E=LT.ECO;const lj=LT.ljCost(P.lj+1);const rate=P.wisps*(E.wispLumber+P.lj);
  const n=P.rerolls+1;const pro=P.race==='Prophet'?`<div class="erow"><div class="ei">🔮</div><div class="et"><b>先知重抽</b> ${P.rerolls}/5<br>重新随机6个阶级的兵种</div><button class="dbtn upg" id="eRe" ${n>5||P.gold<50*n||P.lumber<50*n?'disabled':''}>重抽<small>💰${50*n} 🌲${50*n}</small></button></div>`:'';
  $('ecoBox').innerHTML=`<div class="erow"><div class="ei">🧚</div><div class="et"><b>小精灵 ${P.wisps}/${E.wispMax}</b><br>采集木材：每${E.wispInt}秒 +${rate}（每个 ${E.wispLumber+P.lj}）</div><button class="dbtn upg" id="eWisp" ${P.wisps>=E.wispMax||P.gold<E.wispGold||P.food>=P.foodCap?'disabled':''}>训练<small>💰${E.wispGold} 🍖1</small></button></div>
  <div class="erow"><div class="ei">🪓</div><div class="et"><b>伐木技术 ${P.lj}/15</b><br>每级每个小精灵每次 +1 木材</div><button class="dbtn upg" id="eLj" ${P.lj>=15||P.gold<lj.g||P.lumber<lj.l?'disabled':''}>${P.lj>=15?'已满级':`升级<small>💰${lj.g} 🌲${lj.l}</small>`}</button></div>
  <div class="erow"><div class="ei">🏠</div><div class="et"><b>农场 ${P.farm}/${E.farmMax} · 人口 ${P.food}/${P.foodCap}</b><br>每级 +${E.farmFood} 人口上限</div><button class="dbtn upg" id="eFarm" ${P.farm>=E.farmMax||P.gold<E.farmGold||P.lumber<E.farmLumber?'disabled':''}>${P.farm>=E.farmMax?'已满级':`升级<small>💰${E.farmGold} 🌲${E.farmLumber}</small>`}</button></div>${pro}`;
  const act=(id,f,msg)=>{const b=$(id);if(b)b.onclick=()=>{const r=f(G.g,0);if(r.ok){S.forge();toast(msg);if(id==='eRe'){renderRoster();preloadRace0();}}else{S.tick();toast(r.reason,'bad');}renderEco();hud(true);};};
  act('eWisp',LT.buyWisp,'🧚 小精灵 +1');act('eLj',LT.buyLumberjack,'🪓 伐木技术提升');act('eFarm',LT.buyFarm,'🏠 农场升级，人口上限 +8');act('eRe',LT.rollProphet,'🔮 兵种已重新抽取');}
function preloadRace0(){for(const id of lines()){const walk=i=>{const s=modelOf(i);if(s.s)loadSpr(s.s);(U(i).upgrades||[]).forEach(walk);};walk(id);}}
function renderKing(){const g=G.g;if(!g)return;const k=g.lanes[0].king,P=g.P[0];const K=LT.D.king;const ab=K.abilities||[];const kup=LT.KUP_MAX;
  const btn=(kind,lbl,eff)=>`<button class="dbtn upg" data-k="${kind}" ${k.lv[kind]>=kup[kind]||P.lumber<80?'disabled':''}>${lbl} ${k.lv[kind]}/${kup[kind]}<small>${k.lv[kind]>=kup[kind]?'已满级':`🌲80 · ${eff} · 收入+3`}</small></button>`;
  $('kingBox').innerHTML=`<div style="display:flex;gap:8px"><div class="por">${porTag('king','')}</div><div class="ib"><div class="nm">国王<small>英雄甲 · 射程${K.range}</small></div>
  <div class="st"><span>生命</span><b>${Math.ceil(k.hp)}/${k.maxHp}</b><span>攻击</span><b>${k.dmin}-${k.dmax} 👑</b><span>回复</span><b>${k.regen}/秒</b><span>护甲</span><b>${k.armor} · 攻速${k.cd.toFixed(2)}s</b></div>
  <div class="kab">${ab.map(a=>`<span class="${g.wave>=a.wave?'':'off'}"><b>${a.zh}</b>(第${a.wave}波)</span>`).join(' · ')}</div></div></div>
  <div class="kup">${btn('hp','❤ 生命',`+${425+25*(k.lv.hp+1)}`)}${btn('attack','⚔ 攻击','+10')}${btn('regen','✚ 回复','+5/秒')}</div>`;fillPor($('kingBox'));
  for(const b of $('kingBox').querySelectorAll('button[data-k]'))b.onclick=()=>{const r=LT.kingUpgrade(G.g,0,b.dataset.k);if(r.ok){S.forge();const [x,z]=cw(LT.KING_POS.x,LT.KING_POS.y);if(G.view===0){pillar(x,z,0x6ac8ff);sparks(x,1,z,0x6ac8ff,24,3,0.15);}toast('👑 国王已强化 · 收入 +3');}else{S.tick();toast(r.reason,'bad');}renderKing();hud(true);};}
function abilHtml(fx){if(!fx||!fx.length)return '<div>无特殊技能</div>';return fx.map(f=>`<div><b>${ABZ_[f.name]||f.name||''}</b> ${LT.fxText(f)}${f.est?' <span class="est">(数值为推算)</span>':''}</div>`).join('');}
function statRows(d){const avg=(d.dmin+d.dmax)/2;const dps=avg/d.cd;return `<span>生命</span><b>${d.hp}</b><span>攻击</span><b>${d.dmin}-${d.dmax} ${ATK_I[d.attackType]||''}${atkZh(d.attackType)}</b><span>护甲</span><b>${d.armor} ${armZh(d.armorType)}</b><span>攻速</span><b>${d.cd}s · DPS ${dps.toFixed(0)}</b><span>射程</span><b>${d.ranged?d.range:'近战'}</b><span>移速</span><b>${d.move}${d.fly?' 飞行':''}</b>${d.manaMax?`<span>法力</span><b>${d.manaMax}${d.manaRegen?` (+${d.manaRegen}/s)`:''}</b>`:''}${d.splash?`<span>溅射</span><b>有</b>`:''}${d.bounce?`<span>弹射</span><b>${d.bounce.targets||2}目标</b>`:''}`;}
function openInfo(u,preview){const g=G.g;const d=preview?U(u):u.d;const id=preview?u:u.type;if(!preview){G.sel=u.id;G.pick=null;showFree(false);renderRoster();}
  const battle=!preview&&g.phase==='battle'&&!u.inactive;const sv=preview?0:LT.sellValue(g,u);const ups=(d.upgrades||[]).map(U);const P=g.P[0];
  const tierN=d.tier||'';const morph=!preview&&u.morph?`<small>（由${U(u.morph).zh}变形）</small>`:'';
  $('infoBox').innerHTML=`<div class="por">${porTag(id,'')}</div><div class="ib"><div class="nm">${d.zh}<small>${d.en} · ${tierN?tierN+'阶':''}${preview?' · 💰'+d.gold:' · 价值 '+u.value}</small>${morph}</div><div class="st">${statRows(d)}</div><div class="abil">${abilHtml(d.fx)}</div>
  <div class="row">${preview?'':ups.map(n=>`<button class="dbtn upg" data-up="${n.id}" ${battle||P.gold<LT.upCost(d,n)?'disabled':''}>⬆ ${n.zh}<small>💰${LT.upCost(d,n)} · ${n.hp}血 ${n.dmg[0]}-${n.dmg[1]}</small></button>`).join('')}
  ${preview?'':`<button class="dbtn sell" id="iSell" ${battle?'disabled':''}>💰 出售 +${sv}</button>`}<button class="dbtn x" id="iX">✖</button></div>${battle?'<div class="ds" style="color:#ff9a8a">战斗中无法升级或出售</div>':''}</div>`;
  fillPor($('infoBox'));$('infoBox').classList.remove('hidden2');for(const t of ['tBuild','tMerc','tKing','tEco'])$(t).classList.add('hidden2');
  if(!preview){const [x,z]=cw(u.c+0.5,u.r+0.5);selRing.position.set(x,0.04,z);selRing.visible=true;range.position.set(x,0.04,z);const rr=Math.max(1.2,d.rng);range.scale.set(rr,1,rr);range.visible=true;}
  for(const b of $('infoBox').querySelectorAll('button[data-up]'))b.onclick=()=>{const r=LT.upgrade(G.g,0,u.id,b.dataset.up);if(r.ok)openInfo(u);else{S.tick();toast(r.reason,'bad');}};
  if($('iSell'))$('iSell').onclick=()=>{const r=LT.sell(G.g,0,u.id);if(r.ok){closeInfo();}else{S.tick();toast(r.reason,'bad');}};
  $('iX').onclick=()=>{S.tap();closeInfo();};}
function closeInfo(){G.sel=null;selRing.visible=false;range.visible=false;$('infoBox').classList.add('hidden2');setTab(G.tab);}
function setTab(t){G.tab=t;for(const b of document.querySelectorAll('#ltPanel .tab'))b.classList.toggle('on',b.dataset.tab===t);
  $('tBuild').classList.toggle('hidden2',t!=='build');$('tMerc').classList.toggle('hidden2',t!=='merc');$('tKing').classList.toggle('hidden2',t!=='king');$('tEco').classList.toggle('hidden2',t!=='eco');
  if(G.sel==null)$('infoBox').classList.add('hidden2');if(t!=='build'){G.pick=null;showFree(false);}if(t==='king')renderKing();if(t==='merc')renderMerc();if(t==='eco')renderEco();if(t==='build')renderRoster();}
for(const b of document.querySelectorAll('#ltPanel .tab'))b.onclick=()=>{S.tap();if(G.sel!=null){G.sel=null;selRing.visible=false;range.visible=false;}setTab(b.dataset.tab);if(G.view!==0)setView(0);};
let pressT=null;
$('rosterGrid').addEventListener('click',ev=>{const c=ev.target.closest('.ucard');if(!c||!G.g)return;const t=c.dataset.t;if(G.view!==0)setView(0);const d=U(t);
  if(G.pick===t){G.pick=null;showFree(false);openInfo(t,true);}else{G.pick=t;showFree(true);const ab=(d.fx||[]).map(f=>ABZ_[f.name]||f.name).filter(Boolean).join('、');setHint(`${d.zh}${ab?'（'+ab+'）':''} · 点格子建造 · 再点卡片看详情`);if(G.g.P[0].gold<d.gold)setHint(`金币不足（需要 ${d.gold}）`,true);}S.tap();renderRoster();});
$('mercGrid').addEventListener('click',ev=>{const c=ev.target.closest('.ucard');if(!c||!G.g)return;const t=c.dataset.m;const r=LT.sendSummon(G.g,0,t);const s=LT.D.summonById[t];
  if(r.ok){S.whoosh();toast(`🐺 已派出 <b>${s.zh}</b>，下一波进攻对手 · 收入 <b>+${s.income}</b>`,'gold',1600);bump($('pInc'));}else{S.tick();toast(`${s.zh}：${r.reason}`,'bad');}renderMerc();hud(true);});
function setHint(s,bad){const h=$('bHint');h.textContent=s;h.classList.toggle('bad',!!bad);}
$('goBtn').onclick=()=>{const g=G.g;if(!g||g.phase!=='build')return;S.go();LT.startWave(g);};
$('speedBtn').onclick=()=>{G.speed=G.speed===1?2:G.speed===2?4:1;$('speedBtn').textContent=G.speed+'×';$('speedBtn').classList.toggle('on',G.speed>1);S.tap();};
$('pauseBtn').onclick=()=>{G.paused=true;$('ltPause').classList.add('show');S.tap();};
$('resumeBtn').onclick=()=>{G.paused=false;$('ltPause').classList.remove('show');S.tap();};
$('restartBtn').onclick=()=>{G.paused=false;$('ltPause').classList.remove('show');showTitle();};
const muteLbl=()=>{$('muteBtn').textContent=SFX.muted?'🔇 声音：关':'🔊 声音：开';};muteLbl();
$('muteBtn').onclick=()=>{SFX.setMuted(!SFX.muted);muteLbl();};
$('startBtn').onclick=()=>newGame();$('againBtn').onclick=()=>showTitle();
$('oppBtn').onclick=()=>{S.tap();setView(G.view?0:1);};
function setView(v){if(!G.g)return;G.view=v;dropAllViews();shots.length=0;pendDmg.clear();$('viewTag').classList.toggle('hidden',v===0);$('eyeT').textContent=v?'↩ 返回':'👁 观战';
  if(v){G.pick=null;showFree(false);if(G.sel!=null){G.sel=null;selRing.visible=false;range.visible=false;$('infoBox').classList.add('hidden2');setTab(G.tab);}renderRoster();}}
// ---------- title: race + mode pick ----------
function showTitle(){$('ltOver').classList.remove('show');$('ltTitle').classList.add('show');for(const id of ['ltHud','ltPanel'])$(id).classList.add('hidden');renderRaces();}
function renderRaces(){const rs=[...LT.RACES,'Random'];$('raceGrid').innerHTML=rs.map(r=>`<div class="rpick ${G.race===r?'sel':''}" data-r="${r}"><span class="re">${RACE_EMO[r]||'⚔'}</span>${raceZh(r)}<small>${r}</small></div>`).join('');
  const r=G.race;let info='';if(!r)info='点选一个种族（每个种族有 6 条兵线，各有不同的升级分支）';else if(r==='Random')info='<b>随机</b>：从 14 个常规种族中随机分配一个';
  else if(r==='Prophet')info='<b>先知</b>：每个阶级随机抽取其他种族的兵种，可花费金币木材重抽（最多5次）';else if(r==='Hybrid')info='<b>混血</b>：建造「变形体」，放下后随机变为同阶任意种族的基础兵';
  else{const R=LT.D.races[r];info=`<b>${R.zh}</b>：`+R.lines.map((id,i)=>{const u=U(id);const up=(u.upgrades||[]).map(x=>U(x).zh).join('/');return `${i+1}.${u.zh}${up?'→'+up:''}`;}).join(' · ');}
  $('raceInfo').innerHTML=info;const sb=$('startBtn');sb.disabled=!r;sb.textContent=r?`开始游戏 · ${raceZh(r)} · ${G.mode}`:'请选择种族';}
$('raceGrid').addEventListener('click',ev=>{const c=ev.target.closest('.rpick');if(!c)return;G.race=c.dataset.r;S.tap&&S.tap();renderRaces();preloadRace(G.race);});
for(const b of document.querySelectorAll('.mbtn'))b.onclick=()=>{G.mode=b.dataset.mode;for(const x of document.querySelectorAll('.mbtn'))x.classList.toggle('on',x===b);renderRaces();};
// ---------- input: tap the lane ----------
const ray=new THREE.Raycaster(),_ndc=new THREE.Vector2(),groundP=new THREE.Plane(new THREE.Vector3(0,1,0),0),_hit=new THREE.Vector3();
function pickCell(cx,cy){_ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);ray.setFromCamera(_ndc,camera);if(!ray.ray.intersectPlane(groundP,_hit))return null;return {x:_hit.x+W2,y:_hit.z+H2};}
let downP=null;
cv.addEventListener('pointerdown',e=>{downP={x:e.clientX,y:e.clientY,t:now()};});
cv.addEventListener('pointerup',e=>{if(!downP)return;const d=Math.hypot(e.clientX-downP.x,e.clientY-downP.y);downP=null;if(d>14)return;tapAt(e.clientX,e.clientY);});
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!G.g||!G.pick||G.view!==0){hoverTile.visible=false;return;}const p=pickCell(e.clientX,e.clientY);if(!p){hoverTile.visible=false;return;}const c=Math.floor(p.x),r=Math.floor(p.y);
  if(LT.cellFree(G.g.lanes[0],c,r)){const [x,z]=cw(c+0.5,r+0.5);hoverTile.position.set(x,0.035,z);hoverTile.visible=true;}else hoverTile.visible=false;});
function tapAt(sx,sy){const g=G.g;if(!g||g.over||G.paused||SHOWCASE)return;const p=pickCell(sx,sy);if(!p)return;if(G.view!==0)return;
  const L=g.lanes[0];const c=Math.floor(p.x),r=Math.floor(p.y);
  let u=L.units.find(u=>u.c===c&&u.r===r);if(!u){let bd=0.6;for(const x of L.units){if(!x.alive)continue;const d=Math.hypot(x.x-p.x,x.y-p.y);if(d<bd){bd=d;u=x;}}}
  if(u){S.tap();openInfo(u);return;}
  if(G.pick){const d=U(G.pick);const r2=LT.place(g,0,G.pick,c,r);if(r2.ok){setHint(`${d.zh} 已建造${r2.u.morph?`（变形为 ${U(r2.u.type).zh}）`:''} · 继续点击格子可再建造`);if(g.P[0].gold<d.gold){G.pick=null;showFree(false);setHint('金币不足，等待下一波收入',true);}else showFree(true);renderRoster();}
    else{S.tick();setHint(r2.reason,true);if(r2.reason!=='这里不能建造')toast(r2.reason,'bad');}return;}
  if(G.sel!=null){closeInfo();return;}
  if(c>=B.c0&&c<=B.c1&&r>=B.r0&&r<=B.r1){setHint('先在下方选择一个兵种',true);if(G.tab!=='build')setTab('build');}}
// ---------- HUD ----------
function hud(force){const g=G.g;if(!g||SHOWCASE)return;const L0=g.lanes[0],L1=g.lanes[1];const bt=g.phase==='build';const P=g.P[0];
  const key=[g.wave,Math.ceil(g.timer),Math.floor(P.gold),Math.floor(P.lumber),P.income,P.food,P.foodCap,g.phase,Math.ceil(L0.king.hp),Math.ceil(L1.king.hp),L0.king.maxHp,g.sendQ[0].length,L0.creeps.filter(c=>c.alive).length,L1.creeps.filter(c=>c.alive).length,P.wisps,P.lj].join('|');
  if(!force&&key===G.lastHud)return;const resCh=G.lastRes!==Math.floor(P.gold)+'|'+Math.floor(P.lumber);G.lastHud=key;G.lastRes=Math.floor(P.gold)+'|'+Math.floor(P.lumber);
  $('hWave').textContent=bt?g.wave+1:g.wave;$('hTimer').textContent=bt?Math.max(0,Math.ceil(g.timer)):'战';$('pTimer').classList.toggle('urgent',bt&&g.timer<8);$('pTimer').classList.toggle('battle',!bt);
  $('hGold').textContent=Math.floor(P.gold);$('hLum').textContent=Math.floor(P.lumber);$('hInc').textContent='+'+P.income;$('hFood').textContent=P.food+'/'+P.foodCap;
  $('kMe').style.width=(100*L0.king.hp/L0.king.maxHp)+'%';$('kMeT').textContent=Math.ceil(L0.king.hp);$('kOpp').style.width=(100*L1.king.hp/L1.king.maxHp)+'%';$('kOppT').textContent=Math.ceil(L1.king.hp);
  const gb=$('goBtn');if(bt){gb.textContent=`▶ 开战 ${Math.max(0,Math.ceil(g.timer))}s`;gb.classList.remove('fight');gb.disabled=false;}else{const Lx=G.view?L1:L0;gb.textContent=`⚔ 剩余 ${Lx.creeps.filter(c=>c.alive).length+Lx.spawnQ.length}`;gb.classList.add('fight');gb.disabled=true;}
  const wn=Math.min(LT.MAXW,bt?g.wave+1:g.wave);const wd=LT.waveDef(Math.max(1,wn));const M=LT.D.modes[g.mode]||{countMul:1};const cnt=Math.max(1,Math.round(wd.count*M.countMul));const inc=bt?g.sendQ[1].length:(L0.mercIn||0);
  $('nextInfo').innerHTML=`<span class="nl">${bt?'下一波':'本波'} ${wn}</span>${porTag(wd.id,'wi')}<span>${wd.zh} ×${cnt}</span><span class="tag ${wd.boss?'boss':''}">${armZh(wd.armorType)}</span><span class="tag">${ATK_I[wd.attackType]||''}${atkZh(wd.attackType)}</span>${wd.fly?'<span class="tag">飞行</span>':''}${wd.boss?'<span class="tag boss">首领</span>':''}${inc?`<span class="tag merc">🐺 敌方派兵 ×${inc}</span>`:''}`;fillPor($('nextInfo'));
  if(resCh||force){renderRoster();if(G.tab==='merc')renderMerc();if(G.tab==='king')renderKing();if(G.tab==='eco')renderEco();if(G.sel!=null){const u=L0.units.find(x=>x.id===G.sel);if(u)for(const b of $('infoBox').querySelectorAll('button[data-up]'))b.disabled=(g.phase==='battle'&&!u.inactive)||P.gold<LT.upCost(u.d,U(b.dataset.up));}}}
// ---------- events from the sim → fx / sfx / ui ----------
let sndT={};const sndOk=(k,gap)=>{const t=now();if(t-(sndT[k]||0)<gap)return false;sndT[k]=t;return true;};
const SHOT2={normal:SHOT.n,pierce:SHOT.p,magic:SHOT.m,siege:SHOT.s,chaos:SHOT.c,hero:SHOT.k,spells:SHOT.m,unknown:SHOT.n};
const NOVA_C={frost:0x9ae8ff,fire:0xff7a2a,earth:0xd8b070,water:0x4ab8ff,heal:0x7affa0,haunt:0xb06aff,blade:0xffffff,nature:0x8aff6a};
function atkSound(e,ranged){const a=e.isKing?'hero':e.d&&e.d.attackType;if(ranged){if(a==='magic'||a==='hero')S.magic();else if(a==='chaos')S.fireball();else S.bow();}else{if(e.boss)S.roar();else if(a==='siege'||a==='chaos')S.heavy();else if(Math.random()<0.5)S.slash();else S.clash();}}
function posOf(e){const v=views.get(e.id);if(v)return v.g.position;const [x,z]=cw(e.x,e.y);return {x,z};}
function onEvents(L,lane){const g=G.g;const vis=lane===G.view;
  for(const ev of L.events){switch(ev.k){
    case 'place':{if(!vis)break;const [x,z]=cw(ev.u.x,ev.u.y);dust(x,z,9,0.32);sparks(x,0.5,z,0x7aff8a,10,2,0.13);ringFx(x,z,0x7aff8a,0.8);if(lane===0){S.pop();if(ev.u.morph)toast(`❓ 变形体 → <b>${U(ev.u.type).zh}</b>`,'gold',1400);}break;}
    case 'upgrade':{if(!vis)break;const [x,z]=cw(ev.u.c+0.5,ev.u.r+0.5);pillar(x,z,0xffd75e);sparks(x,0.8,z,0xffd75e,22,2.6,0.15);ringFx(x,z,0xffd75e,1.3,0.5);if(lane===0){S.merge();banner('升级！',ev.u.d.zh,'combine');}const v=views.get(ev.u.id);if(v)dropView(v);break;}
    case 'sell':{if(!vis)break;const [x,z]=cw(ev.u.c+0.5,ev.u.r+0.5);puffs(x,0.3,z,8,0xffffff,0.4);if(lane===0){S.coin();dmgText(x,1,z,'+'+ev.v,'gold');}break;}
    case 'atk':{if(!vis)break;const v=views.get(ev.e.id);if(v&&!ev.e.isKing){v.one='attack';v.sprK='';v.atkT2=0;v.atkSpd=Math.max(1,0.8/Math.max(0.3,(ev.wind+0.25)));if(ev.t)v.yaw=Math.atan2(ev.t.x-ev.e.x,ev.t.y-ev.e.y);}
      if(ev.ranged){const a=ev.e.isKing?'hero':ev.e.d&&ev.e.d.attackType;shotFx(ev.e,ev.t,ev.wind,ev.travel,SHOT2[a]||SHOT.p);}
      if(sndOk('atk'+(ev.ranged?1:0),0.07))atkSound(ev.e,ev.ranged);break;}
    case 'hit':{if(!vis)break;const v=views.get(ev.e.id);if(v){v.flash=1;const p=v.g.position;if(Math.random()<0.4)sparks(p.x,0.6,p.z,ev.e.side==='u'?0xffa060:0xffe0a0,4,1.6,0.1,0.3);}addDmg(ev.e,ev.v);
      if(ev.e.isKing){bump(lane===0?$('kMe').parentNode.parentNode:$('oppBtn'));if(sndOk('kh',0.3))S.lifeLost();shake(0.05);}else if(sndOk('hit',0.06))S.hit();break;}
    case 'miss':{if(!vis)break;const p=posOf(ev.e);if(Math.random()<0.5)dmgText(p.x,1.0,p.z,'闪避','miss');break;}
    case 'stun':{if(!vis)break;const p=posOf(ev.e);sparks(p.x,1.0,p.z,0xffe86a,6,1,0.1,0.5);break;}
    case 'bolt':{if(!vis)break;const p=posOf(ev.e);pillar(p.x,p.z,0x9ad8ff);sparks(p.x,1,p.z,0x9ad8ff,14,2.4,0.14);if(sndOk('bolt',0.2))S.magic();break;}
    case 'buff':{if(!vis)break;const p=posOf(ev.e);sparks(p.x,0.8,p.z,ev.c==='rage'?0xff5a3a:ev.c==='haste'?0xffe06a:0x6ad0ff,10,1.6,0.13);ringFx(p.x,p.z,ev.c==='rage'?0xff5a3a:0x6ad0ff,0.9,0.35);break;}
    case 'debuff':{if(!vis)break;const p=posOf(ev.e);sparks(p.x,0.6,p.z,ev.c==='net'||ev.c==='root'?0xc8a060:ev.c==='haunt'?0xb06aff:0x9ae8ff,8,1.2,0.12);break;}
    case 'summon':{if(!vis)break;const p=posOf(ev.m);const [x,z]=cw(ev.e.x,ev.e.y);puffs(x,0.3,z,8,0xb08aff,0.4);ringFx(x,z,0xb08aff,0.9,0.4);if(lane===0&&sndOk('sum',0.4))S.pop();break;}
    case 'nova':{if(!vis)break;const [x,z]=cw(ev.x,ev.y);const c=NOVA_C[ev.c]||0xffffff;ringFx(x,z,c,Math.max(0.6,ev.r),0.45);sparks(x,0.5,z,c,16,2.4,0.14);if(ev.c==='fire'&&sndOk('boom',0.15)){S.boom&&S.boom();shake(0.06);}break;}
    case 'wavefx':{if(!vis)break;const [x,z]=cw(ev.x,ev.y);for(let i=0;i<14;i++){const d=i/14*ev.len;spawn(SMK,{x:x+ev.ux*d,y:0.2,z:z+ev.uy*d,vy:0.5,life:0.6,s0:0.3,s1:0.6,col:0xd8b070,a:0.8});}shake(0.08);break;}
    case 'bounce':{if(!vis)break;const a=posOf(ev.a),b=posOf(ev.b);for(let i=0;i<6;i++){const k=i/5;spawn(ADD,{x:a.x+(b.x-a.x)*k,y:0.7+Math.sin(k*3.14)*0.3,z:a.z+(b.z-a.z)*k,life:0.2,s0:0.25,s1:0.1,col:ev.c==='nature'?0x8aff6a:0x9ad8ff,a:0.9});}break;}
    case 'splash':{if(!vis)break;const [x,z]=cw(ev.x,ev.y);ringFx(x,z,0xffb84a,ev.r,0.3);break;}
    case 'heal':{if(!vis)break;const v=views.get(ev.e.id);if(v){const p=v.g.position;sparks(p.x,0.8,p.z,0x7affa0,10,1.4,0.14);ringFx(p.x,p.z,0x7affa0,1.2,0.4);}break;}
    case 'die':{if(!vis)break;const v=views.get(ev.e.id);if(v){const p=v.g.position;puffs(p.x,0.3,p.z,6,0xffffff,0.4);if(ev.e.boss){shake(0.3);flash('rgba(255,215,94,.4)');sparks(p.x,1,p.z,0xffd75e,40,4,0.18);}}if(sndOk('die',0.1))S.death();break;}
    case 'gold':{if(lane!==0||!vis)break;const [x,z]=cw(ev.x,ev.y);dmgText(x,1.2,z,'+'+ev.v,'gold');if(sndOk('coin',0.12))S.coin();break;}
    case 'leak':{if(vis){const [x,z]=cw(ev.e.x,ev.e.y);dmgText(x,1.4,z,'漏怪！','leak');}if(lane===0&&sndOk('leak',0.5)){S.lifeLost();$('kMe').parentNode.parentNode.classList.remove('hit');void $('kMe').offsetWidth;$('kMe').parentNode.parentNode.classList.add('hit');}break;}
    case 'kingdie':{if(vis){const [x,z]=cw(LT.KING_POS.x,LT.KING_POS.y);sparks(x,1,z,0xff6a3a,60,5,0.2,0.9);puffs(x,0.5,z,16,0x888888,0.8,2);shake(0.5);flash('rgba(255,80,40,.5)');}S.boom();break;}
    case 'kingab':{if(lane===0)toast(`👑 国王习得 <b>${ev.a.zh}</b>：${kingAbText(ev.a)}`,'gold',2600);break;}
    case 'wave':{if(lane!==0)break;closeInfoIfBattle();G.pick=null;showFree(false);renderRoster();const wd=ev.wd;S.horn();if(wd.boss){S.bossHorn();SFX.setTrack('boss');}else SFX.setTrack('battle');
      const mi=L.mercIn||0;const M=LT.D.modes[g.mode]||{countMul:1};banner(`第 ${ev.w} 波`,`${wd.zh} ×${Math.max(1,Math.round(wd.count*M.countMul))}${mi?` · 敌方派兵 ×${mi}`:''}`,'wave');renderMerc();
      for(const sd of new Set([wd.id]))loadSpr(modelOf(sd).s);break;}
    case 'cleared':{if(lane===0){toast(ev.leaks?`本波结束 · 漏怪 <b>${ev.leaks}</b>`:'✨ 完美防守！无漏怪','gold',1800);}else if(G.view===0&&ev.leaks)toast(`🤖 对手漏掉了 ${ev.leaks} 个敌人`,'',1500);break;}
    case 'income':{if(lane!==0)break;S.coinIn&&S.coinIn();banner(`第 ${g.wave+1} 波 准备`,`收入 +${ev.v} · 过关奖励 +${ev.bonus}`,'build');SFX.setTrack('menu');
      const nx=LT.waveDef(Math.min(LT.MAXW,g.wave+1));loadSpr(modelOf(nx.id).s);
      if(g.wave===2)setTimeout(()=>toast('🐺 试试「派兵」：花木材派兵进攻对手，还能永久提高收入！'),1500);if(g.wave===1)setTimeout(()=>toast('🌲 「经济」页：训练小精灵采集木材'),2600);break;}
  }}
  L.events.length=0;}
function kingAbText(a){switch(a.k){case 'immolation':return `每秒对周围敌人造成${a.dps}点伤害`;case 'shockwave':return `直线${a.dmg}伤害`;case 'warstomp':return `周围${a.dmg}伤害并击晕${a.stun}秒`;
  case 'kaura':return a.st==='dmg'?`友军攻击力+${Math.round(a.v*100)}%`:a.st==='arm'?`友军护甲+${a.v}`:`友军攻速+${Math.round(a.v*100)}% 移速+${Math.round((a.ms||0)*100)}%`;}return '';}
function closeInfoIfBattle(){if(G.sel!=null){const u=G.g.lanes[0].units.find(x=>x.id===G.sel);if(u)openInfo(u);else closeInfo();}}
// ---------- view sync ----------
function syncViews(){const L=laneV();const want=new Set();
  for(const u of L.units){want.add(u.id);if(!views.has(u.id))makeView(u);}
  for(const s of L.summ){if(views.has(s.id))want.add(s.id);else if(s.alive){makeView(s);want.add(s.id);}}
  for(const c of L.creeps){if(views.has(c.id))want.add(c.id);else if(c.alive){makeView(c);want.add(c.id);}}
  want.add(L.king.id);if(!views.has(L.king.id)&&L.king.alive)makeView(L.king);
  for(const v of [...views.values()])if(!want.has(v.e.id))dropView(v);
  for(const v of views.values())if(v.kind==='u'&&v.type!==v.e.type){dropView(v);makeView(v.e);}}
// ---------- showcase (?showcase=<race>|waves|summons): every model of a race laid out with names ----------
function showcase(key){const items=[];let title='';
  if(key==='waves'){title='怪物波次 · 31波';LT.D.waves.slice(1).forEach(w=>items.push({id:w.id,zh:w.zh,sub:'第'+w.wave+'波'+(w.boss?' 👑首领':''),boss:w.boss,fly:w.fly}));}
  else if(key==='summons'){title='派兵 · 24种';LT.D.summons.forEach(s=>items.push({id:s.id,zh:s.zh,sub:'🌲'+s.lumber}));for(const id in LT.D.summoned)items.push({id,zh:LT.D.summoned[id].zh,sub:'技能召唤',fly:LT.D.summoned[id].fly});}
  else{const race=LT.RACES.find(r=>r.toLowerCase()===key.toLowerCase())||'Beast';const R=LT.D.races[race];title=`种族展示 · ${R.zh}（${race}）`;
    if(race==='Prophet'){const pool=LT.RACES.filter(r=>r!=='Prophet'&&r!=='Hybrid');for(let i=0;i<6;i++)for(let j=0;j<3;j++){const rr=pool[(i*3+j*5)%pool.length],id=LT.D.races[rr].lines[i],u=U(id);items.push({id,zh:u.zh,sub:`${i+1}阶候选 · ${LT.D.races[rr].zh}`,row:i,col:j,fly:u.fly});}title='种族展示 · 先知（每阶随机候选示例）';}
    const ls=race==='Prophet'?[]:R.lines;ls.forEach((id,i)=>{const walk=(x,dep)=>{const u=U(x);items.push({id:x,zh:u.zh,sub:`${i+1}阶${dep?' · 升级'+dep:''}`,row:i,col:dep,fly:u.fly});(u.upgrades||[]).forEach((y,j)=>walk(y,dep+1+j*0));};walk(id,0);});
    // branching upgrades share depth 1: spread them into columns 1 and 2
    const byRow={};for(const it of items)(byRow[it.row]=byRow[it.row]||[]).push(it);for(const r in byRow)byRow[r].forEach((it,j)=>{it.col=j;});}
  $('showTitle').textContent=title;$('showTitle').classList.remove('hidden');for(const id of ['ltTitle'])$(id).classList.remove('show');
  const cols=key==='waves'||key==='summons'?5:Math.max(1,...items.map(it=>(it.col||0)+1));const lab=$('labels');lab.innerHTML='';const ents=[];
  items.forEach((it,i)=>{const r=it.row!=null?it.row:Math.floor(i/cols),c=it.row!=null?it.col:i%cols;const rowsN=it.row!=null?6:Math.ceil(items.length/cols);
    const x=(c+0.5)*(W/cols),y=0.9+(r+0.75)*((H-1.6)/rowsN);const d=U(it.id)||LT.D.waves.find(w=>w&&w.id===it.id)||LT.D.summonById[it.id]||LT.D.summoned[it.id];
    const e={id:9000+i,side:it.row!=null?'u':'c',type:it.id,d,x,y,c:Math.floor(x),r:Math.floor(y),hp:1,maxHp:1,alive:true,moving:false,fly:!!it.fly,boss:false};ents.push(e);
    const v=makeView(e);v.yaw=v.proc?0.75:0;const el=document.createElement('div');el.className='lb';el.innerHTML=`${it.zh}<small>${it.sub}</small>`;lab.appendChild(el);v.label=el;});
  G.show=ents;return ents.length;}
function placeLabels(){for(const v of views.values()){if(!v.label)continue;const p=v.g.position;const [sx,sy]=toScreen(p.x,0,p.z+0.32);v.label.style.left=sx+'px';v.label.style.top=sy+'px';}}
// ---------- main loop ----------
let last=now(),gcT=0;const DT=1/30;
function frame(){requestAnimationFrame(frame);const t=now();let dt=Math.min(0.05,t-last);last=t;const g=G.g;
  if(g&&!SHOWCASE){if(!G.paused&&!g.over){G.acc+=dt*G.speed;let n=0;while(G.acc>=DT&&n<16){LT.step(g,DT);G.acc-=DT;n++;onEvents(g.lanes[0],0);onEvents(g.lanes[1],1);}}
    else{onEvents(g.lanes[0],0);onEvents(g.lanes[1],1);}
    syncViews();hud();
    if(g.over&&!G.overShown){G.overShown=true;setTimeout(showOver,1400);}}
  const vdt=G.paused?0:dt*(G.speed>1?1.4:1);updateViews(vdt);stepPool(ADD,vdt);stepPool(SMK,vdt);stepPool(ORB,vdt);stepShots(vdt);stepRings(vdt);stepPillars(vdt);flushDmg(dt);if(SHOWCASE)placeLabels();
  portalSwirl.rotation.z-=dt*1.6;selRing.material.opacity=0.65+0.35*Math.sin(t*6);
  if(shakeA>0){shakeA=Math.max(0,shakeA-dt*1.4);camera.position.set(camBase.x+(Math.random()-0.5)*shakeA,camBase.y+(Math.random()-0.5)*shakeA,camBase.z);}else camera.position.copy(camBase);
  gcT+=dt;if(gcT>5){gcT=0;sprGC();}
  renderer.render(scene,camera);}
function showOver(){const g=G.g;const win=g.over==='win';const L0=g.lanes[0],L1=g.lanes[1];const P=g.P[0];
  $('oTitle').textContent=win?'胜利！':'失败';$('oTitle').className='go-title '+(win?'win':'lose');
  const why=win?(L1.king.alive?`坚持完 ${LT.MAXW} 波，国王血量领先！`:'对手的国王被击倒了！'):(L0.king.alive?'第31波结束时国王血量落后……':'你的国王阵亡了……');
  $('oSub').innerHTML=`${why}<br>${raceZh(P.race)} vs ${raceZh(g.P[1].race)} · 到达第 <b>${g.wave}</b> 波<br>击杀 <b>${P.kills}</b> · 漏怪 <b>${P.leaked}</b> · 兵团价值 <b>${P.value}</b><br>派兵 <b>${P.sent}</b>木 · 最终收入 <b>+${P.income}</b>`;
  $('ltOver').classList.add('show');SFX.setTrack(null);win?S.win():S.lose();}
// ---------- boot: load the Mega 3.41 roster, then show the race picker (or the showcase) ----------
fetch('data/roster_mega.json?v=2').then(r=>r.json()).then(J=>{LT.load(J);window.__lt.ready=true;
  if(SHOWCASE){$('ltTitle').classList.remove('show');fitCamera();const n=showcase(decodeURIComponent(SHOWCASE));window.__lt.showN=n;return;}
  const rq=(Q.match(/[?&]race=([^&]+)/)||[])[1];if(rq)G.race=decodeURIComponent(rq);const mq=(Q.match(/[?&]mode=(X1|X3)/)||[])[1];if(mq){G.mode=mq;for(const x of document.querySelectorAll('.mbtn'))x.classList.toggle('on',x.dataset.mode===mq);}
  renderRaces();if(/[?&]autostart/.test(Q))newGame();}).catch(e=>{console.error(e);$('startBtn').textContent='数据加载失败';});
fitCamera();requestAnimationFrame(frame);
