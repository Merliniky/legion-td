// HQ pilot: real rigged + animated CC0 models (KayKit Adventurers / Quaternius, see data/asset_licenses.md)
// One merged SkinnedMesh per unit (1 draw call), AnimationMixer crossfades, hit-frame synced attacks,
// move-speed-scaled walk/run, smooth turning, hit flash + squash, death clip + sink/fade.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as skClone} from 'three/addons/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V='?v=1';const HK=1.22; // global HQ size vs the lane (tiles)
// ---------- manifest ----------
const HUM={anim:'kk_knight',idle:'Idle',walk:'Walking_A',run:'Running_A',hit:'Hit_A',die:['Death_A','Death_B'],walkK:1.05,runK:1.75,turn:10};
const MELEE1={atk:[['1H_Melee_Attack_Chop',0.42],['1H_Melee_Attack_Slice_Diagonal',0.38]]};
const R={
  // ---- Paladin (human alliance) ----
  h09L:{...HUM,...MELEE1,f:'kk_barbarian',props:['1H_Axe'],h:1.02,tint:0xf4e8d8},
  h09H:{...HUM,...MELEE1,f:'kk_barbarian',props:['1H_Axe','Barbarian_Round_Shield','Barbarian_Hat','Barbarian_Cape'],h:1.14},
  h09W:{...HUM,f:'kk_rogue',props:['2H_Crossbow'],h:1.06,atk:[['2H_Ranged_Shoot',0.36]],muzzle:'bolt'},
  h09M:{...HUM,f:'kk_rogue_hooded',props:['2H_Crossbow','Rogue_Cape'],h:1.2,tint:0xfff2d0,glow:0xffd75e,atk:[['2H_Ranged_Shoot',0.36]],muzzle:'bolt'},
  h09N:{...HUM,...MELEE1,f:'kk_knight',props:['1H_Sword','Round_Shield','Knight_Helmet'],h:1.12},
  h09O:{...HUM,f:'kk_knight',props:['1H_Sword','Badge_Shield','Knight_Helmet','Knight_Cape'],h:1.32,tint:0xfff6e4,atk:[['1H_Melee_Attack_Slice_Diagonal',0.38],['1H_Melee_Attack_Chop',0.42]]},
  h09R:{...HUM,f:'kk_mage',props:['1H_Wand','Spellbook'],h:1.08,tint:0xf8f4ff,atk:[['Spellcast_Shoot',0.4]],muzzle:'magic'},
  h09S:{...HUM,f:'kk_mage',props:['2H_Staff','Mage_Hat','Mage_Cape'],h:1.3,tint:0xfff0d8,glow:0xffe7a0,atk:[['Spellcast_Shoot',0.4]],muzzle:'magic'},
  h09T:{f:'q_horse',h:1.0,yaw:Math.PI/2,idle:'Idle',walk:'Walk',run:'Gallop',hit:'Idle_HitReact_Left',die:['Death'],atk:[['Attack_Headbutt',0.42],['Attack_Kick',0.5]],walkK:1.3,runK:3.2,turn:7,
        rider:{f:'kk_knight',props:['1H_Sword','Round_Shield','Knight_Helmet'],h:1.0,bone:'Torso',y:-0.42,z:0}},
  h09U:{f:'q_horse_white',h:1.08,yaw:Math.PI/2,idle:'Idle',walk:'Walk',run:'Gallop',hit:'Idle_HitReact_Right',die:['Death'],atk:[['Attack_Headbutt',0.42],['Attack_Kick',0.5]],walkK:1.3,runK:3.2,turn:7,glow:0xffd75e,
        rider:{f:'kk_knight',props:['2H_Sword','Knight_Helmet','Knight_Cape'],h:1.05,bone:'Torso',y:-0.42,z:0,tint:0xfff0c0}},
  h0A3:{f:'q_dragon',h:0.8,idle:'Flying_Idle',walk:'Fast_Flying',run:'Fast_Flying',hit:'HitReact',die:['Death'],atk:[['Headbutt',0.5]],walkK:3,runK:3,turn:6,fly:true,mc:{0:0x4a7ae8,1:0xf0d070},muzzle:'magic'},
  h0A0:{f:'q_dragon_evo',h:1.02,idle:'Flying_Idle',walk:'Fast_Flying',run:'Fast_Flying',hit:'HitReact',die:['Death'],atk:[['Punch',0.55]],walkK:3,runK:3,turn:6,fly:true,mc:{0:0xf2e2b0,1:0xffd04a},glow:0xffe7a0,muzzle:'magic'},
  // ---- waves 1-5 ----
  h002:{f:'q_crab',h:0.5,idle:'Idle',walk:'Walk',hit:'HitRecieve',die:['Death'],atk:[['Bite_InPlace',0.32]],walkK:1.6,turn:9},
  h000:{f:'q_frog',h:0.72,idle:'Idle',walk:'Walk',run:'Run',hit:'HitReact',die:['Death'],atk:[['Punch',0.34]],walkK:1.0,runK:1.8,turn:9,mc:{1:0x3f8f7a,0:0xc8e0a8}},
  h005:{f:'q_spider',h:0.5,idle:'Spider_Idle',walk:'Spider_Walk',die:['Spider_Death'],atk:[['Spider_Attack',0.36]],walkK:2.2,turn:8,mc:{0:0xc89a50,1:0x5a3a1a}},
  h001:{f:'q_hedgehog',h:0.55,idle:'Idle',die:['Death'],atk:[['Attack',0.16]],hop:true,turn:9,tint:0xd8b890},
  h00I:{f:'q_pigeon',h:0.5,idle:'Idle',walk:'Walk',hit:'HitRecieve',die:['Death'],atk:[['Bite_Front',0.2]],walkK:1.4,turn:10,mc:{0:0x7a4a28}},
};
export const HQ_IDS=Object.keys(R);
export const hqHas=id=>!!R[id];
export const hqRecipe=id=>R[id];
// ---------- loading ----------
const loader=new GLTFLoader();const FILES={};
function loadFile(f){return FILES[f]||(FILES[f]=new Promise((res,rej)=>loader.load(`assets/hq/${f}.glb${V}`,res,undefined,rej)));}
const TPL={},TPLP={};let MATBASE=null;
// clips: strip horizontal root drift so units never slide away from their sim position
function cleanClip(c){c=c.clone();for(const t of c.tracks){if(!t.name.endsWith('.position'))continue;const b=t.name.split('.')[0];if(!/^(root|hips|Body|Root|RootNode)$/i.test(b))continue;
  const v=t.values,n=v.length/3;if(n<2)continue;for(const ax of [0,2]){let lo=1e9,hi=-1e9;for(let i=0;i<n;i++){lo=Math.min(lo,v[i*3+ax]);hi=Math.max(hi,v[i*3+ax]);}const d=Math.abs(v[(n-1)*3+ax]-v[ax]);
    if(hi-lo>1e-4&&d>0.6*(hi-lo)){const v0=v[ax];for(let i=0;i<n;i++)v[i*3+ax]=v0;}}}return c;}
const CLIPS={};
async function clipsOf(f){if(CLIPS[f])return CLIPS[f];const g=await loadFile(f);const m={};for(const c of g.animations)m[c.name]=cleanClip(c);return CLIPS[f]=m;}
// merge every visible part (skinned body parts + rigid props on bones) into one SkinnedMesh
function buildMerged(scene,rec){scene.updateMatrixWorld(true);let host=null;scene.traverse(o=>{if(o.isSkinnedMesh&&!host)host=o;});const sk=host.skeleton;sk.pose();scene.updateMatrixWorld(true);
  const B0i=host.bindMatrix.clone().invert();const props=new Set(rec.props||[]);const geos=[];let tex=null;const kill=[];
  const mats=[];scene.traverse(o=>{if(!o.isMesh)return;const nm=(o.name||'').replace(/_\d+$/,'');const pn=o.parent&&o.parent.isGroup&&!o.parent.isBone?o.parent.name:'';
    const isProp=!o.isSkinnedMesh;kill.push(o);if(isProp&&!props.has(o.name)&&!props.has(pn))return;
    let g=o.geometry.clone();for(const k of Object.keys(g.attributes))if(!['position','normal','uv','skinIndex','skinWeight'].includes(k))g.deleteAttribute(k);
    const n=g.attributes.position.count;const mi=mats.indexOf(o.material)<0?(mats.push(o.material),mats.length-1):mats.indexOf(o.material);
    if(o.material.map)tex=o.material.map;
    if(o.isSkinnedMesh){g.applyMatrix4(B0i.clone().multiply(o.bindMatrix));
      const si=g.attributes.skinIndex,sw=g.attributes.skinWeight;const I=new Uint16Array(n*4),Wt=new Float32Array(n*4);
      // remap bone indices (parts share the skeleton in these packs, but map by bone object to be safe)
      const map=o.skeleton.bones.map(b=>sk.bones.indexOf(b));for(let i=0;i<n;i++)for(let k=0;k<4;k++){I[i*4+k]=Math.max(0,map[si.getComponent(i,k)]);Wt[i*4+k]=sw.getComponent(i,k);}
      g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(I,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Wt,4));}
    else{g.applyMatrix4(B0i.clone().multiply(o.matrixWorld));let p=o.parent,bi=-1;while(p&&bi<0){bi=sk.bones.indexOf(p);p=p.parent;}bi=Math.max(0,bi);
      const I=new Uint16Array(n*4),Wt=new Float32Array(n*4);for(let i=0;i<n;i++){I[i*4]=bi;Wt[i*4]=1;}g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(I,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Wt,4));}
    // per-vertex color = material color (lets flat-colored multi-material Quaternius models become 1 draw call)
    const c=new THREE.Color(rec.mc&&rec.mc[mi]!=null?rec.mc[mi]:o.material.color);const C=new Float32Array(n*3);for(let i=0;i<n;i++){C[i*3]=c.r;C[i*3+1]=c.g;C[i*3+2]=c.b;}g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
    if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(n*2),2));
    if(!g.index){const ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;g.setIndex(new THREE.BufferAttribute(ix,1));}
    geos.push(g);});
  const geo=mergeGeometries(geos,false);for(const g of geos)g.dispose();
  const mat=new THREE.MeshStandardMaterial({map:tex,vertexColors:true,roughness:0.78,metalness:0.0,color:rec.tint!=null?rec.tint:0xffffff});
  const sm=new THREE.SkinnedMesh(geo,mat);sm.name='hqMesh';sm.position.copy(host.position);sm.quaternion.copy(host.quaternion);sm.scale.copy(host.scale);host.parent.add(sm);sm.bind(sk,host.bindMatrix);
  for(const o of kill)o.parent&&o.parent.remove(o);sm.castShadow=true;sm.receiveShadow=false;sm.frustumCulled=false;return sm;}
async function buildTpl(id,rec){const g=await loadFile(rec.f);const clips=await clipsOf(rec.anim||rec.f);const scene=skClone(g.scene);const sm=buildMerged(scene,rec);
  // bind-pose bounds → normalise height, feet at y=0
  scene.updateMatrixWorld(true);const bb=new THREE.Box3();const p=new THREE.Vector3();const pos=sm.geometry.attributes.position;const M=sm.matrixWorld;
  for(let i=0;i<pos.count;i+=3){p.fromBufferAttribute(pos,i).applyMatrix4(M);bb.expandByPoint(p);}
  const k=rec.h*HK/Math.max(1e-6,bb.max.y-bb.min.y);const wrap=new THREE.Group();const inner=new THREE.Group();inner.add(scene);inner.scale.setScalar(k);inner.position.y=-bb.min.y*k;inner.rotation.y=rec.yaw||0;wrap.add(inner);
  const t={id,rec,wrap,clips,h:rec.h*HK,width:Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z)*k};
  if(rec.rider){const rr={...rec.rider,anim:'kk_knight'};t.rider=await buildTpl(id+'_rider',rr);t.rider.sit=true;}
  // per-clip hit times → sim wind-up (core reads d.wind so damage lands on the clip's hit frame)
  const a0=rec.atk&&clips[rec.atk[0][0]];t.atkDur=a0?a0.duration:0.6;t.hitS=rec.atk?rec.atk[0][1]:0.3;
  return t;}
export function hqLoad(id){const rec=R[id];if(!rec)return Promise.resolve(null);return TPLP[id]||(TPLP[id]=buildTpl(id,rec).then(t=>{TPL[id]=t;return t;}).catch(e=>{console.warn('hq',id,e);return null;}));}
export const hqReady=id=>!!TPL[id];
export function hqPreload(ids){return Promise.all(ids.filter(hqHas).map(hqLoad));}
// wind-up the sim should use for this unit (hit frame at ~1.15x clip speed, never longer than ~half the cooldown)
export function hqWind(id,cd){const t=TPL[id];const rec=R[id];if(!rec||!rec.atk)return null;const hitS=t?t.hitS:rec.atk[0][1];return Math.max(0.12,Math.min(0.45,hitS/1.15,cd*0.5));}
// ---------- instances ----------
function mkInst(t){const root=skClone(t.wrap);let mesh=null;root.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});mesh.material=mesh.material.clone();
  const mix=new THREE.AnimationMixer(root);const A={};const act=n=>{if(!n||!t.clips[n])return null;if(A[n])return A[n];const a=mix.clipAction(t.clips[n]);A[n]=a;return a;};
  const I={t,root,mesh,mix,act,cur:null,state:'',yaw:0,ph:Math.random()*10,sq:0,flash:0,deadT:-1,lastX:null,lastZ:null,spd:0,atkUntil:0,hitCd:0,hitUntil:0,time:0};
  if(t.rider){const r=mkInst(t.rider);I.rider=r;root.add(r.root);r.play(t.rider.rec.sit||'Sit_Chair_Idle',0);let bone=null;root.traverse(o=>{if(o.isBone&&o.name===t.rec.rider.bone&&!bone&&!r.root.getObjectById(o.id))bone=o;});I.seat=bone;}
  // a second action per clip lets back-to-back attacks crossfade instead of snapping to frame 0
  const alt=n=>{const k=n+'#2';if(A[k])return A[k];return A[k]=mix.clipAction(t.clips[n].clone());};
  I.play=(n,fade=0.18,once=false,ts=1)=>{let a=act(n);if(!a)return null;if(I.cur===a&&!once){a.timeScale=ts;return a;}if(once&&I.cur&&I.cur.getClip().name===n)a=I.cur===a?alt(n):act(n);
    a.reset();a.enabled=true;a.setEffectiveWeight(1);a.timeScale=ts;if(once){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}else a.setLoop(THREE.LoopRepeat,Infinity);
    if(I.cur&&I.cur!==a)a.crossFadeFrom(I.cur,fade,false);a.play();I.cur=a;return a;};
  I.play(t.rec.idle,0);if(I.cur)I.cur.time=Math.random()*I.cur.getClip().duration;
  return I;}
export function hqMake(id){const t=TPL[id];if(!t)return null;return mkInst(t);}
const _w=new THREE.Vector3();
// st: {dt, x, z, moving, dead, yaw, hover}
export function hqUpdate(I,st){const t=I.t,rec=t.rec,dt=st.dt;I.time+=dt;
  // measured ground speed (world units / s), smoothed
  if(I.lastX!=null&&dt>0){const d=Math.hypot(st.x-I.lastX,st.z-I.lastZ)/dt;I.spd+= (Math.min(8,d)-I.spd)*Math.min(1,dt*8);}I.lastX=st.x;I.lastZ=st.z;
  if(st.dead){if(I.deadT<0){I.deadT=0;const dn=rec.die[(Math.random()*rec.die.length)|0];if(!I.play(dn,0.12,true,1.1)){I.cur&&I.cur.stop();}I.mesh.material.transparent=true;
      if(I.rider){I.rider.deadT=0;I.rider.play('Death_A',0.12,true,1);I.rider.mesh.material.transparent=true;}}
    I.deadT+=dt;const f=Math.max(0,(I.deadT-1.0)/0.9);I.root.position.y=(st.hover||0)*(1-Math.min(1,I.deadT*1.5))-f*0.35*t.h;
    const op=1-Math.min(1,f);I.mesh.material.opacity=op;if(I.rider)I.rider.mesh.material.opacity=op;I.mesh.material.emissive.setRGB(0,0,0);
  }else{
    if(I.deadT>=0){I.deadT=-1;I.mesh.material.transparent=false;I.mesh.material.opacity=1;I.mix.stopAllAction();I.cur=null;I.play(rec.idle,0);I.atkUntil=I.hitUntil=0;
      if(I.rider){I.rider.mix.stopAllAction();I.rider.cur=null;I.rider.play('Sit_Chair_Idle',0);I.rider.mesh.material.transparent=false;I.rider.mesh.material.opacity=1;}}
    const attacking=I.time<I.atkUntil;
    if(!attacking&&I.time>=I.hitUntil){const mv=st.moving&&I.spd>0.15;
      if(mv&&(rec.walk||rec.run)){const h=t.h;const useRun=rec.run&&I.spd>1.1*h*rec.walkK/ (t.clips[rec.walk]?t.clips[rec.walk].duration:1)*1.25;const cn=useRun?rec.run:rec.walk;const cl=t.clips[cn];
        const native=(useRun?rec.runK:rec.walkK)*h/cl.duration;const ts=Math.max(0.55,Math.min(2.4,I.spd/native));I.play(cn,0.2,false,ts);I.state='move';}
      else{I.play(rec.idle,0.25,false,1);I.state='idle';}}
    // hop for models without a walk clip (quilbeast)
    let hop=0;if(rec.hop&&st.moving&&I.spd>0.15){I.ph+=dt*I.spd*9;hop=Math.abs(Math.sin(I.ph))*0.12*t.h;}
    const bob=rec.fly?Math.sin(I.time*2.4+I.ph)*0.06:0;
    I.root.position.y=(st.hover||0)+hop+bob;
    I.flash=Math.max(0,I.flash-dt*7);I.mesh.material.emissive.setRGB(I.flash*0.9,I.flash*0.9,I.flash*0.85);
    if(I.rider)I.rider.mesh.material.emissive.copy(I.mesh.material.emissive);}
  // smooth turning
  let dy=st.yaw-I.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));I.yaw+=dy*Math.min(1,dt*(rec.turn||9));I.root.rotation.y=I.yaw;
  // squash (no displacement)
  I.sq=Math.max(0,I.sq-dt*6);const s=st.k||1,q=Math.sin(I.sq*Math.PI)*0.12;I.root.scale.set(s*(1+q*0.6),s*(1-q),s*(1+q*0.6));
  I.mix.update(dt);
  if(I.rider){I.rider.mix.update(dt);if(I.seat){I.seat.getWorldPosition(_w);I.root.worldToLocal(_w);I.rider.root.position.set(_w.x,_w.y+(rec.rider.y||0)*t.h,_w.z+(rec.rider.z||0)*t.h);}}}
// attack: play the clip so its hit frame lands exactly when the sim applies damage (wind seconds from now)
export function hqAttack(I,wind,cd){const rec=I.t.rec;if(!rec.atk||I.deadT>=0)return 0;const [n,hitS]=rec.atk[(Math.random()*rec.atk.length)|0];const cl=I.t.clips[n];if(!cl)return 0;
  const ts=Math.max(0.6,Math.min(3,hitS/Math.max(0.05,wind)));I.play(n,0.1,true,ts);const dur=cl.duration/ts;I.atkUntil=I.time+Math.min(dur,Math.max(cd||dur,wind+0.15));
  if(I.rider){const rn=n.includes('Kick')?'1H_Melee_Attack_Slice_Diagonal':'1H_Melee_Attack_Chop';/* rider keeps sitting; small lean via squash */}
  return ts;}
export function hqHit(I){I.flash=1;I.sq=1;const rec=I.t.rec;if(I.deadT>=0)return;
  if(rec.hit&&I.time>=I.atkUntil&&I.time>I.hitCd&&I.state!=='move'){const cl=I.t.clips[rec.hit];if(cl){I.play(rec.hit,0.08,true,1.3);I.hitUntil=I.time+cl.duration/1.3*0.85;I.hitCd=I.time+1.2;}}}
export function hqDispose(I){I.mix.stopAllAction();I.mesh.material.dispose();if(I.rider)hqDispose(I.rider);}
export const hqTpl=id=>TPL[id];
