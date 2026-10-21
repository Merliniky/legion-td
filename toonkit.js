// 军团战争 · ToonKit — 程序化卡通模型系统（替代不合身的着色精灵）
// 每个兵种由“配方”生成：身体方案(humanoid/quad/floater/flyer/serpent/tank/airship/walker/orb…) + 装备/特征部件。
// 几何按骨骼部件合并（顶点色 + 共享卡通材质 + 描边），每个单位约 6~10 个部件 → 手机端开销可控；同配方几何体缓存复用。
import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
let RAMP=null;export function initTK(ramp){RAMP=ramp;}
const MAT={};
function mat(kind){if(MAT[kind])return MAT[kind];let m;
  if(kind==='n')m=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:RAMP});
  else if(kind==='e')m=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  else if(kind==='g')m=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:RAMP,transparent:true,opacity:0.58,depthWrite:false,emissive:0x203048,emissiveIntensity:0.6});
  else if(kind==='ge')m=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false,transparent:true,opacity:0.8,depthWrite:false,blending:THREE.AdditiveBlending});
  else if(kind==='w')m=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:RAMP,transparent:true,opacity:0.78,emissive:0x1a3a66,emissiveIntensity:0.35});
  else if(kind==='o'||kind==='og'){m=new THREE.ShaderMaterial({uniforms:{th:{value:0.012},col:{value:new THREE.Color(kind==='o'?0x2a2238:0x6a90c8)},op:{value:kind==='o'?1:0.45}},side:THREE.BackSide,transparent:kind==='og',depthWrite:kind==='o',
    vertexShader:'uniform float th;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normal);mv.xyz+=n*th*(-mv.z)*0.09;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform vec3 col;uniform float op;void main(){gl_FragColor=vec4(col,op);}'});}
  return MAT[kind]=m;}
// ---------- primitive geometry ----------
const _c=new THREE.Color();
function geoOf(t,a){switch(t){
  case 'box':return new THREE.BoxGeometry(a[0],a[1],a[2]);
  case 'rbox':{const g=new THREE.BoxGeometry(a[0],a[1],a[2],2,2,2);const p=g.attributes.position,r=a[3]||0.3;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1-r*0.35*((Math.abs(x)>a[0]*0.49?1:0)+(Math.abs(y)>a[1]*0.49?1:0)+(Math.abs(z)>a[2]*0.49?1:0)>=2?1:0);p.setXYZ(i,x*k,y*(k*0.5+0.5),z*k);}g.computeVertexNormals();return g;}
  case 'sph':return new THREE.SphereGeometry(a[0],a[1]||10,a[2]||8,a[3]??0,a[4]??Math.PI*2,a[5]??0,a[6]??Math.PI);
  case 'ico':return new THREE.IcosahedronGeometry(a[0],a[1]||0);
  case 'oct':return new THREE.OctahedronGeometry(a[0],0);
  case 'dod':return new THREE.DodecahedronGeometry(a[0],0);
  case 'cyl':return new THREE.CylinderGeometry(a[0],a[1],a[2],a[3]||8);
  case 'cone':return new THREE.ConeGeometry(a[0],a[1],a[2]||8);
  case 'cap':return new THREE.CapsuleGeometry(a[0],a[1],3,a[2]||8);
  case 'tor':return new THREE.TorusGeometry(a[0],a[1],a[2]||6,a[3]||16,a[4]||Math.PI*2);
  case 'shape':{const s=new THREE.Shape();const pts=a[0];s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:a[1]||0.03,bevelEnabled:false});g.translate(0,0,-(a[1]||0.03)/2);return g;}
  case 'lathe':return new THREE.LatheGeometry(a[0].map(([x,y])=>new THREE.Vector2(x,y)),a[1]||10);
  }throw new Error('prim '+t);}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3();
function primGeo(p){let g=geoOf(p.t,p.a);if(g.index)g=g.toNonIndexed();for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  _e.set(...(p.r||[0,0,0]));_q.setFromEuler(_e);_m.compose(_v.set(...(p.p||[0,0,0])),_q,_s.set(...(p.s||[1,1,1])));g.applyMatrix4(_m);
  const n=g.attributes.position.count,col=new Float32Array(n*3);_c.setHex(p.c);for(let i=0;i<n;i++){col[i*3]=_c.r;col[i*3+1]=_c.g;col[i*3+2]=_c.b;}g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;}
// ---------- template builder ----------
class TB{constructor(){this.parts={};this.order=[];this.meta={};this.part('root',null,[0,0,0]);this.part('body','root',[0,0,0]);}
  part(name,parent,pivot){if(!this.parts[name]){this.parts[name]={name,parent,pivot:pivot||[0,0,0],prims:[]};this.order.push(name);}return this;}
  add(name,t,a,p,c,o={}){this.parts[name].prims.push({t,a,p,c,r:o.r,s:o.s,m:o.m||'n'});return this;}}
const TPL=new Map();
function compile(tb,ghost){const out=[];for(const name of tb.order){const P=tb.parts[name];const by={};
    for(const pr of P.prims){let m=pr.m;if(ghost){m=m==='e'?'ge':'g';}(by[m]=by[m]||[]).push(primGeo(pr));}
    const geos={};for(const m in by){geos[m]=mergeGeometries(by[m]);}
    let ol=null;const base=geos.n||geos.w;if(base&&!ghost){let g=base.clone();g.deleteAttribute('normal');g.deleteAttribute('color');g=mergeVertices(g,1e-3);g.computeVertexNormals();ol=g;}
    else if(ghost&&geos.g){let g=geos.g.clone();g.deleteAttribute('normal');g.deleteAttribute('color');g=mergeVertices(g,1e-3);g.computeVertexNormals();ol=g;}
    out.push({name,parent:P.parent,pivot:P.pivot,geos,ol});}
  return {parts:out,meta:tb.meta};}
// 只让主体部件投影：手臂/腿/武器等小部件不进阴影 pass，减少手机上的 draw call
const SHADOW_PARTS=new Set(['root','body','hips','torso','head','wingL','wingR','tread','turret']);
export function buildTK(id,recipe){let T=TPL.get(id);if(!T){const tb=new TB();const plan=PLANS[recipe.plan]||PLANS.humanoid;plan(tb,recipe);T=compile(tb,!!recipe.ghost);T.meta=Object.assign({atk:recipe.atk||'swing',plan:recipe.plan||'humanoid',ghost:!!recipe.ghost},tb.meta);TPL.set(id,T);}
  const nodes={};const root=new THREE.Group();
  for(const P of T.parts){const g=P.name==='root'?root:new THREE.Group();g.position.set(...P.pivot);nodes[P.name]=g;
    for(const m in P.geos){const me=new THREE.Mesh(P.geos[m],mat(m));me.castShadow=(m==='n'||m==='w')&&SHADOW_PARTS.has(P.name);me.renderOrder=m==='g'||m==='ge'?4:0;g.add(me);}
    if(P.ol){const o=new THREE.Mesh(P.ol,mat(recipe.ghost?'og':'o'));o.renderOrder=recipe.ghost?3:0;g.add(o);}
    if(P.parent)nodes[P.parent].add(g);}
  for(const P of T.parts)nodes[P.name].userData.rest=nodes[P.name].rotation.clone();
  root.userData.tk={nodes,meta:T.meta,ph:Math.random()*6.28};return root;}
// ---------- animation ----------
// st: {t, dt, moving, atk:0..1 (attack phase) or -1, dead, deathT, spd}
export function animTK(root,st){const R=root.userData.tk;if(!R)return;const N=R.nodes,M=R.meta,t=st.t+R.ph;
  const set=(n,x,y,z)=>{const o=N[n];if(!o)return;o.rotation.set(x||0,y||0,z||0);};
  const walk=st.moving&&!st.dead,w=t*(M.stride||9);const sw=walk?Math.sin(w):0;
  // locomotion
  if(M.plan==='quad'){set('legFL',sw*0.6);set('legBR',sw*0.6);set('legFR',-sw*0.6);set('legBL',-sw*0.6);}
  else{set('legL',sw*0.65);set('legR',-sw*0.65);}
  const bob=walk?Math.abs(Math.sin(w))*0.05:Math.sin(t*2)*0.012;N.body.position.y=bob+(M.hover?Math.sin(t*2.2)*0.06:0);
  set('torso',walk?0.08:0,walk?Math.sin(w)*0.08:0,0);if(N.torso)N.torso.scale.y=1+Math.sin(t*2.4)*0.015;
  set('armL',walk?-sw*0.5:Math.sin(t*1.7)*0.05,0,M.armSpread||0);set('armR',walk?sw*0.5:-Math.sin(t*1.7)*0.05,0,-(M.armSpread||0));
  set('head',0,Math.sin(t*0.7)*0.15,0);set('tail',0,Math.sin(t*3)*0.35,0);set('tail2',0,Math.sin(t*3-1)*0.4,0);
  if(N.wingL){const f=M.flap?Math.sin(t*(walk?12:7))*0.55:Math.sin(t*2)*0.12;set('wingL',0,0,0.25+f);set('wingR',0,0,-0.25-f);}
  if(N.spin)N.spin.rotation.y+=st.dt*(M.spinSpd||2);if(N.spin2){N.spin2.rotation.x+=st.dt*1.3;N.spin2.rotation.z+=st.dt*0.9;}
  if(N.rotor)N.rotor.rotation.y+=st.dt*20;if(N.prop)N.prop.rotation.z+=st.dt*16;
  if(N.cape)N.cape.rotation.x=0.12+(walk?Math.abs(sw)*0.35:Math.sin(t*1.5)*0.05);
  if(N.tread)N.tread.position.z=walk?Math.sin(w*2)*0.01:0;
  // attack poses
  const a=st.atk;if(a>=0&&!st.dead){const up=a<0.45?a/0.45:1,dn=a<0.45?0:(a-0.45)/0.55,k=Math.sin(Math.min(1,a)*Math.PI);
    switch(M.atk){
      case 'swing':set('armR',-2.5*up+2.0*dn*(2-dn)*1.0,0,-0.1);set('torso',0.25*dn,-0.35*up+0.5*dn,0);break;
      case 'thrust':set('armR',-1.5,0,0);N.armR.position.z=(N.armR.userData.z0??(N.armR.userData.z0=N.armR.position.z))+k*0.18;set('torso',0.18*k,0,0);break;
      case 'shoot':set('armR',-1.45-k*0.12);set('armL',-1.3-k*0.1,0,0.35);set('torso',-0.12*k,0,0);break;
      case 'cast':set('armR',-2.2*k-0.4,0,-0.25);set('armL',-2.2*k-0.4,0,0.25);set('head',-0.2*k,0,0);break;
      case 'slam':set('armR',-2.6*up+2.4*dn);set('armL',-2.6*up+2.4*dn);set('torso',0.35*dn-0.1*up,0,0);break;
      case 'bite':set('head',0.5*k,0,0);if(N.neck)set('neck',0.4*k,0,0);set('torso',0.15*k,0,0);if(N.legFL){set('legFL',-0.7*k);set('legFR',-0.7*k);}break;
      case 'claw':set('armR',-1.9*up+1.6*dn,0,-0.3);set('armL',-1.2*k,0,0.4);set('torso',0.2*k,0,0);break;
      case 'recoil':if(N.turret)N.turret.position.z=-0.06*k;set('body',-0.05*k,0,0);break;
      case 'pulse':N.body.scale.setScalar(1+0.15*k);break;
      case 'dive':set('body',0.4*k,0,0);if(N.neck)set('neck',0.5*k,0,0);break;}}
  else if(N.armR&&N.armR.userData.z0!=null)N.armR.position.z=N.armR.userData.z0;
  if(M.plan!=='quad'&&!(a>=0)&&M.armsIdle!=null){set('armR',M.armsIdle,0,-(M.armSpread||0));set('armL',M.armsIdle,0,M.armSpread||0);}
  // death
  if(st.dead){const d=Math.min(1,st.deathT*2.2);root.rotation.x=-1.35*d*(M.hover?0.4:1);root.position.y=-Math.max(0,st.deathT-0.5)*0.5;}
  else{root.rotation.x=0;}}
// ---------- palette helpers ----------
const dk=(c,k=0.6)=>{_c.setHex(c);return _c.multiplyScalar(k).getHex();};
const lt=(c,k=0.35)=>{_c.setHex(c);_c.lerp(new THREE.Color(1,1,1),k);return _c.getHex();};
// ---------- body plans ----------
const PLANS={};
// humanoid: h=height scale, bw=bulk, kind of head/torso/legs, weapon, offhand, extras list
PLANS.humanoid=(B,o)=>{const h=o.h||1,bw=o.bw||1,sk=o.skin??0xe8b88a,cl=o.cloth??0x5a6aa0,mt=o.metal??0xa8b0bc,ac=o.accent??0xd8a83a;
  const legL=o.legs==='none'?0:(o.legLen||0.36)*h,hipY=(o.legs==='none'?(o.floatY||0.45)*h:legL+0.04*h)+(o.lift||0)*h;const tH=(o.torsoH||0.36)*h,tW=0.3*bw*h,tD=0.2*bw*h;
  B.part('hips','body',[0,hipY,0]).part('torso','hips',[0,0,0]);
  // legs
  if(o.legs!=='none'){for(const [n,s] of [['legL',1],['legR',-1]]){B.part(n,'hips',[s*0.09*bw*h,0,0]);const lc=o.legC??dk(cl,0.75);
      if(o.legs==='robot'){B.add(n,'box',[0.1*h*bw,legL*0.55,0.12*h],[0,-legL*0.3,0],mt).add(n,'sph',[0.06*h],[0,-legL*0.6,0],dk(mt,0.7)).add(n,'box',[0.09*h*bw,legL*0.4,0.1*h],[0,-legL*0.8,0],dk(mt,0.85)).add(n,'box',[0.14*h*bw,0.06*h,0.2*h],[0,-legL+0.03*h,0.03*h],dk(mt,0.6));}
      else if(o.legs==='digit'){B.add(n,'cap',[0.06*h*bw,legL*0.45],[0,-legL*0.3,-0.02],lc,{r:[0.25,0,0]}).add(n,'cap',[0.045*h,legL*0.4],[0,-legL*0.75,-0.04*h],dk(lc,0.85),{r:[-0.3,0,0]}).add(n,'cone',[0.07*h,0.12*h,5],[0,-legL+0.03,0.07*h],dk(lc,0.6),{r:[Math.PI/2,0,0]});}
      else if(o.legs==='hoof'){B.add(n,'cap',[0.07*h*bw,legL*0.5],[0,-legL*0.35,0],lc).add(n,'cyl',[0.06*h,0.075*h,0.1*h,6],[0,-legL+0.05*h,0],0x2a2018);}
      else{B.add(n,'cap',[0.065*h*bw,legL*0.62],[0,-legL*0.45,0],lc).add(n,'box',[0.11*h*bw,0.07*h,0.18*h],[0,-legL+0.035*h,0.03*h],o.bootC??0x3a2a20);}}}
  else if(o.tailLow!==false){// floating spirit / elemental: tapering lower body
    const lc=o.lowC??cl;B.add('hips','cone',[0.17*bw*h,hipY*1.05,8],[0,-hipY*0.42,0],lc,{r:[Math.PI,0,0],m:o.lowM||'n'});}
  // torso
  const tc=o.torsoC??cl;
  if(o.torso==='robot'){B.add('torso','rbox',[tW,tH,tD*1.1,0.4],[0,tH*0.55,0],mt).add('torso','box',[tW*0.6,tH*0.35,0.02],[0,tH*0.62,tD*0.56],dk(mt,0.55)).add('torso','sph',[0.05*h],[0,tH*0.62,tD*0.58],o.core??0x4ad8ff,{m:'e'});}
  else if(o.torso==='robe'){B.add('torso','cyl',[tW*0.45,tW*0.75,tH,8],[0,tH*0.5,0],tc).add('hips','cyl',[tW*0.75,tW*0.95,hipY*0.95,8],[0,-hipY*0.47,0],dk(tc,0.85));}
  else if(o.torso==='brute'){B.add('torso','rbox',[tW*1.2,tH*1.0,tD*1.2,0.5],[0,tH*0.52,0.02],tc).add('torso','rbox',[tW*0.9,tH*0.4,tD*0.9,0.4],[0,tH*0.15,0],dk(tc,0.85));for(const s2 of[-1,1])B.add('torso','sph',[tW*0.3,8,6],[s2*tW*0.62,tH*0.9,0],o.shoulderC??dk(tc,0.9));}
  else if(o.torso==='rock'){B.add('torso','dod',[tW*0.6],[0,tH*0.55,0],tc,{s:[1.15,1.05,0.9]}).add('torso','dod',[tW*0.42],[0,tH*0.1,0],dk(tc,0.85)).add('torso','ico',[tW*0.35],[tW*0.4,tH*0.95,0],dk(tc,0.85)).add('torso','ico',[tW*0.33],[-tW*0.42,tH*0.92,0.02],dk(tc,0.9));}
  else B.add('torso','rbox',[tW,tH,tD,0.35],[0,tH*0.52,0],tc).add('torso','box',[tW*1.02,0.05*h,tD*1.04],[0,0.04*h,0],o.beltC??0x4a3020);
  // head
  const nY=tH*1.02,hs=(o.headS||1)*h;B.part('head','torso',[0,nY,o.torso==='brute'?0.05*h:0]);const hc=o.headC??sk;
  switch(o.head){
    case 'robot':B.add('head','rbox',[0.2*hs,0.17*hs,0.18*hs,0.3],[0,0.09*hs,0],mt).add('head','box',[0.16*hs,0.045*hs,0.02],[0,0.1*hs,0.09*hs],o.eye??0xff3a2a,{m:'e'}).add('head','cyl',[0.008*hs,0.008*hs,0.12*hs,4],[0.06*hs,0.22*hs,0],dk(mt,0.6)).add('head','sph',[0.018*hs],[0.06*hs,0.28*hs,0],o.eye??0xff3a2a,{m:'e'});break;
    case 'dome':B.add('head','sph',[0.12*hs,10,8],[0,0.08*hs,0],mt,{s:[1,0.85,1]}).add('head','box',[0.17*hs,0.05*hs,0.03],[0,0.08*hs,0.105*hs],o.eye??0x4ad8ff,{m:'e'});break;
    case 'skull':B.add('head','sph',[0.11*hs],[0,0.1*hs,0],hc??0xe8e0c8,{s:[0.9,1,1]}).add('head','box',[0.11*hs,0.05*hs,0.08*hs],[0,0.02*hs,0.04*hs],dk(hc,0.85)).add('head','sph',[0.026*hs],[0.04*hs,0.11*hs,0.085*hs],o.eye??0x6affd0,{m:'e'}).add('head','sph',[0.026*hs],[-0.04*hs,0.11*hs,0.085*hs],o.eye??0x6affd0,{m:'e'});break;
    case 'hood':B.add('head','cone',[0.15*hs,0.32*hs,8],[0,0.13*hs,-0.02],o.hoodC??dk(cl,0.8)).add('head','sph',[0.095*hs],[0,0.08*hs,0.03*hs],0x14101c).add('head','sph',[0.022*hs],[0.035*hs,0.09*hs,0.11*hs],o.eye??0xffe06a,{m:'e'}).add('head','sph',[0.022*hs],[-0.035*hs,0.09*hs,0.11*hs],o.eye??0xffe06a,{m:'e'});break;
    case 'beast':B.add('head','sph',[0.12*hs],[0,0.1*hs,0],hc).add('head','box',[0.1*hs,0.08*hs,0.12*hs],[0,0.06*hs,0.1*hs],dk(hc,0.85)).add('head','cone',[0.04*hs,0.09*hs,4],[0.07*hs,0.21*hs,0],dk(hc,0.8)).add('head','cone',[0.04*hs,0.09*hs,4],[-0.07*hs,0.21*hs,0],dk(hc,0.8)).add('head','sph',[0.018*hs],[0.045*hs,0.13*hs,0.1*hs],o.eye??0xffd02a,{m:'e'}).add('head','sph',[0.018*hs],[-0.045*hs,0.13*hs,0.1*hs],o.eye??0xffd02a,{m:'e'});break;
    case 'bird':B.add('head','sph',[0.11*hs],[0,0.1*hs,0],hc).add('head','cone',[0.04*hs,0.14*hs,4],[0,0.07*hs,0.15*hs],0xe8b030,{r:[Math.PI/2,0,0]}).add('head','sph',[0.02*hs],[0.05*hs,0.13*hs,0.08*hs],o.eye??0xffd02a,{m:'e'}).add('head','sph',[0.02*hs],[-0.05*hs,0.13*hs,0.08*hs],o.eye??0xffd02a,{m:'e'});break;
    case 'orb':B.add('head','ico',[0.13*hs,1],[0,0.12*hs,0],o.eye??0x8ad8ff,{m:'e'});break;
    case 'flame':B.add('head','cone',[0.12*hs,0.34*hs,7],[0,0.17*hs,0],o.eye??0xffb02a,{m:'e'}).add('head','cone',[0.07*hs,0.22*hs,6],[0,0.2*hs,0.03],0xfff0a0,{m:'e'});break;
    case 'rock':B.add('head','dod',[0.12*hs],[0,0.06*hs,0.03*hs],hc).add('head','box',[0.14*hs,0.035*hs,0.02],[0,0.07*hs,0.13*hs],o.eye??0xffb04a,{m:'e'});break;
    case 'none':break;
    default:B.add('head','sph',[0.105*hs,10,8],[0,0.1*hs,0],hc).add('head','sph',[0.016*hs],[0.038*hs,0.11*hs,0.095*hs],0x1a1a1a).add('head','sph',[0.016*hs],[-0.038*hs,0.11*hs,0.095*hs],0x1a1a1a);
      if(o.hair)B.add('head','sph',[0.11*hs,10,6,],[0,0.14*hs,-0.02*hs],o.hair,{s:[1,0.6,1]});if(o.beard)B.add('head','cone',[0.07*hs,0.14*hs,6],[0,0.0,0.07*hs],o.beard,{r:[Math.PI,0,0]});}
  // helmets / headgear
  const hg=o.helm;if(hg==='helm')B.add('head','sph',[0.12*hs,10,6,0,Math.PI*2,0,Math.PI/2],[0,0.11*hs,0],mt).add('head','box',[0.03*hs,0.06*hs,0.04*hs],[0,0.12*hs,0.11*hs],dk(mt,0.7));
  else if(hg==='greathelm')B.add('head','cyl',[0.115*hs,0.12*hs,0.2*hs,8],[0,0.1*hs,0],mt).add('head','box',[0.16*hs,0.02*hs,0.02],[0,0.11*hs,0.12*hs],0x101010).add('head','cone',[0.03*hs,0.12*hs,4],[0,0.26*hs,0],ac);
  else if(hg==='visor')B.add('head','sph',[0.12*hs,10,6],[0,0.11*hs,0],mt,{s:[1,0.95,1]}).add('head','box',[0.17*hs,0.05*hs,0.04],[0,0.1*hs,0.1*hs],o.eye??0x4ad8ff,{m:'e'});
  else if(hg==='cap')B.add('head','cyl',[0.12*hs,0.11*hs,0.08*hs,10],[0,0.18*hs,0],o.capC??0x2a3a6a).add('head','box',[0.14*hs,0.015*hs,0.08*hs],[0,0.15*hs,0.1*hs],0x1a1a1a).add('head','sph',[0.025*hs],[0,0.19*hs,0.11*hs],ac);
  else if(hg==='bicorne')B.add('head','cyl',[0.04*hs,0.04*hs,0.32*hs,3],[0,0.2*hs,0],o.capC??0x1a1a2a,{r:[0,0,Math.PI/2],s:[1,1,2.4]}).add('head','sph',[0.03*hs],[0,0.24*hs,0.05*hs],ac);
  else if(hg==='wizard')B.add('head','cone',[0.14*hs,0.36*hs,8],[0,0.33*hs,-0.02],o.capC??cl).add('head','cyl',[0.2*hs,0.2*hs,0.02*hs,10],[0,0.17*hs,0],o.capC??cl);
  else if(hg==='horns')B.add('head','cone',[0.035*hs,0.18*hs,5],[0.09*hs,0.22*hs,0],o.hornC??0xe8dcc0,{r:[0,0,-0.6]}).add('head','cone',[0.035*hs,0.18*hs,5],[-0.09*hs,0.22*hs,0],o.hornC??0xe8dcc0,{r:[0,0,0.6]});
  else if(hg==='crown')B.add('head','cyl',[0.1*hs,0.095*hs,0.06*hs,8],[0,0.2*hs,0],0xffc83a).add('head','sph',[0.02*hs],[0,0.22*hs,0.1*hs],0xff3a5a,{m:'e'});
  else if(hg==='halo')B.add('head','tor',[0.12*hs,0.015*hs,6,20],[0,0.3*hs,0],0xfff0a0,{r:[Math.PI/2,0,0],m:'e'});
  // arms
  const aL=(o.armLen||0.34)*h,shY=tH*0.88,shX=tW*(o.torso==='brute'?0.75:0.5)+0.04*h*bw,ac2=o.armC??(o.torso==='robot'?mt:o.sleeve??tc);
  for(const [n,s] of [['armL',1],['armR',-1]]){B.part(n,'torso',[s*shX,shY,0]);
    if(o.arms==='rock'){B.add(n,'ico',[0.08*h*bw],[0,-aL*0.2,0],ac2).add(n,'ico',[0.075*h*bw],[0,-aL*0.55,0],dk(ac2,0.9)).add(n,'dod',[0.1*h*bw],[0,-aL*0.95,0.02],dk(ac2,0.8));if(o.glow)B.add(n,'oct',[0.03*h],[0,-aL*0.55,0.07*h*bw],o.glow,{m:'e'});}
    else if(o.arms==='robot'){B.add(n,'sph',[0.07*h*bw],[0,0,0],dk(mt,0.8)).add(n,'box',[0.08*h*bw,aL*0.5,0.09*h*bw],[0,-aL*0.3,0],mt).add(n,'box',[0.075*h*bw,aL*0.45,0.08*h*bw],[0,-aL*0.75,0],dk(mt,0.85));}
    else if(o.arms==='none'){}
    else{B.add(n,'cap',[0.05*h*bw,aL*0.62],[0,-aL*0.42,0],ac2).add(n,'sph',[0.05*h*bw],[0,-aL*0.9,0],o.handC??(o.arms==='claw'?dk(sk,0.8):sk));
      if(o.arms==='claw')for(const dx of [-0.025,0,0.025])B.add(n,'cone',[0.015*h,0.09*h,4],[dx*h,-aL-0.04*h,0.03*h],0xf0e8d0,{r:[2.6,0,0]});}
    if(o.pads)B.add(n,'sph',[0.085*h*bw,8,6,0,Math.PI*2,0,Math.PI/2],[s*0.01,0.02,0],o.padC??mt,{s:[1.1,0.8,1.1]});
    if(o.spikes&&o.pads)B.add(n,'cone',[0.025*h,0.1*h,4],[s*0.02,0.09*h,0],0xd8d8d8);}
  B.meta.armSpread=o.armSpread??0.08;if(o.armsIdle!=null)B.meta.armsIdle=o.armsIdle;B.meta.hover=o.legs==='none'||!!o.lift;B.meta.stride=o.stride;
  const hy=-aL;// hand position in arm space
  weapon(B,'armR',o.weapon,o,h,hy);weapon(B,'armL',o.off,o,h,hy,true);
  // extras
  for(const x of o.extras||[])EXTRA[x.split(':')[0]]&&EXTRA[x.split(':')[0]](B,o,h,{tW,tH,tD,nY,col:x.split(':')[1]?parseInt(x.split(':')[1]):null});};
function weapon(B,arm,w,o,h,hy,left){if(!w)return;const mt=o.wMetal??0xc8d0d8,wd=o.wood??0x7a5432,ac=o.accent??0xd8a83a,gl=o.glow??0x6ad8ff;
  switch(w){
    case 'sword':B.add(arm,'box',[0.025*h,0.02*h,0.42*h],[0,hy,0.24*h],mt).add(arm,'box',[0.12*h,0.025*h,0.03*h],[0,hy,0.04*h],ac).add(arm,'cyl',[0.015*h,0.015*h,0.08*h,5],[0,hy,-0.01],dk(wd));break;
    case 'greatsword':B.add(arm,'box',[0.045*h,0.025*h,0.62*h],[0,hy,0.34*h],mt).add(arm,'box',[0.18*h,0.03*h,0.04*h],[0,hy,0.03*h],ac);break;
    case 'blade':B.add(arm,'shape',[[[0,0],[0.06,0.03],[0.02,0.42],[-0.02,0.1]].map(([x,y])=>[x*h,y*h]),0.02*h],[0,hy,0.02],gl,{r:[Math.PI/2,0,0],m:'e'});break;
    case 'axe':B.add(arm,'cyl',[0.015*h,0.015*h,0.45*h,5],[0,hy,0.15*h],wd,{r:[Math.PI/2,0,0]}).add(arm,'shape',[[[0,0],[0.13,0.06],[0.13,-0.1],[0,-0.04]].map(([x,y])=>[x*h,y*h]),0.02*h],[0.01,hy,0.32*h],mt,{r:[0,Math.PI/2,0]});break;
    case 'hammer':B.add(arm,'cyl',[0.017*h,0.017*h,0.42*h,5],[0,hy,0.14*h],wd,{r:[Math.PI/2,0,0]}).add(arm,'box',[0.16*h,0.11*h,0.11*h],[0,hy,0.33*h],mt);break;
    case 'spear':B.add(arm,'cyl',[0.013*h,0.013*h,0.8*h,5],[0,hy,0.2*h],wd,{r:[Math.PI/2,0,0]}).add(arm,'cone',[0.03*h,0.13*h,4],[0,hy,0.66*h],mt,{r:[Math.PI/2,0,0]});break;
    case 'trident':B.add(arm,'cyl',[0.013*h,0.013*h,0.8*h,5],[0,hy,0.2*h],o.wMetal??0xd8b040,{r:[Math.PI/2,0,0]});for(const dx of [-0.05,0,0.05])B.add(arm,'cone',[0.017*h,0.12*h,4],[dx*h,hy,0.66*h],o.wMetal??0xd8b040,{r:[Math.PI/2,0,0]});B.add(arm,'box',[0.12*h,0.02*h,0.02*h],[0,hy,0.6*h],o.wMetal??0xd8b040);break;
    case 'scythe':B.add(arm,'cyl',[0.014*h,0.014*h,0.75*h,5],[0,hy+0.1*h,0],wd).add(arm,'shape',[[[0,0],[0.3,0.06],[0.05,-0.05]].map(([x,y])=>[x*h,y*h]),0.015*h],[0,hy+0.45*h,0],mt,{r:[0,-Math.PI/2,0]});break;
    case 'staff':B.add(arm,'cyl',[0.016*h,0.02*h,0.85*h,5],[0,hy+0.12*h,0.02],wd).add(arm,'ico',[0.06*h,0],[0,hy+0.58*h,0.02],gl,{m:'e'});break;
    case 'wand':B.add(arm,'cyl',[0.012*h,0.012*h,0.25*h,5],[0,hy-0.05*h,0.05*h],wd,{r:[0.6,0,0]}).add(arm,'sph',[0.035*h],[0,hy-0.16*h,0.13*h],gl,{m:'e'});break;
    case 'orb':B.add(arm,'ico',[0.08*h,1],[0,hy-0.04*h,0.05*h],gl,{m:'e'});break;
    case 'book':B.add(arm,'box',[0.12*h,0.16*h,0.04*h],[0,hy-0.02*h,0.06*h],o.bookC??0x7a2a2a);break;
    case 'bow':B.add(arm,'tor',[0.22*h,0.012*h,4,12,Math.PI*0.9],[0,hy,0.02],wd,{r:[0,Math.PI/2,Math.PI*0.55]});break;
    case 'pistol':B.add(arm,'box',[0.04*h,0.14*h,0.05*h],[0,hy-0.06*h,0.02],0x3a3a42).add(arm,'box',[0.035*h,0.05*h,0.06*h],[0,hy,-0.02],wd);break;
    case 'rifle':B.add(arm,'box',[0.045*h,0.42*h,0.06*h],[0,hy-0.1*h,0.03*h],0x3a3a42).add(arm,'cyl',[0.013*h,0.013*h,0.2*h,5],[0,hy-0.38*h,0.04*h],0x2a2a2a).add(arm,'box',[0.04*h,0.14*h,0.05*h],[0,hy+0.1*h,0.01],wd);break;
    case 'tesla':B.add(arm,'box',[0.07*h,0.3*h,0.08*h],[0,hy-0.08*h,0.02],0x3a4a5a).add(arm,'tor',[0.045*h,0.012*h,5,10],[0,hy-0.15*h,0.02],0xd8a83a,{r:[Math.PI/2,0,0]}).add(arm,'tor',[0.045*h,0.012*h,5,10],[0,hy-0.23*h,0.02],0xd8a83a,{r:[Math.PI/2,0,0]}).add(arm,'sph',[0.04*h],[0,hy-0.3*h,0.02],gl,{m:'e'});break;
    case 'flamer':B.add(arm,'cyl',[0.04*h,0.05*h,0.32*h,8],[0,hy-0.1*h,0.02],0x4a4a52).add(arm,'cyl',[0.055*h,0.04*h,0.07*h,8],[0,hy-0.28*h,0.02],0x2a2a2a).add(arm,'sph',[0.035*h],[0,hy-0.33*h,0.02],0xff8a2a,{m:'e'}).add(arm,'tor',[0.045*h,0.01*h,4,10],[0,hy-0.05*h,0.02],0xd85a2a,{r:[Math.PI/2,0,0]});B.meta.muzzle='flame';break;
    case 'cannon':B.add(arm,'cyl',[0.06*h,0.07*h,0.36*h,8],[0,hy-0.12*h,0.02],0x4a4a52).add(arm,'cyl',[0.07*h,0.07*h,0.05*h,8],[0,hy-0.3*h,0.02],0x2a2a2a);break;
    case 'minigun':for(let i=0;i<3;i++){const a=i*2.09;B.add(arm,'cyl',[0.014*h,0.014*h,0.34*h,5],[Math.cos(a)*0.025*h,hy-0.14*h,0.02+Math.sin(a)*0.025*h],0x3a3a3a);}B.add(arm,'cyl',[0.05*h,0.05*h,0.08*h,8],[0,hy,0.02],0x5a5a62);break;
    case 'shield':B.add(arm,'cyl',[0.13*h,0.13*h,0.03*h,10],[left?0.03*h:-0.03*h,hy*0.65,0.06*h],o.shieldC??0x3a5aa0,{r:[Math.PI/2,0,0]}).add(arm,'sph',[0.03*h],[left?0.03*h:-0.03*h,hy*0.65,0.08*h],o.accent??0xd8a83a);break;
    case 'towershield':B.add(arm,'rbox',[0.04*h,0.34*h,0.24*h,0.3],[left?0.05*h:-0.05*h,hy*0.6,0.05*h],o.shieldC??0x8a8a9a,{r:[0,Math.PI/2,0]});break;
    case 'claws':for(const dx of [-0.03,0,0.03])B.add(arm,'cone',[0.016*h,0.16*h,4],[dx*h,hy-0.08*h,0.03*h],o.clawC??0xe8e8e8,{r:[Math.PI-0.3,0,0]});break;
    case 'drill':B.add(arm,'cone',[0.07*h,0.28*h,8],[0,hy-0.14*h,0.02],o.wMetal??0xb0b0b8,{r:[Math.PI,0,0]});break;
    case 'glowfist':B.add(arm,'ico',[0.075*h,1],[0,hy,0],o.glow??0x8ad8ff,{m:'e'});break;
    case 'torch':B.add(arm,'cyl',[0.015*h,0.015*h,0.25*h,5],[0,hy,0.05*h],wd).add(arm,'cone',[0.05*h,0.12*h,6],[0,hy+0.17*h,0.05*h],0xffa02a,{m:'e'});break;
    case 'chain':for(let i=0;i<4;i++)B.add(arm,'tor',[0.03*h,0.008*h,4,8],[0,hy-0.04*h-i*0.05*h,0.02],0x8a8a8a,{r:[0,i%2?Math.PI/2:0,0]});B.add(arm,'sph',[0.05*h],[0,hy-0.25*h,0.02],0x5a5a5a);break;
  }}
const EXTRA={
  cape:(B,o,h,d)=>{B.part('cape','torso',[0,d.tH*0.92,-d.tD*0.55]);B.add('cape','box',[d.tW*1.05,d.tH*1.5+0.2*h,0.02],[0,-(d.tH*0.75+0.1*h),-0.01],d.col??o.capeC??0xb0282a);},
  backpack:(B,o,h,d)=>{B.add('torso','rbox',[d.tW*0.8,d.tH*0.7,0.12*h,0.3],[0,d.tH*0.55,-d.tD*0.5-0.06*h],d.col??dk(o.metal??0x8a8a8a,0.8));},
  tanks:(B,o,h,d)=>{for(const s of [-1,1])B.add('torso','cap',[0.05*h,0.18*h],[s*0.06*h,d.tH*0.55,-d.tD*0.5-0.06*h],d.col??0xd85a2a);B.add('torso','tor',[0.06*h,0.012*h,4,8,Math.PI],[0,d.tH*0.85,-d.tD*0.5-0.05*h],0x2a2a2a,{r:[0,Math.PI/2,0]});},
  coils:(B,o,h,d)=>{for(const s of [-1,1]){B.add('torso','cyl',[0.025*h,0.025*h,0.2*h,6],[s*0.08*h,d.tH*0.95+0.1*h,-d.tD*0.4],0x5a5a62);B.add('torso','sph',[0.04*h],[s*0.08*h,d.tH*0.95+0.22*h,-d.tD*0.4],o.glow??0x6ad8ff,{m:'e'});}},
  antenna:(B,o,h,d)=>{B.add('torso','cyl',[0.008*h,0.008*h,0.35*h,4],[0.08*h,d.tH+0.15*h,-d.tD*0.5],0x3a3a3a).add('torso','sph',[0.02*h],[0.08*h,d.tH+0.33*h,-d.tD*0.5],0xff3a2a,{m:'e'});},
  chest:(B,o,h,d)=>{B.add('torso','ico',[0.055*h,0],[0,d.tH*0.62,d.tD*0.55],d.col??o.glow??0x6ad8ff,{m:'e'});},
  plate:(B,o,h,d)=>{B.add('torso','rbox',[d.tW*1.08,d.tH*0.6,d.tD*1.15,0.4],[0,d.tH*0.66,0.005],d.col??o.metal??0xb0b8c4);},
  tabard:(B,o,h,d)=>{B.add('torso','box',[d.tW*0.5,d.tH*0.9+0.12*h,0.02],[0,d.tH*0.4,d.tD*0.53],d.col??o.accent??0xd8a83a);},
  epaulets:(B,o,h,d)=>{for(const s of [-1,1])B.add('torso','cyl',[0.07*h,0.06*h,0.03*h,8],[s*(d.tW*0.5+0.02*h),d.tH*0.95,0],d.col??0xffc83a);},
  medals:(B,o,h,d)=>{for(const dx of [-0.04,0,0.04])B.add('torso','sph',[0.015*h],[dx*h+0.04*h,d.tH*0.7,d.tD*0.55],0xffc83a);},
  wings:(B,o,h,d)=>wings(B,o,h,d,'feather'),bwings:(B,o,h,d)=>wings(B,o,h,d,'bat'),ewings:(B,o,h,d)=>wings(B,o,h,d,'energy'),
  tail:(B,o,h,d)=>{B.part('tail','hips',[0,0.02*h,-0.1*h]);B.add('tail','cone',[0.06*h,0.45*h,6],[0,-0.05*h,-0.22*h],d.col??o.tailC??dk(o.skin??0x8a6a4a),{r:[-Math.PI/2-0.4,0,0]});},
  spikes:(B,o,h,d)=>{for(let i=0;i<4;i++)B.add('torso','cone',[0.03*h,0.13*h,4],[(i-1.5)*0.06*h,d.tH*0.9,-d.tD*0.45],d.col??0xd8d8d8,{r:[-0.7,0,0]});},
  jets:(B,o,h,d)=>{for(const s of [-1,1]){B.add('torso','cyl',[0.04*h,0.05*h,0.16*h,6],[s*0.07*h,d.tH*0.5,-d.tD*0.6],0x4a4a52);B.add('torso','cone',[0.04*h,0.12*h,6],[s*0.07*h,d.tH*0.35,-d.tD*0.6],0xffa02a,{r:[Math.PI,0,0],m:'e'});}},
  chains:(B,o,h,d)=>{for(let i=0;i<5;i++)B.add('torso','tor',[0.025*h,0.007*h,4,8],[d.tW*0.4-i*0.04*h,d.tH*0.3+i*0.07*h,d.tD*0.55],0x9a9aa8,{r:[0,i%2?Math.PI/2:0,0.8]});},
  aura:(B,o,h,d)=>{B.part('spin','root',[0,0.05,0]);B.add('spin','tor',[0.42*h,0.02*h,4,24],[0,0,0],d.col??o.glow??0x8ad8ff,{r:[Math.PI/2,0,0],m:'e'});for(let i=0;i<3;i++){const a=i*2.09;B.add('spin','oct',[0.04*h],[Math.cos(a)*0.42*h,0.05,Math.sin(a)*0.42*h],d.col??o.glow??0x8ad8ff,{m:'e'});}},
  orbit:(B,o,h,d)=>{B.part('spin','torso',[0,d.tH*0.8,0]);for(let i=0;i<3;i++){const a=i*2.09;B.add('spin','ico',[0.045*h,0],[Math.cos(a)*0.3*h,Math.sin(a*2)*0.05,Math.sin(a)*0.3*h],d.col??o.glow??0x8ad8ff,{m:'e'});}B.meta.spinSpd=3;},
  rings:(B,o,h,d)=>{B.part('spin2','torso',[0,d.tH*0.6,0]);B.add('spin2','tor',[0.3*h,0.012*h,4,24],[0,0,0],d.col??o.glow??0xb06aff,{m:'e'}).add('spin2','tor',[0.26*h,0.012*h,4,24],[0,0,0],d.col??o.glow??0xb06aff,{r:[Math.PI/2,0,0],m:'e'});},
  mane:(B,o,h,d)=>{B.add('head','ico',[0.15*h*(o.headS||1),0],[0,0.08*h,-0.05*h],d.col??0x8a4a1a,{s:[1.2,1,0.9]});},
  beard:(B,o,h,d)=>{B.add('head','cone',[0.07*h,0.16*h,6],[0,0.0,0.08*h],d.col??0xd8d8d8,{r:[Math.PI-0.3,0,0]});},
  tusks:(B,o,h,d)=>{for(const s of [-1,1])B.add('head','cone',[0.018*h,0.08*h,4],[s*0.04*h,0.05*h,0.11*h],0xf0ead8,{r:[-0.6,0,0]});},
  quiver:(B,o,h,d)=>{B.add('torso','cyl',[0.04*h,0.035*h,0.3*h,6],[0.06*h,d.tH*0.6,-d.tD*0.55],0x6a4a2a,{r:[0,0,0.4]});},
  belly:(B,o,h,d)=>{B.add('torso','sph',[d.tW*0.55],[0,d.tH*0.4,0.04*h],d.col??lt(o.skin??0x8a8a8a,0.2),{s:[1,0.9,0.8]});},
  stitches:(B,o,h,d)=>{for(let i=0;i<3;i++)B.add('torso','box',[0.12*h,0.012*h,0.01],[0,d.tH*(0.35+i*0.2),d.tD*0.6],0x2a1a1a);},
  flamebody:(B,o,h,d)=>{for(let i=0;i<5;i++){const a=i*1.26;B.add('torso','cone',[0.05*h,0.2*h,5],[Math.cos(a)*d.tW*0.4,d.tH*0.9,Math.sin(a)*d.tD*0.5],i%2?0xffe07a:0xff7a2a,{m:'e'});}},
  crest:(B,o,h,d)=>{for(let i=0;i<4;i++)B.add('head','cone',[0.03*h,(0.16-i*0.02)*h,4],[0,0.2*h,-0.04*h-i*0.05*h],d.col??0x6ad8ff,{r:[-0.6-i*0.2,0,0],m:o.ghost?'n':'e'});},
  wisps:(B,o,h,d)=>{B.part('spin','torso',[0,d.tH*0.5,0]);for(let i=0;i<4;i++){const a=i*1.57;B.add('spin','sph',[0.03*h],[Math.cos(a)*0.24*h,i*0.08*h,Math.sin(a)*0.24*h],d.col??0xbaf0ff,{m:'e'});}},
  halo:(B,o,h,d)=>{B.add('head','tor',[0.12*h,0.015*h,6,20],[0,0.3*h,0],d.col??0xfff0a0,{r:[Math.PI/2,0,0],m:'e'});},
  ears:(B,o,h,d)=>{const hs=h*(o.headS||1);for(const s of [-1,1])B.add('head','cone',[0.025*hs,0.16*hs,4],[s*0.12*hs,0.12*hs,-0.01*hs],d.col??o.headC??o.skin??0xe8b88a,{r:[0.3,0,-s*1.25]});},
  blindfold:(B,o,h,d)=>{const hs=h*(o.headS||1);B.add('head','cyl',[0.108*hs,0.108*hs,0.035*hs,10],[0,0.12*hs,0],d.col??0x2a8a3a);},
  tentacles:(B,o,h,d)=>{const hs=h*(o.headS||1);for(let i=0;i<5;i++){const x=(i-2)*0.035*hs;B.add('head','cone',[0.022*hs,0.16*hs,4],[x,0.0,0.11*hs],d.col??o.headC??0x5a3a6a,{r:[Math.PI-0.25+Math.abs(i-2)*0.05,0,(i-2)*0.15]});}},
  head2:(B,o,h,d)=>{const hs=h*(o.headS||1),c=d.col??o.headC??o.skin??0x6a8a4a;for(const s of[-1,1]){B.add('neck','cap',[0.05*h,0.14*h],[s*0.09*h,0.1*h,0.1*h],c,{r:[0.8,0,-s*0.5]}).add('neck','box',[0.11*hs,0.08*hs,0.17*hs],[s*0.16*h,0.2*h,0.2*h],c).add('neck','sph',[0.018*hs],[s*0.16*h+0.04*hs,0.23*h,0.27*h],o.eye??0xffd02a,{m:'e'}).add('neck','sph',[0.018*hs],[s*0.16*h-0.04*hs,0.23*h,0.27*h],o.eye??0xffd02a,{m:'e'});}},
  candle:(B,o,h,d)=>{const hs=h*(o.headS||1);B.add('head','cyl',[0.025*hs,0.025*hs,0.08*hs,6],[0,0.27*hs,0],0xf0e8d0).add('head','cone',[0.02*hs,0.06*hs,5],[0,0.34*hs,0],0xffc84a,{m:'e'});},
  goblinrider:(B,o,h,d)=>{const y=d.tH*1.0;B.add('torso','rbox',[0.13*h,0.13*h,0.1*h,0.3],[0,y+0.08*h,-d.tD*0.35],d.col??0x6a4a8a).add('torso','sph',[0.07*h],[0,y+0.2*h,-d.tD*0.35],0x7ab84a).add('torso','cone',[0.02*h,0.09*h,4],[0.08*h,y+0.21*h,-d.tD*0.35],0x7ab84a,{r:[0,0,-1.3]}).add('torso','cone',[0.02*h,0.09*h,4],[-0.08*h,y+0.21*h,-d.tD*0.35],0x7ab84a,{r:[0,0,1.3]});},
  bones:(B,o,h,d)=>{for(let i=0;i<3;i++)B.add('torso','box',[d.tW*0.9,0.025*h,0.03*h],[0,d.tH*(0.35+i*0.18),d.tD*0.5],0xe8e0c8);},
};
function wings(B,o,h,d,kind){const c=d.col??o.wingC??(kind==='bat'?0x5a3a5a:kind==='energy'?0x9ad8ff:0xf0f0f0);const sp=o.wingSpan||1;
  for(const [n,s] of [['wingL',1],['wingR',-1]]){B.part(n,'torso',[s*0.07*h,d.tH*0.85,-d.tD*0.5]);
    const pts=kind==='bat'?[[0,0],[0.55,0.25],[0.5,-0.05],[0.38,0.05],[0.3,-0.12],[0.16,-0.02],[0.05,-0.15]]:kind==='energy'?[[0,0],[0.5,0.35],[0.42,0.05],[0.12,-0.12]]:[[0,0],[0.25,0.22],[0.55,0.18],[0.5,0.02],[0.4,-0.08],[0.25,-0.12],[0.08,-0.1]];
    B.add(n,'shape',[pts.map(([x,y])=>[s*x*h*sp,y*h*sp]),0.02*h],[0,0,0],c,{m:kind==='energy'?'e':(o.ghost?'n':'n')});}B.meta.flap=o.flapAlways||false;}
// quadruped: wolves, bears, cats, horses, lizards, boars
PLANS.quad=(B,o)=>{const h=o.h||1,bw=o.bw||1,c=o.skin??0x8a6a4a,c2=o.skin2??lt(c,0.25);const L=(o.legLen||0.3)*h,bl=(o.bodyLen||0.55)*h,bh=(o.bodyH||0.26)*h*bw,bwid=0.24*h*bw;
  B.part('hips','body',[0,L+bh*0.4,0]).part('torso','hips',[0,0,0]);
  B.add('torso','cap',[bh*0.5,bl*0.7,10],[0,0,0],c,{r:[Math.PI/2,0,0],s:[bwid/bh,1,1]}).add('torso','sph',[bh*0.45],[0,-bh*0.1,0.05*h],c2,{s:[0.9,0.7,1.6]});
  if(o.hump)B.add('torso','sph',[bh*0.55],[0,bh*0.35,bl*0.2],c,{s:[1.1,0.8,1]});
  for(const [n,x,z] of [['legFL',1,1],['legFR',-1,1],['legBL',1,-1],['legBR',-1,-1]]){B.part(n,'hips',[x*bwid*0.32,-bh*0.1,z*bl*0.38]);B.add(n,'cap',[0.055*h*bw,L*0.7],[0,-L*0.5,0],z>0?c:dk(c,0.92)).add(n,'sph',[0.06*h*bw],[0,-L+0.03*h,0.02*h],o.pawC??dk(c,0.6),{s:[1,0.6,1.3]});
    if(o.claws)B.add(n,'cone',[0.02*h,0.06*h,4],[0,-L+0.02*h,0.08*h],0xf0e8d8,{r:[Math.PI/2,0,0]});}
  B.part('neck','torso',[0,bh*0.25,bl*0.42]);B.add('neck','cap',[bh*0.32,0.12*h*(o.neckLen||1)],[0,0.05*h,0.06*h],c,{r:[0.9,0,0]});
  B.part('head','neck',[0,0.1*h*(o.neckLen||1),0.12*h]);const hs=(o.headS||1)*h;
  const hd=o.headType||'wolf';
  if(hd==='bear')B.add('head','sph',[0.13*hs],[0,0,0],c).add('head','sph',[0.07*hs],[0,-0.03*hs,0.12*hs],c2).add('head','sph',[0.045*hs],[0.09*hs,0.1*hs,-0.02],c).add('head','sph',[0.045*hs],[-0.09*hs,0.1*hs,-0.02],c);
  else if(hd==='cat')B.add('head','sph',[0.12*hs],[0,0,0],c,{s:[1.1,0.9,1]}).add('head','sph',[0.06*hs],[0,-0.03*hs,0.1*hs],c2).add('head','cone',[0.04*hs,0.08*hs,4],[0.07*hs,0.11*hs,0],c).add('head','cone',[0.04*hs,0.08*hs,4],[-0.07*hs,0.11*hs,0],c);
  else if(hd==='horse')B.add('head','cap',[0.07*hs,0.18*hs],[0,0,0.08*hs],c,{r:[1.2,0,0]}).add('head','cone',[0.03*hs,0.08*hs,4],[0.05*hs,0.1*hs,0],c).add('head','cone',[0.03*hs,0.08*hs,4],[-0.05*hs,0.1*hs,0],c);
  else if(hd==='lizard')B.add('head','box',[0.14*hs,0.08*hs,0.24*hs],[0,0,0.08*hs],c).add('head','box',[0.12*hs,0.03*hs,0.2*hs],[0,-0.05*hs,0.1*hs],c2);
  else if(hd==='boar')B.add('head','sph',[0.12*hs],[0,0,0.02],c).add('head','cyl',[0.05*hs,0.06*hs,0.1*hs,8],[0,-0.03*hs,0.13*hs],c2,{r:[Math.PI/2,0,0]});
  else B.add('head','sph',[0.11*hs],[0,0,0],c).add('head','box',[0.08*hs,0.07*hs,0.16*hs],[0,-0.03*hs,0.12*hs],c2).add('head','cone',[0.035*hs,0.1*hs,4],[0.06*hs,0.12*hs,-0.02],c).add('head','cone',[0.035*hs,0.1*hs,4],[-0.06*hs,0.12*hs,-0.02],c);
  B.add('head','sph',[0.022*hs],[0.055*hs,0.04*hs,0.09*hs],o.eye??0xffd02a,{m:'e'}).add('head','sph',[0.022*hs],[-0.055*hs,0.04*hs,0.09*hs],o.eye??0xffd02a,{m:'e'});
  if(o.horns)B.add('head','cone',[0.035*hs,0.2*hs,5],[0.08*hs,0.12*hs,-0.02],o.hornC??0xe8dcc0,{r:[-0.4,0,-0.5]}).add('head','cone',[0.035*hs,0.2*hs,5],[-0.08*hs,0.12*hs,-0.02],o.hornC??0xe8dcc0,{r:[-0.4,0,0.5]});
  if(o.tusks)for(const s of[-1,1])B.add('head','cone',[0.02*hs,0.1*hs,4],[s*0.05*hs,-0.06*hs,0.16*hs],0xf0ead8,{r:[-0.4,0,0]});
  if(o.mane)B.add('neck','ico',[0.14*h,0],[0,0.08*h,0.02],o.maneC??dk(c,0.7),{s:[1.1,1.1,1.3]});
  B.part('tail','torso',[0,bh*0.1,-bl*0.48]);B.add('tail','cone',[0.04*h*(o.tailW||1),(o.tailLen||0.3)*h,5],[0,0,-(o.tailLen||0.3)*h*0.45],o.tailC??c,{r:[-Math.PI/2+0.4,0,0]});
  if(o.spikes)for(let i=0;i<4;i++)B.add('torso','cone',[0.03*h,0.1*h,4],[0,bh*0.48,bl*(0.25-i*0.16)],o.spikeC??0xd8d0c0,{r:[-0.3,0,0]});
  if(o.saddle)B.add('torso','box',[bwid*1.05,0.05*h,0.18*h],[0,bh*0.5,0],o.saddle);
  if(o.rider){B.part('rider','torso',[0,bh*0.5,0]);B.add('rider','rbox',[0.18*h,0.24*h,0.12*h,0.3],[0,0.14*h,0],o.rider).add('rider','sph',[0.07*h],[0,0.33*h,0],o.riderSkin??0xe8b88a);if(o.riderHelm)B.add('rider','sph',[0.08*h,8,6,0,Math.PI*2,0,Math.PI/2],[0,0.35*h,0],o.riderHelm);if(o.lance)B.add('rider','cyl',[0.012*h,0.012*h,0.7*h,5],[0.1*h,0.15*h,0.25*h],o.lance,{r:[Math.PI/2-0.15,0,0]});}
  B.meta.stride=o.stride||10;};
// floating orb/wisp/energy: core + shells
PLANS.orb=(B,o)=>{const h=o.h||1,c=o.glow??0x9ad8ff;B.meta.hover=true;B.part('hips','body',[0,0.55*h,0]).part('torso','hips',[0,0,0]);
  B.add('torso','ico',[0.14*h,1],[0,0,0],0xffffff,{m:'e'}).add('torso','ico',[0.22*h,1],[0,0,0],c,{m:o.ghost?'ge':'w'});
  B.part('spin2','torso',[0,0,0]);B.add('spin2','tor',[0.3*h,0.014*h,4,24],[0,0,0],c,{m:'e'}).add('spin2','tor',[0.3*h,0.014*h,4,24],[0,0,0],lt(c,0.4),{r:[Math.PI/2,0,0],m:'e'});
  if(o.spikes)for(let i=0;i<6;i++){const a=i*1.047;B.add('torso','cone',[0.04*h,0.14*h,4],[Math.cos(a)*0.24*h,0,Math.sin(a)*0.24*h],c,{r:[0,0,-Math.PI/2],m:'e'}).parts;}
  for(const x of o.extras||[])EXTRA[x.split(':')[0]]&&EXTRA[x.split(':')[0]](B,o,h,{tW:0.3*h,tH:0.2*h,tD:0.2*h,nY:0.2*h,col:x.split(':')[1]?parseInt(x.split(':')[1]):null});};
// flyer: birds, dragons, wyverns, bats — body + wings + neck/head + tail
PLANS.flyer=(B,o)=>{const h=o.h||1,c=o.skin??0x6a8a4a,c2=o.skin2??lt(c,0.3),bl=(o.bodyLen||0.45)*h;B.meta.hover=true;B.meta.flap=true;
  B.part('hips','body',[0,(o.alt||0.75)*h,0]).part('torso','hips',[0,0,0]);
  B.add('torso','cap',[0.13*h*(o.bw||1),bl*0.6,10],[0,0,0],c,{r:[Math.PI/2,0,0]}).add('torso','sph',[0.12*h*(o.bw||1)],[0,-0.04*h,0.04*h],c2,{s:[0.9,0.7,1.5]});
  B.part('neck','torso',[0,0.04*h,bl*0.4]);const nl=(o.neckLen||0.6);B.add('neck','cap',[0.06*h,0.18*h*nl],[0,0.08*h*nl,0.08*h*nl],c,{r:[0.8,0,0]});
  B.part('head','neck',[0,0.16*h*nl,0.16*h*nl]);const hs=(o.headS||1)*h;
  if(o.headType==='bird')B.add('head','sph',[0.09*hs],[0,0,0],o.headC??c).add('head','cone',[0.035*hs,0.14*hs,4],[0,-0.02*hs,0.13*hs],o.beak??0xe8b030,{r:[Math.PI/2,0,0]});
  else B.add('head','box',[0.13*hs,0.09*hs,0.2*hs],[0,0,0.06*hs],o.headC??c).add('head','box',[0.11*hs,0.035*hs,0.16*hs],[0,-0.05*hs,0.08*hs],c2).add('head','cone',[0.025*hs,0.12*hs,4],[0.05*hs,0.07*hs,-0.05*hs],o.hornC??0xe8dcc0,{r:[-1.1,0,0]}).add('head','cone',[0.025*hs,0.12*hs,4],[-0.05*hs,0.07*hs,-0.05*hs],o.hornC??0xe8dcc0,{r:[-1.1,0,0]});
  B.add('head','sph',[0.02*hs],[0.05*hs,0.03*hs,0.08*hs],o.eye??0xffd02a,{m:'e'}).add('head','sph',[0.02*hs],[-0.05*hs,0.03*hs,0.08*hs],o.eye??0xffd02a,{m:'e'});
  if(o.crest)for(let i=0;i<3;i++)B.add('head','cone',[0.025*hs,0.12*hs,4],[0,0.07*hs,-0.02*hs-i*0.05*hs],o.crest,{r:[-0.9,0,0],m:o.crestM||'n'});
  B.part('tail','torso',[0,0,-bl*0.45]);B.add('tail','cone',[0.07*h,(o.tailLen||0.45)*h,5],[0,0,-(o.tailLen||0.45)*h*0.5],o.tailC??c,{r:[-Math.PI/2,0,0]});
  if(o.tailFan)for(const a of [-0.5,0,0.5])B.add('tail','shape',[[[0,0],[0.08,-0.28],[-0.08,-0.28]].map(([x,y])=>[x*h,y*h]),0.015*h],[0,0,-0.05*h],o.tailFan,{r:[Math.PI/2,0,a],m:o.fanM||'n'});
  const kind=o.wing||'bat';const wc=o.wingC??(kind==='bird'?c:dk(c,0.8));const sp=o.wingSpan||1;
  for(const [n,s] of [['wingL',1],['wingR',-1]]){B.part(n,'torso',[s*0.1*h,0.06*h,0.04*h]);
    const pts=kind==='bird'?[[0,0.06],[0.3,0.12],[0.62,0.04],[0.55,-0.06],[0.4,-0.14],[0.2,-0.16],[0,-0.12]]:[[0,0.08],[0.32,0.16],[0.7,0.1],[0.55,-0.02],[0.45,-0.16],[0.32,-0.06],[0.2,-0.2],[0,-0.12]];
    B.add(n,'shape',[pts.map(([x,y])=>[s*x*h*sp,y*h*sp]),0.02*h],[0,0,0],wc,{r:[Math.PI/2,0,0],m:o.wingM||'n'});
    if(kind!=='bird')B.add(n,'cyl',[0.012*h,0.012*h,0.7*h*sp,4],[s*0.35*h*sp,0.0,0.08*h*sp],dk(c,0.6),{r:[0,0,Math.PI/2-s*0.12]});}
  if(o.legs!==false)for(const s of[-1,1])B.add('torso','cap',[0.035*h,0.12*h],[s*0.07*h,-0.12*h,-0.05*h],dk(c,0.8),{r:[0.5,0,0]});
  if(o.rider){B.add('torso','rbox',[0.14*h,0.2*h,0.1*h,0.3],[0,0.2*h,-0.02],o.rider).add('torso','sph',[0.06*h],[0,0.36*h,-0.02],o.riderSkin??0x6aa04a);}
  for(const x of o.extras||[])EXTRA[x.split(':')[0]]&&EXTRA[x.split(':')[0]](B,o,h,{tW:0.25*h,tH:0.2*h,tD:0.25*h,nY:0.2*h,col:x.split(':')[1]?parseInt(x.split(':')[1]):null});
  B.meta.stride=o.stride||8;};
// tank: hull + treads + turret (+ twin barrels / spikes)
PLANS.tank=(B,o)=>{const h=o.h||1,c=o.skin??0x6a7a5a,c2=o.skin2??0x3a3a3a;B.part('hips','body',[0,0,0]).part('torso','hips',[0,0,0]);B.part('tread','hips',[0,0,0]);
  for(const s of[-1,1]){B.add('tread','rbox',[0.2*h,0.24*h,0.95*h,0.4],[s*0.34*h,0.13*h,0],c2);for(let i=0;i<4;i++)B.add('tread','cyl',[0.085*h,0.085*h,0.22*h,10],[s*0.34*h,0.11*h,(-0.33+i*0.22)*h],0x2a2a2a,{r:[0,0,Math.PI/2]});
    B.add('tread','box',[0.24*h,0.04*h,0.98*h],[s*0.34*h,0.26*h,0],dk(c,0.8));}
  B.add('torso','rbox',[0.56*h,0.2*h,0.82*h,0.3],[0,0.33*h,0],c).add('torso','box',[0.5*h,0.12*h,0.2*h],[0,0.3*h,0.45*h],dk(c,0.85),{r:[0.5,0,0]});
  B.part('turret','torso',[0,0.5*h,-0.02*h]);B.add('turret','cyl',[0.26*h,0.3*h,0.2*h,10],[0,0,0],c).add('turret','box',[0.2*h,0.1*h,0.16*h],[0,0.13*h,-0.06*h],dk(c,0.8));
  const nb=o.barrels||1;for(let i=0;i<nb;i++){const x=(i-(nb-1)/2)*0.13*h;B.add('turret','cyl',[0.05*h,0.06*h,0.72*h,8],[x,0.02*h,0.45*h],o.barrelC??dk(c,0.6),{r:[Math.PI/2,0,0]}).add('turret','cyl',[0.072*h,0.072*h,0.1*h,8],[x,0.02*h,0.82*h],0x2a2a2a,{r:[Math.PI/2,0,0]});}
  if(o.spikes)for(const s of[-1,1])for(let i=0;i<3;i++)B.add('torso','cone',[0.035*h,0.14*h,4],[s*0.3*h,0.4*h,(0.25-i*0.25)*h],0xd8d8d8,{r:[0,0,-s*1.2]});
  if(o.eye)B.add('turret','box',[0.16*h,0.04*h,0.02],[0,0.08*h,0.27*h],o.eye,{m:'e'});
  if(o.exhaust)B.add('torso','cyl',[0.04*h,0.05*h,0.22*h,6],[0.18*h,0.5*h,-0.36*h],0x3a3a3a);
  B.meta.stride=14;};
// airship / zeppelin / barge
PLANS.airship=(B,o)=>{const h=o.h||1,c=o.skin??0x8a6a4a,c2=o.skin2??0xd8c090;B.meta.hover=true;B.part('hips','body',[0,0.3*h,0]).part('torso','hips',[0,0,0]);
  B.add('torso','sph',[0.4*h,16,10],[0,0.75*h,0],c2,{s:[0.9,0.8,1.5]});for(const z of [-0.3,0.3])B.add('torso','tor',[0.37*h,0.03*h,6,20],[0,0.75*h,z*h],c,{s:[0.95,0.85,1]});
  B.add('torso','cone',[0.16*h,0.3*h,10],[0,0.75*h,0.62*h],c,{r:[Math.PI/2,0,0]});for(let i=0;i<4;i++){const a=i*Math.PI/2;B.add('torso','box',[0.04*h,0.34*h,0.3*h],[Math.sin(a)*0.22*h,0.75*h+Math.cos(a)*0.22*h,-0.62*h],c,{r:[0,0,-a]});}
  B.add('torso','rbox',[0.34*h,0.2*h,0.62*h,0.3],[0,0.2*h,0],c);for(const z of [-0.18,0,0.18])for(const s of[-1,1])B.add('torso','box',[0.01,0.06*h,0.08*h],[s*0.175*h,0.23*h,z*h],0xffe07a,{m:'e'});
  for(const s of[-1,1])B.add('torso','cyl',[0.04*h,0.05*h,0.3*h,6],[s*0.2*h,0.12*h,0.18*h],0x2a2a2a,{r:[Math.PI/2,0,0]});
  for(const s of[-1,1])B.add('torso','cyl',[0.012*h,0.012*h,0.36*h,4],[s*0.14*h,0.44*h,0],0x3a3a3a,{r:[0,0,s*0.3]});
  if(o.armor){B.add('torso','rbox',[0.5*h,0.12*h,0.9*h,0.3],[0,0.04*h,0],dk(c,0.8));for(const s of[-1,1])for(let i=0;i<3;i++)B.add('torso','cone',[0.03*h,0.12*h,4],[s*0.26*h,0.04*h,(0.3-i*0.3)*h],0xd8d8d8,{r:[0,0,-s*1.3]});}
  B.part('prop','torso',[0,0.2*h,-0.36*h]);for(let i=0;i<2;i++)B.add('prop','box',[0.5*h,0.06*h,0.03*h],[0,0,0],0x3a3a3a,{r:[0,0,i*1.57]});
  B.meta.stride=6;};
