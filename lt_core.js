// 军团战争 · Legion TD Mega 3.41 复刻 — pure game logic (no rendering).
// Browser: window.LT (call LT.load(json) first) ; node: const LT=require('./lt_core.js') (auto-loads data/roster_mega.json)
(function(root){'use strict';
// ---------------- board / units of measure ----------------
const W=9,H=18;                          // lane grid; row 0 = top (spawn); king at bottom
const BUILD={c0:0,c1:8,r0:2,r1:11};      // build zone rows 2..11 (90 cells)
const KING_POS={x:4.5,y:16.4},LEAK_Y=13.2;
const TILE=128;                          // 1 grid tile = 128 WC3 units (a 2×2 Legion TD tower footprint)
const MAXW=31;
// ---------------- original Mega 3.41 gameplay constants (war3mapMisc) ----------------
const ATK={normal:'普通',pierce:'穿刺',magic:'魔法',siege:'攻城',chaos:'混乱',hero:'英雄',spells:'法术'};
const ARM={light:'轻甲',medium:'中甲',heavy:'重甲',fortified:'城甲',unarmored:'无甲',hero:'英雄甲'};
const COLS=['light','medium','heavy','fortified','normal','hero','divine','unarmored'];
let TBL=null;
function mult(atk,arm){const r=TBL[atk]||TBL.normal;const i=COLS.indexOf(arm);return i<0?1:r[i];}
function armorK(a){return a>=0?1/(1+0.06*a):2-Math.pow(0.94,-a);}   // WC3 DefenseArmor 0.06
// ---------------- data (filled by load) ----------------
const D={units:{},races:{},waves:[],summons:[],summoned:{},king:null,eco:null};
const RACES=['Arctic','Beast','Demi-Human','Element','Elf','Ghost','Goblin','Hybrid','Marine','Mech','Nature','Paladin','Prophet','Shadow','Undead','Orc'];
let LINE_POOL=null;   // tier -> [base unit ids of all real races] (Prophet / Hybrid)
function conv(o){// WC3 record -> engine spec (tiles, seconds)
  const ranged=o.weapon&&o.weapon!=='normal';
  return Object.assign({},o,{rng:Math.max(0.55,(o.range||90)/TILE),ranged,spd:(o.move||270)/TILE,dmin:o.dmg[0],dmax:o.dmg[1],cd:o.cd||1,atk:o.attackType,arm:o.armorType,fx:o.fx||[]});}
function load(J){
  TBL={};for(const k of ['magic','normal','pierce','siege','chaos','spells','hero'])TBL[k]=J.damageTable[k];
  for(const id in J.units)D.units[id]=conv(J.units[id]);
  D.races=J.races;D.waves=[null].concat(J.waves.map(w=>conv(w)));
  D.summons=J.summons.map(conv);D.summonById={};for(const s of D.summons)D.summonById[s.id]=s;
  for(const id in J.summoned){const s=J.summoned[id];D.summoned[id]=conv({...s,dmg:[s.dmgMin,s.dmgMax],attackType:s.attackType,armorType:s.armorType,cd:s.cooldown,fx:s.fx||[]});}
  D.king=J.king;D.eco=J.economy;D.modes=J.modes||{X3:{countMul:1,bountyMul:1}};
  LINE_POOL={};for(const r of RACES){const R=D.races[r];if(!R||!R.lines||r==='Hybrid')continue;R.lines.forEach((id,i)=>{(LINE_POOL[i+1]=LINE_POOL[i+1]||[]).push(id);});}
  api.loaded=true;return api;}
// ---------------- economy (3.41) ----------------
const ECO={gold:270,lumber:90,food:7,wispGold:50,wispMax:7,wispLumber:2,wispInt:3,farmGold:24,farmLumber:80,farmFood:8,farmMax:10,
  kingUpLumber:80,kingUpIncome:3,
  bonus:[0,11,12,13,14,16,18,20,23,26,30,35,40,45,50,55,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,200],
  prep:w=>40+Math.floor(w/2)};
function waveBonus(w){const b=ECO.bonus[Math.min(w,30)]||0;return (w===10||w===20)?b*2:b;}
function ljCost(n){return n<=8?{g:60+20*(n-1),l:60+20*(n-1)}:{g:200,l:200};}   // R003 (1..8) / R00H (9..15)
// ---------------- rng ----------------
function mkRng(seed){let s=(seed>>>0)||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
let NID=1;
// ---------------- game state ----------------
function newKing(owner){const K=D.king;return {id:'K'+owner,isKing:true,side:'k',owner,hp:K.hp,maxHp:K.hp,alive:true,x:KING_POS.x,y:KING_POS.y,radius:0.9,armor:K.armor,arm:'hero',atk:'hero',
  dmin:K.dmg[0],dmax:K.dmg[1],cd:K.cd,cd0:K.cd,armor0:K.armor,rng:K.range/TILE,regen:K.regen,atkT:0,lv:{hp:0,attack:0,regen:0},st:{},mana:0,maxMana:K.mana||1000,manaRegen:2,ab:[],cds:{},immAcc:0};}
function newLane(owner){return {owner,units:[],creeps:[],summ:[],king:newKing(owner),pend:[],events:[],leaks:0,t:0,cleared:true,spawnQ:[]};}
function newPlayer(p,race,g){return {race,gold:ECO.gold,lumber:ECO.lumber,income:0,food:0,foodCap:ECO.food,wisps:1,wispT:0,lj:0,farm:0,
  stock:Object.fromEntries(D.summons.map(s=>[s.id,{n:s.stockMax||1,t:0}])),rerolls:0,pool:null,sent:0,kills:0,leaked:0,value:0};}
function newGame(opt){opt=opt||{};const seed=opt.seed||((Math.random()*1e9)|0);const g={seed,mode:(opt.mode==='X1'?'X1':'X3'),wave:0,phase:'build',timer:ECO.prep(1),t:0,over:null,lanes:[newLane(0),newLane(1)],sendQ:[[],[]],log:[]};
  g.rnd=mkRng(seed);
  const pickRace=r=>{if(!r||r==='Random'){const c=RACES.filter(x=>x!=='Hybrid'&&x!=='Prophet');return c[Math.floor(g.rnd()*c.length)];}return r;};
  g.P=[newPlayer(0,pickRace(opt.race),g),newPlayer(1,pickRace(opt.aiRace),g)];
  for(let p=0;p<2;p++){g.P[p].food=1;if(g.P[p].race==='Prophet')rollProphet(g,p,true);}
  return g;}
// ---------------- roster helpers ----------------
function raceLines(g,p){const P=g.P[p];if(P.race==='Prophet')return P.pool;return D.races[P.race].lines;}
function rollProphet(g,p,free){const P=g.P[p];if(!free){const n=P.rerolls+1;if(n>5)return {ok:false,reason:'换兵次数已用完'};const c=50*n;
    if(P.gold<c||P.lumber<c)return {ok:false,reason:`需要 ${c} 金 / ${c} 木`};P.gold-=c;P.lumber-=c;P.rerolls=n;}
  P.pool=[1,2,3,4,5,6].map(t=>{const L=LINE_POOL[t];return L[Math.floor(g.rnd()*L.length)];});return {ok:true};}
function unitSpec(id){return D.units[id];}
function upgradesOf(id){const u=D.units[id];return u?u.upgrades:[];}
// ---------------- placement / upgrade / sell ----------------
function cellFree(L,c,r){return c>=BUILD.c0&&c<=BUILD.c1&&r>=BUILD.r0&&r<=BUILD.r1&&!L.units.some(u=>u.c===c&&u.r===r);}
function mkFighter(id,c,r,owner){const d=D.units[id];return {id:NID++,side:'u',owner,type:id,d,c,r,x:c+0.5,y:r+0.5,hp:d.hp,maxHp:d.hp,mana:d.mana0||0,atkT:0,alive:true,value:d.gold,fresh:true,inactive:false,tgt:null,radius:d.fly?0.3:0.36,fly:d.fly,st:{},cds:{}};}
function canPlace(g,p,id,c,r){const L=g.lanes[p],P=g.P[p],d=D.units[id];if(g.over)return '游戏已结束';if(!d||d.from)return '无效单位';
  if(!raceLines(g,p).includes(id))return '不属于你的种族';if(P.gold<d.gold)return '金币不足';if(P.food+(d.food||1)>P.foodCap)return '人口不足（建造/升级农场）';if(!cellFree(L,c,r))return '这里不能建造';return '';}
function place(g,p,id,c,r){const why=canPlace(g,p,id,c,r);if(why)return {ok:false,reason:why};const L=g.lanes[p],P=g.P[p];let d=D.units[id];
  P.gold-=d.gold;P.food+=d.food||1;let real=id;
  if(P.race==='Hybrid'){// Morph: becomes a random base unit of the same tier (the morph's price is kept as its value)
    const tier=D.races.Hybrid.lines.indexOf(id)+1;const L2=LINE_POOL[tier];real=L2[Math.floor(g.rnd()*L2.length)];}
  const u=mkFighter(real,c,r,p);u.value=d.gold;u.morph=real!==id?id:null;if(u.morph){P.food+=(D.units[real].food||1)-(d.food||1);}
  if(g.phase==='battle'){u.inactive=true;u.alive=false;}L.units.push(u);P.value+=d.gold;L.events.push({k:'place',u});return {ok:true,u};}
function upgrade(g,p,uid,to){const L=g.lanes[p],P=g.P[p],u=L.units.find(x=>x.id===uid);if(!u)return {ok:false,reason:'找不到单位'};
  const ups=u.d.upgrades||[];if(!ups.length)return {ok:false,reason:'已是最高级'};to=to||ups[0];if(!ups.includes(to))return {ok:false,reason:'无效升级'};
  if(g.phase==='battle'&&!u.inactive)return {ok:false,reason:'战斗中无法升级'};const nd=D.units[to];const cost=upCost(u.d,nd);if(P.gold<cost)return {ok:false,reason:'金币不足'};
  const df=(nd.food||1)-(u.d.food||1);if(P.food+df>P.foodCap)return {ok:false,reason:'人口不足（升级农场）'};
  P.gold-=cost;P.food+=df;u.type=to;u.d=nd;u.maxHp=u.hp=nd.hp;u.mana=nd.mana0||0;u.value+=cost;P.value+=cost;u.fly=nd.fly;L.events.push({k:'upgrade',u});return {ok:true,u};}
// WC3 'upgrade to': the tower's listed gold is its total value; upgrading charges the difference (matches Mega Book build orders)
function upCost(a,b){return Math.max(0,(b.gold||0)-(a.gold||0));}
function sellValue(g,u){const dl=has(u,'delicacy');return u.fresh?u.value:Math.floor(u.value*(dl?dl.v:0.5));}
function sell(g,p,uid){const L=g.lanes[p],P=g.P[p],i=L.units.findIndex(x=>x.id===uid);if(i<0)return {ok:false,reason:'找不到单位'};const u=L.units[i];
  if(g.phase==='battle'&&!u.inactive)return {ok:false,reason:'战斗中无法出售'};const v=sellValue(g,u);P.gold+=v;P.food-=u.d.food||1;P.value-=u.value;L.units.splice(i,1);L.events.push({k:'sell',u,v});return {ok:true,v};}
// ---------------- economy actions ----------------
function buyWisp(g,p){const P=g.P[p];if(P.wisps>=ECO.wispMax)return {ok:false,reason:'小精灵已达上限 7'};if(P.gold<ECO.wispGold)return {ok:false,reason:'金币不足'};if(P.food+1>P.foodCap)return {ok:false,reason:'人口不足'};
  P.gold-=ECO.wispGold;P.wisps++;P.food++;return {ok:true};}
function buyFarm(g,p){const P=g.P[p];if(P.farm>=ECO.farmMax)return {ok:false,reason:'农场已满级'};if(P.gold<ECO.farmGold||P.lumber<ECO.farmLumber)return {ok:false,reason:`需要 ${ECO.farmGold} 金 + ${ECO.farmLumber} 木`};
  P.gold-=ECO.farmGold;P.lumber-=ECO.farmLumber;P.farm++;P.foodCap+=ECO.farmFood;return {ok:true};}
function buyLumberjack(g,p){const P=g.P[p];if(P.lj>=15)return {ok:false,reason:'伐木已满级'};const c=ljCost(P.lj+1);if(P.gold<c.g||P.lumber<c.l)return {ok:false,reason:`需要 ${c.g} 金 + ${c.l} 木`};
  P.gold-=c.g;P.lumber-=c.l;P.lj++;return {ok:true};}
const KUP_MAX={hp:20,attack:30,regen:20};
function kingUpgrade(g,p,kind){const P=g.P[p],k=g.lanes[p].king;kind=kind||'hp';if(k.lv[kind]>=KUP_MAX[kind])return {ok:false,reason:'已满级'};if(P.lumber<ECO.kingUpLumber)return {ok:false,reason:'木材不足（80）'};
  P.lumber-=ECO.kingUpLumber;P.income+=ECO.kingUpIncome;const n=++k.lv[kind];
  if(kind==='hp'){const add=425+25*n;k.maxHp+=add;k.hp+=add;}else if(kind==='attack'){k.dmin+=10;k.dmax+=10;}else k.regen+=5;
  g.lanes[p].events.push({k:'kingup',kind});return {ok:true};}
function sendSummon(g,p,id){const s=D.summonById[id],P=g.P[p];if(!s)return {ok:false,reason:'无效'};if(g.over)return {ok:false,reason:'游戏已结束'};
  const st=P.stock[id];if(st.n<1)return {ok:false,reason:'库存补充中'};if(P.lumber<s.lumber)return {ok:false,reason:'木材不足'};
  P.lumber-=s.lumber;P.income+=s.income;st.n--;g.sendQ[p].push(id);P.sent+=s.lumber;return {ok:true};}
// ---------------- waves ----------------
function waveDef(w){return D.waves[Math.max(1,Math.min(w,MAXW))];}
function mkCreep(d,x,y,owner,kind,bm){return {id:NID++,side:'c',type:d.id,d,x,y,hp:d.hp,maxHp:d.hp,mana:d.mana0||0,atkT:0.3,alive:true,tgt:null,merc:kind==='m',summon:kind==='s',boss:!!d.boss,fly:!!d.fly,
  radius:d.boss?0.62:d.fly?0.3:0.34,owner,st:{},cds:{},bounty:Math.round((d.bounty||0)*(bm||1))};}
function startWave(g){if(g.phase!=='build'||g.over)return;g.wave++;g.phase='battle';g.timer=0;const wd=waveDef(g.wave);
  for(let p=0;p<2;p++){const L=g.lanes[p];L.creeps=[];L.summ=[];L.pend=[];L.t=0;L.cleared=false;L.leaks=0;L.spawnQ=[];
    for(const u of L.units){u.inactive=false;u.alive=true;u.fresh=false;u.hp=u.maxHp;u.mana=u.d.mana0||0;u.x=u.c+0.5;u.y=u.r+0.5;u.tgt=null;u.atkT=0.1+g.rnd()*0.3;u.st={};u.cds={};}
    const M=D.modes[g.mode]||{countMul:1,bountyMul:1};const cnt=Math.max(1,Math.round(wd.count*M.countMul));L.bountyMul=M.bountyMul;
    const dt=g.wave===31?0.5:0.1;for(let i=0;i<cnt;i++)L.spawnQ.push({t:i*dt,d:wd,kind:'c'});
    kingGrow(g,L.king);u_guard(L);
    const q=g.sendQ[1-p];const t0=cnt*dt+1.2;q.forEach((id,i)=>L.spawnQ.push({t:t0+i*0.35,d:D.summonById[id],kind:'m'}));L.mercIn=q.length;}
  g.sendQ=[[],[]];g.lanes.forEach(L=>L.events.push({k:'wave',w:g.wave,wd}));}
function kingGrow(g,k){const KA=D.king.abilities||[];k.ab=KA.filter(a=>a.wave<=g.wave);const lg=D.king.lateGame||{asPerWave:0.03,armPerWave:0.2,from:6};
  const n=Math.max(0,g.wave-lg.from+1);k.cd=k.cd0/(1+lg.asPerWave*n);k.armor=k.armor0+Math.floor(lg.armPerWave*n);
  if(k.ab.length>(k.nab||0)){k.nab=k.ab.length;g.lanes[k.owner].events.push({k:'kingab',a:k.ab[k.ab.length-1]});}}
function u_guard(L){for(const u of L.units)u.guard=0;for(const o of L.units){const f=has(o,'guardian');if(!f)continue;for(const u of L.units)if(dist(u,o)<=f.r/TILE+0.6)u.guard=Math.max(u.guard,f.v);}}
function endWave(g){g.phase='build';const b=waveBonus(g.wave);
  for(let p=0;p<2;p++){const L=g.lanes[p],P=g.P[p];L.lastDead=L.units.filter(u=>u.died).length;P.gold+=b+P.income;L.events.push({k:'income',v:P.income,bonus:b});
    for(const u of L.units){const sl=has(u,'slavetrade');if(sl&&!u.died){P.gold+=sl.v;L.events.push({k:'gold',v:sl.v,x:u.x,y:u.y});}u.died=false;u.alive=true;u.hp=u.maxHp;u.x=u.c+0.5;u.y=u.r+0.5;u.tgt=null;u.st={};}L.creeps=[];L.summ=[];L.pend=[];}
  if(g.wave>=MAXW){const k0=g.lanes[0].king,k1=g.lanes[1].king;g.over=k0.hp/k0.maxHp>=k1.hp/k1.maxHp?'win':'lose';g.phase='over';return;}
  g.timer=ECO.prep(g.wave+1);g.lanes.forEach(L=>L.events.push({k:'build',w:g.wave+1}));}
// ---------------- status / auras ----------------
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function fxOf(e){return e.isKing?[]:(e.d.fx||[]);}
function has(e,k){return fxOf(e).find(f=>f.k===k);}
function friends(L,e){return e.side==='u'||e.side==='s'?L.units.concat(L.summ):L.creeps;}
function foes(L,e){return e.side==='u'||e.side==='s'||e.side==='k'?L.creeps:L.units.concat(L.summ);}
function recalcAuras(L){const all=L.units.concat(L.summ,L.creeps);
  for(const e of all){e.au={as:0,ms:0,arm:0,dmg:0,regen:0,ls:0,rdmg:0,thorns:0,burn:0,hpburn:0,mregen:0};}
  for(const s of all){if(!s.alive)continue;for(const f of fxOf(s)){if(f.k!=='aura')continue;const r=f.r/TILE;fxCount(L,'aura:'+f.st);
      const tg=f.who==='ally'?friends(L,s):foes(L,s);
      for(const e of tg){if(!e.alive||dist(e,s)>r)continue;if(f.melee&&(e.d&&e.d.ranged))continue;const a=e.au;
        switch(f.st){case 'as':a.as=Math.max(a.as,f.v);if(f.ms)a.ms=Math.max(a.ms,f.ms);break;case 'ms':if(f.v<0)a.ms=Math.min(a.ms,f.v);else a.ms=Math.max(a.ms,f.v);break;
          case 'arm':a.arm=Math.max(a.arm,f.v);break;case 'dmg':if(f.v<0)a.dmg=Math.min(a.dmg,f.v);else a.dmg=Math.max(a.dmg,f.v);break;case 'regen':a.regen=Math.max(a.regen,f.v);break;
          case 'ls':a.ls=Math.max(a.ls,f.v);break;case 'rdmg':a.rdmg=Math.max(a.rdmg,f.v);break;case 'thorns':a.thorns=Math.max(a.thorns,f.v);break;
          case 'burn':a.burn+=f.v;break;case 'hpburn':a.hpburn=Math.max(a.hpburn,f.v);break;case 'mregen':a.mregen=Math.max(a.mregen,f.v);break;}}}}
  const k=L.king;k.au={as:0,ms:0,arm:0,dmg:0};if(k.alive)for(const f of k.ab||[]){if(f.k!=='kaura')continue;for(const e of [k].concat(L.units,L.summ)){if(!e.alive||(e!==k&&dist(e,k)>f.r/TILE))continue;const a=e.au;
      if(f.st==='dmg')a.dmg=Math.max(a.dmg,f.v);else if(f.st==='arm')a.arm=Math.max(a.arm,f.v);else if(f.st==='as'){a.as=Math.max(a.as,f.v);a.ms=Math.max(a.ms,f.ms||0);}}}}
function stunned(e,t){return e.st.stun>t||e.st.net>t;}
function slowMs(e,t){let v=0;for(const k of ['poison','frost','cslow','haunt'])if(e.st[k]&&e.st[k].until>t)v=Math.max(v,e.st[k].ms||0);return v;}
function slowAs(e,t){let v=0;for(const k of ['poison','frost','cslow','haunt','bleed'])if(e.st[k]&&e.st[k].until>t)v=Math.max(v,e.st[k].as||0);return v;}
function buffOf(e,t){const b=e.st.buff;return b&&b.until>t?b:null;}
function armorOf(e,t){let a=e.isKing?e.armor:e.d.armor;if(e.au)a+=e.au.arm;const b=buffOf(e,t);if(b&&b.arm)a+=b.arm;if(e.st.sphere&&e.st.sphere.until>t)a+=e.st.sphere.arm;
  if(e.st.armred&&e.st.armred.until>t)a-=e.st.armred.v;return a;}
function atkSpeedK(e,t){let k=1+(e.au?e.au.as:0);if(!e.isKing){const bz=has(e,'berserk');if(bz){const r=e.hp/e.maxHp;k+=r<0.2?0.8:r<0.4?0.6:r<0.6?0.4:0;}}const b=buffOf(e,t);if(b&&b.as)k+=b.as;if(e.st.oc&&e.st.oc.until>t)k+=e.st.oc.as;if(e.st.fury&&e.st.fury.until>t)k+=e.st.fury.as;k-=slowAs(e,t);return Math.max(0.2,k);}
function moveK(e,t){let k=1+(e.au?e.au.ms:0);const b=buffOf(e,t);if(b&&b.ms)k+=b.ms;k-=slowMs(e,t);return Math.max(0.1,k);}
function dmgK(e,t){let k=1+(e.au?e.au.dmg:0);const b=buffOf(e,t);if(b&&b.dmg)k+=b.dmg;if(e.st.spree&&e.st.spree.until>t)k+=e.st.spree.dmg;if(e.st.cripple&&e.st.cripple.until>t)k-=e.st.cripple.v;if(e.ill)k*=0.5;return Math.max(0.1,k);}
// ---------------- combat ----------------
function nearest(e,list,maxD,filt){let best=null,bd=maxD;for(const o of list){if(!o.alive||(filt&&!filt(o)))continue;const d=dist(e,o)-(o.radius||0.34);if(d<bd){bd=d;best=o;}}return best;}
function statsOf(e){if(e.isKing)return {dmin:e.dmin,dmax:e.dmax,rng:e.rng,cd:e.cd,ranged:true,atk:'hero'};const d=e.d;return {dmin:d.dmin,dmax:d.dmax,rng:d.rng,cd:d.cd,ranged:d.ranged,atk:d.atk};}
function dealDamage(g,L,src,x,raw,o){// o:{atk,attack:true(physical attack),melee,noEvade}
  if(!x.alive)return 0;const t=L.t;let v=raw;
  if(x.st.invul>t)return 0;
  if(o.attack&&!o.noEvade){const ev=has(x,'evade');if(ev&&g.rnd()<ev.ch){L.events.push({k:'miss',e:x});return 0;}
    if(src&&src.st&&src.st.miss&&src.st.miss.until>t&&g.rnd()<src.st.miss.v){L.events.push({k:'miss',e:x});return 0;}}
  if(o.attack&&!x.isKing){const sm=has(x,'submerge');if(sm&&!x.subUsed){x.subUsed=true;x.st.invul=t+sm.dur;L.events.push({k:'buff',e:x,c:'water'});return 0;}}
  const atk=o.atk||'spells';v*=mult(atk,x.isKing?'hero':x.d.arm);
  if(o.attack||atk!=='spells')v*=armorK(armorOf(x,t));
  if(x.st.ill)v*=2;if(x.guard)v*=1-x.guard;if(atk==='pierce'&&x.st.mark&&x.st.mark.until>t)v*=1+x.st.mark.v;
  if(o.attack){const hd=has(x,'harden');if(hd&&g.rnd()<hd.ch)v=v<=hd.red?(hd.min||0):v-hd.red;
    const df=has(x,'defend');if(df&&atk==='pierce')v*=df.p;}
  const ms=has(x,'manashield');if(ms&&x.mana>0){const part=v*ms.pct;const need=part/ms.ratio;const use=Math.min(x.mana,need);x.mana-=use;v-=use*ms.ratio;}
  if(x.isKing&&src&&src.d&&src.d.fx&&src.d.fx.find(f=>f.k==='kingx'))v*=2;
  v=Math.max(0,v);x.hp-=v;
  if(x.hp>0&&x.hp<x.maxHp*0.1&&!x.wdUsed&&!x.isKing){const wd=has(x,'withdraw');if(wd){x.wdUsed=true;x.st.invul=t+wd.dur;L.events.push({k:'buff',e:x,c:'water'});}}
  if(o.attack&&o.melee&&src&&src.alive&&src.st){const fa=has(x,'frostarmor');if(fa&&fa.ms)src.st.frost={ms:fa.ms,as:fa.as,until:t+5};}L.events.push({k:'hit',e:x,v,src,crit:o.crit});
  if(o.attack&&o.melee&&src&&src.alive){// reflect / thorns back to melee attackers
    const rf=has(x,'reflect');let th=(rf?rf.v:0)+(x.au?x.au.thorns:0);if(th>0){src.hp-=v*th;if(src.hp<=0){src.hp=0;src.alive=false;onDeath(g,L,src,x);}}}
  if(x.side!=='c'&&src&&src.side==='c'&&o.attack&&(!x.tgt||!x.tgt.alive))x.tgt=src;
  if(x.side==='c'&&src&&(src.side==='u'||src.side==='s')&&(!x.tgt||x.tgt.isKing||!x.tgt.alive))x.tgt=src;
  if(x.hp<=0){x.hp=0;x.alive=false;onDeath(g,L,x,src);}
  return v;}
function onDeath(g,L,x,src){L.events.push({k:'die',e:x,src});x.died=true;
  if(x.isKing){L.events.push({k:'kingdie'});return;}
  if(x.side==='c'){const P=g.P[L.owner];const b=x.bounty||0;if(b){P.gold+=b;L.events.push({k:'gold',v:b,x:x.x,y:x.y});}P.kills++;
    if(x.st.haunt&&x.st.haunt.rupture&&x.st.haunt.until>L.t){for(const o of L.creeps)if(o.alive&&dist(o,x)<1.6)dealDamage(g,L,null,o,x.st.haunt.rupture,{atk:'spells'});L.events.push({k:'nova',x:x.x,y:x.y,r:1.6,c:'haunt'});}}
  if(x.side==='u'){for(const f of fxOf(x)){
      if(f.k==='deathheal'){const ls=L.units.filter(o=>o.alive&&dist(o,x)<f.r/TILE).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,f.n);for(const o of ls)o.hp=Math.min(o.maxHp,o.hp+f.v);L.events.push({k:'nova',x:x.x,y:x.y,r:f.r/TILE,c:'heal'});}
      if(f.k==='deathburst'){const ls=L.creeps.filter(o=>o.alive&&dist(o,x)<f.r/TILE).slice(0,f.n);for(const o of ls)dealDamage(g,L,x,o,f.dmg,{atk:'spells'});L.events.push({k:'nova',x:x.x,y:x.y,r:f.r/TILE,c:'fire'});}
      if(f.k==='deathspawn'){const sd=D.summoned[f.u];if(sd)for(let i=0;i<f.n;i++)spawnSummon(g,L,x,sd,9999);}}}}
function spawnSummon(g,L,owner,sd,dur){const a=g.rnd()*6.28;const s={id:NID++,side:'s',owner:L.owner,type:sd.id,d:sd,x:owner.x+Math.cos(a)*0.6,y:owner.y+Math.sin(a)*0.6,hp:sd.hp,maxHp:sd.hp,mana:0,atkT:0.3,alive:true,tgt:null,radius:0.32,fly:sd.fly,st:{},cds:{},until:L.t+dur,master:owner.id};
  L.summ.push(s);L.events.push({k:'summon',e:s,m:owner});return s;}
function attack(g,L,e,t,st){const T=L.t;e.atkT=st.cd/atkSpeedK(e,T);const wind=st.ranged?0.18:0.24;const travel=st.ranged?Math.max(0.05,dist(e,t)/9):0;
  let dmg=st.dmin+g.rnd()*(st.dmax-st.dmin);let crit=false,stun=0;const fx=fxOf(e);
  for(const f of fx){
    if(f.k==='flat')dmg+=f.dmg;
    else if(f.k==='crit'&&(!f.air||t.fly)&&g.rnd()<f.ch){dmg*=f.x;crit=true;}
    else if(f.k==='bash'&&g.rnd()<f.ch){if(f.x)dmg*=f.x;dmg+=f.dmg||0;stun=Math.max(stun,f.stun*(t.boss?0.3:1));crit=true;}
    else if(f.k==='bonus'&&e.mana>=f.mana){e.mana-=f.mana;dmg+=f.dmg;crit=true;}
    else if(f.k==='insanity'&&g.rnd()<f.ch&&!(e.st.buff&&e.st.buff.until>T)){e.st.buff={dmg:f.dmg,arm:f.arm,until:T+f.dur};L.events.push({k:'buff',e,c:'rage'});}
    else if(f.k==='fury'&&!(e.cds.fury>T)&&(!f.ch||g.rnd()<f.ch)){e.st.fury={as:f.as,until:T+f.dur};e.cds.fury=T+f.dur+(f.cd||0);L.events.push({k:'buff',e,c:'haste'});}
    else if(f.k==='spree'&&g.rnd()<f.ch){e.st.spree={dmg:f.dmg,until:T+f.dur};}
    else if(f.k==='focus'){dmg+=Math.floor(e.mana/f.per);}
    else if(f.k==='finisher'&&(f.dmg?!t.isKing:!t.boss&&!t.isKing)&&g.rnd()<f.ch){dmg=f.dmg?f.dmg*(0.95+g.rnd()*0.1):t.hp*10;crit=true;}}
  if(crit||stun)for(const f of fx)if(['crit','bash','bonus','finisher','spree','fury','insanity','focus'].includes(f.k))fxCount(L,f.k);
  if(st.ranged&&e.au&&e.au.rdmg)dmg*=1+e.au.rdmg;dmg*=dmgK(e,T);
  L.events.push({k:'atk',e,t,ranged:st.ranged,wind,travel});
  const hit={t:wind+travel,src:e,tgt:t,dmg,atk:st.atk,crit,stun,melee:!st.ranged};L.pend.push(hit);
  const tr=has(e,'triple');if(tr){const others=foes(L,e).filter(o=>o!==t&&o.alive&&dist(o,e)<st.rng+0.8).slice(0,tr.n-1);for(const o of others)L.pend.push({...hit,dmg:dmg*tr.x,tgt:o,t:wind+Math.max(0.05,dist(e,o)/9)});}
  const ms=has(e,'multishot');if(ms){const others=foes(L,e).filter(o=>o!==t&&o.alive&&dist(o,e)<st.rng+0.6).slice(0,ms.n-1);for(const o of others)L.pend.push({...hit,tgt:o,t:wind+Math.max(0.05,dist(e,o)/9)});}}
function applyHit(g,L,h){const t=h.tgt,e=h.src;if(!t.alive)return;const T=L.t;
  const v=dealDamage(g,L,e,t,h.dmg,{atk:h.atk,attack:true,melee:h.melee,crit:h.crit});
  if(v>0&&e&&!e.isKing){const d=e.d;// on-hit effects
    if(h.stun&&!has(t,'immune')){t.st.stun=Math.max(t.st.stun||0,T+h.stun);L.events.push({k:'stun',e:t});}
    let ls=(e.au?e.au.ls:0);const lsf=has(e,'ls');if(lsf)ls+=lsf.v;if(ls>0&&e.alive){e.hp=Math.min(e.maxHp,e.hp+v*ls);}
    for(const f of fxOf(e)){if(['poison','armred','cripple','mark','aftershock','feast','procbolt','procslow','pulverize','shrapnel','bleed'].includes(f.k))fxCount(L,f.k);
      if(f.k==='poison'&&(!f.air||t.fly)){const cur=t.st.poison;const live=cur&&cur.until>T;const dps=f.stack==='dps'||f.stack===true?(live?(cur.dps||0)+f.dps:f.dps):f.dps;const ms=f.stack==='ms'&&live?Math.min(0.8,(cur.ms||0)+f.ms):f.ms;t.st.poison={ms,as:f.as,dps,until:T+f.dur,src:e};}
      else if(f.k==='armred'){t.st.armred={v:f.v,until:T+f.dur};}
      else if(f.k==='procbolt'&&g.rnd()<f.ch){dealDamage(g,L,e,t,f.dmg,{atk:'spells'});if(!t.boss)t.st.stun=Math.max(t.st.stun||0,T+f.stun);L.events.push({k:'bolt',e:t,src:e});}
      else if(f.k==='procslow'&&g.rnd()<f.ch){t.st.cslow={ms:f.ms,as:f.as,until:T+f.dur};L.events.push({k:'debuff',e:t});}
      else if(f.k==='pulverize'&&g.rnd()<f.ch){for(const o of foes(L,e))if(o.alive&&!o.fly&&dist(o,t)<f.r/TILE)dealDamage(g,L,e,o,f.dmg,{atk:'spells'});L.events.push({k:'nova',x:t.x,y:t.y,r:f.r/TILE,c:'earth'});}
      else if(f.k==='surge'){e.mana=Math.min(d.manaMax||10,e.mana+1);}
      else if(f.k==='cripple'){t.st.cripple={v:f.v,until:T+f.dur};}
      else if(f.k==='mark'){t.st.mark={v:f.v,until:T+f.dur};}
      else if(f.k==='aftershock'&&!h.bounced){const o=nearest(t,foes(L,e),2.5,x=>x!==t);if(o){dealDamage(g,L,e,o,f.dmg,{atk:'spells'});L.events.push({k:'bounce',a:t,b:o,src:e});}}
      else if(f.k==='shrapnel'&&!h.bounced&&g.rnd()<f.ch){const ls=foes(L,e).filter(o=>o!==t&&o.alive&&dist(o,t)<2.4).slice(0,f.n);for(const o of ls)dealDamage(g,L,e,o,f.dmg,{atk:'spells'});L.events.push({k:'nova',x:t.x,y:t.y,r:1.2,c:'fire'});}
      else if(f.k==='feast'){e.feastN=(e.feastN||0)+1;if(e.feastN>=f.every){e.feastN=0;e.hp=Math.min(e.maxHp,e.hp+f.v);L.events.push({k:'heal',e});}}
      else if(f.k==='bleed'&&e.hp<e.maxHp*f.below){t.st.bleed={as:f.as,ms:0,until:T+3};t.st.poison={ms:(t.st.poison&&t.st.poison.until>T?t.st.poison.ms:0),as:0,dps:f.dps,until:T+3};}}
    // weapon splash / bounce
    if(d.splash){const S=d.splash;const fa=(S.Farea1||0)/TILE,ha=(S.Harea1||0)/TILE,qa=(S.Qarea1||0)/TILE;const R=Math.max(fa,ha,qa);
      if(R>0){for(const o of foes(L,e)){if(o===t||!o.alive)continue;const dd=dist(o,t);if(dd>R)continue;const k=dd<=fa?1:dd<=ha?(S.Hfact1||0.5):(S.Qfact1||0.1);dealDamage(g,L,e,o,h.dmg*k,{atk:h.atk});}
        L.events.push({k:'splash',x:t.x,y:t.y,r:Math.max(0.4,R),src:e});}}
    if(d.bounce&&!h.bounced){const B=d.bounce;let cur=t,dm=h.dmg,hitS=new Set([t]);const n=(B.targets||2)-1,rr=(B.range||300)/TILE;
      for(let i=0;i<n;i++){dm*=1-(B.loss||0.15);const nx=nearest(cur,foes(L,e),rr,o=>!hitS.has(o));if(!nx)break;hitS.add(nx);L.pend.push({t:0.12*(i+1),src:e,tgt:nx,dmg:dm,atk:h.atk,bounced:true,melee:false});L.events.push({k:'bounce',a:cur,b:nx,src:e});cur=nx;}}}}
function fxCount(L,k){const c=L.fxc||(L.fxc={});c[k]=(c[k]||0)+1;}
function castAbilities(g,L,e,dt){const T=L.t,d=e.d;if(d.manaRegen)e.mana=Math.min(d.manaMax||0,e.mana+(d.manaRegen+(e.au?e.au.mregen*(d.manaMax||0):0))*dt);
  const fx=fxOf(e);if(!fx.length)return;const enemies=foes(L,e);const engaged=e.tgt&&e.tgt.alive&&dist(e,e.tgt)<(d.rng+3);
  for(const f of fx){const ready=!(e.cds[f.k]>T);const m0=e.mana,c0=e.cds[f.k],n0=L.summ.length,a0=e.alive;
    switch(f.k){
      case 'lineshock':if(ready&&e.tgt&&e.tgt.alive&&dist(e,e.tgt)<f.rng/TILE+0.5){e.cds[f.k]=T+f.cd;const t=e.tgt,dx=t.x-e.x,dy=t.y-e.y,dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;
          for(const o of enemies){if(!o.alive||o.fly)continue;const px=o.x-e.x,py=o.y-e.y,al=px*ux+py*uy,pp=Math.abs(px*uy-py*ux);if(al>0&&al<f.len/TILE&&pp<f.w/TILE/2+o.radius)dealDamage(g,L,e,o,f.dmg,{atk:'spells'});}
          L.events.push({k:'wavefx',x:e.x,y:e.y,ux,uy,len:f.len/TILE,c:'earth'});}break;
      case 'summon':if(ready&&engaged&&e.mana>=(d.manaMax||60)-0.01){e.mana=0;e.cds[f.k]=T+f.cd;const sd=D.summoned[f.u];if(sd)for(let i=0;i<f.n;i++)spawnSummon(g,L,e,sd,f.dur);}break;
      case 'selfbuff':if(ready&&engaged){e.st.buff={as:f.as||0,ms:f.ms||0,dmg:f.dmg||0,arm:f.arm||0,until:T+f.dur,drain:f.drain||0};e.cds[f.k]=T+f.dur+(f.cd>1?f.cd:0);L.events.push({k:'buff',e,c:'rage'});}break;
      case 'massheal':if(e.mana>=f.mana){const ls=friends(L,e).filter(o=>o.alive&&o.hp<o.maxHp-f.v*0.5&&dist(o,e)<f.r/TILE).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp).slice(0,f.n);
          if(ls.length){e.mana=0;for(const o of ls){o.hp=Math.min(o.maxHp,o.hp+f.v);L.events.push({k:'heal',e:o});}L.events.push({k:'nova',x:e.x,y:e.y,r:f.r/TILE,c:'heal'});}}break;
      case 'heal':if(ready&&e.mana>=f.mana){const o=friends(L,e).filter(o=>o.alive&&o.maxHp-o.hp>=f.v*0.6&&dist(o,e)<5.5).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
          if(o){e.mana-=f.mana;e.cds[f.k]=T+f.cd;o.hp=Math.min(o.maxHp,o.hp+f.v);L.events.push({k:'heal',e:o,src:e});}}break;
      case 'mend':if(ready&&e.mana>=(d.manaMax||25)-0.01){let o=friends(L,e).filter(o=>o.alive&&o.hp<o.maxHp-40&&dist(o,e)<5.5).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
          if(o){e.mana=0;e.cds[f.k]=T+f.cd;let v=f.v;const seen=new Set();for(let i=0;i<=f.jumps&&o;i++){seen.add(o);o.hp=Math.min(o.maxHp,o.hp+v);L.events.push({k:'heal',e:o,src:e});v*=1-f.decay;o=nearest(o,friends(L,e),3.9,x=>!seen.has(x)&&x.hp<x.maxHp);}}}break;
      case 'fan':if((f.mana?e.mana>=f.mana:ready)&&engaged){const ls=enemies.filter(o=>o.alive&&dist(o,e)<f.r/TILE).slice(0,f.n);if(ls.length){if(f.mana)e.mana-=f.mana;else e.cds[f.k]=T+f.cd;
          for(const o of ls)dealDamage(g,L,e,o,f.dmg,{atk:'spells'});L.events.push({k:'nova',x:e.x,y:e.y,r:f.r/TILE,c:'blade'});}}break;
      case 'nova':if(ready&&engaged&&(!f.mana||e.mana>=f.mana)){const ls=enemies.filter(o=>o.alive&&!o.fly&&dist(o,e)<f.r/TILE);if(ls.length){if(f.mana)e.mana-=f.mana;e.cds[f.k]=T+f.cd;
          for(const o of ls){dealDamage(g,L,e,o,f.dmg,{atk:'spells'});if(f.stun&&!o.boss)o.st.stun=Math.max(o.st.stun||0,T+f.stun);if(f.ms)o.st.frost={ms:f.ms,as:f.as,until:T+f.dur};}L.events.push({k:'nova',x:e.x,y:e.y,r:f.r/TILE,c:'earth'});}}break;
      case 'frostnova':if(ready&&engaged&&e.tgt){const t=e.tgt;e.cds[f.k]=T+f.cd;dealDamage(g,L,e,t,f.dmg,{atk:'spells'});for(const o of enemies)if(o.alive&&dist(o,t)<f.r/TILE){dealDamage(g,L,e,o,f.nova,{atk:'spells'});o.st.frost={ms:f.ms,as:f.as,until:T+f.dur};}L.events.push({k:'nova',x:t.x,y:t.y,r:f.r/TILE,c:'frost'});}break;
      case 'rockets':if(ready&&engaged&&e.tgt){const t=e.tgt;e.cds[f.k]=T+f.cd;for(const o of enemies)if(o.alive&&dist(o,t)<Math.max(1.2,f.r/TILE)){dealDamage(g,L,e,o,f.dmg,{atk:'spells'});if(!o.boss)o.st.stun=Math.max(o.st.stun||0,T+f.stun);}L.events.push({k:'nova',x:t.x,y:t.y,r:1.2,c:'fire'});}break;
      case 'breath':if(ready&&engaged&&e.tgt){const t=e.tgt;e.cds[f.k]=T+f.cd;for(const o of enemies)if(o.alive&&dist(o,t)<f.r/TILE+0.6){dealDamage(g,L,e,o,f.dmg,{atk:'spells'});o.st.poison={ms:0.3,as:0,dps:f.dps,until:T+f.dur};}L.events.push({k:'nova',x:t.x,y:t.y,r:1.4,c:'frost'});}break;
      case 'geyser':if(ready&&engaged&&e.tgt){const t=e.tgt;e.cds[f.k]=T+f.cd;for(const o of enemies)if(o.alive&&dist(o,t)<f.r/TILE)dealDamage(g,L,e,o,f.dmg,{atk:'spells'});L.events.push({k:'nova',x:t.x,y:t.y,r:f.r/TILE,c:'water'});}break;
      case 'haunt':if(ready&&engaged){const o=enemies.filter(o=>o.alive&&!(o.st.haunt&&o.st.haunt.until>T)&&dist(o,e)<800/TILE)[0];if(o){e.cds[f.k]=T+f.cd;o.st.haunt={dps:f.dps,as:f.as,until:T+f.dur,src:e,rupture:f.rupture||0};L.events.push({k:'debuff',e:o,c:'haunt'});}}break;
      case 'castslow':if(ready&&engaged){const o=enemies.filter(o=>o.alive&&!(o.st.cslow&&o.st.cslow.until>T)&&dist(o,e)<700/TILE)[0];if(o){e.cds[f.k]=T+f.cd;o.st.cslow={ms:f.ms,as:f.as,until:T+f.dur};L.events.push({k:'debuff',e:o,c:'slow'});}}break;
      case 'net':if(e.mana>=f.mana&&engaged){const o=enemies.filter(o=>o.alive&&!o.boss&&!(o.st.net>T)&&dist(o,e)<700/TILE)[0];if(o){e.mana-=f.mana;o.st.net=T+f.dur;L.events.push({k:'debuff',e:o,c:'net'});}}break;
      case 'entangle':if(ready&&engaged&&e.tgt&&!e.tgt.boss){e.cds[f.k]=T+f.cd+f.stun;e.tgt.st.net=T+f.stun;e.tgt.st.poison={ms:0,as:0,dps:f.dps,until:T+f.stun};L.events.push({k:'debuff',e:e.tgt,c:'root'});}break;
      case 'sphere':if(ready&&engaged){const o=friends(L,e).filter(o=>o.alive&&!(o.st.sphere&&o.st.sphere.until>T)&&dist(o,e)<5).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(o){e.cds[f.k]=T+f.cd;o.st.sphere={arm:f.arm,until:T+f.dur};L.events.push({k:'buff',e:o,c:'water'});}}break;
      case 'overclock':if(ready&&engaged){const o=friends(L,e).filter(o=>o.alive&&o!==e&&!(o.st.oc&&o.st.oc.until>T)&&dist(o,e)<5).sort((a,b)=>b.d.dmax-a.d.dmax)[0];if(o){e.cds[f.k]=T+f.cd;o.st.oc={as:f.as,until:T+f.dur};L.events.push({k:'buff',e:o,c:'haste'});}}break;
      case 'mirage':if(ready&&engaged&&!e.ill){e.cds[f.k]=T+f.cd;const sd=Object.assign({},e.d,{fx:e.d.fx.filter(x=>x.k!=='mirage')});const s=spawnSummon(g,L,e,sd,f.dur);s.ill=true;s.st.ill=true;s.hp=s.maxHp=e.maxHp;}break;
      case 'wrath':if(ready&&engaged&&e.tgt){e.cds[f.k]=T+f.cd;let cur=e.tgt,v=f.dmg;const seen=new Set();for(let i=0;i<=f.jumps&&cur;i++){seen.add(cur);dealDamage(g,L,e,cur,v,{atk:'spells'});const nx=nearest(cur,enemies,3.9,x=>!seen.has(x));if(nx)L.events.push({k:'bounce',a:cur,b:nx,src:e,c:'nature'});v*=1-f.decay;cur=nx;}}break;
      case 'stormbolt':if(ready&&engaged&&e.tgt){const t=e.tgt;e.cds[f.k]=T+f.cd;L.events.push({k:'bolt',e:t,src:e});dealDamage(g,L,e,t,f.dmg,{atk:'spells'});if(t.alive&&!has(t,'immune'))t.st.stun=Math.max(t.st.stun||0,T+f.stun*(t.boss?0.3:1));}break;
      case 'mindwarp':if(ready&&engaged){const o=friends(L,e).filter(o=>o.alive&&o!==e&&!(o.st.oc&&o.st.oc.until>T)&&dist(o,e)<5).sort((a,b)=>b.d.dmax-a.d.dmax)[0];if(o){e.cds[f.k]=T+10;o.st.oc={as:f.as,until:T+10};L.events.push({k:'buff',e:o,c:'haste'});}}break;
      case 'seduce':if(ready&&engaged&&e.tgt){const t=e.tgt;e.cds[f.k]=T+f.cd;for(const o of enemies)if(o.alive&&dist(o,t)<f.r/TILE+0.5)o.st.miss={v:f.miss,until:T+f.dur};L.events.push({k:'nova',x:t.x,y:t.y,r:f.r/TILE+0.5,c:'haunt'});}break;
      case 'mine':if(e.tgt&&e.tgt.alive&&dist(e,e.tgt)<0.75){for(const o of enemies)if(o.alive&&!o.fly&&dist(o,e)<f.r/TILE)dealDamage(g,L,e,o,f.dmg,{atk:'spells'});L.events.push({k:'nova',x:e.x,y:e.y,r:f.r/TILE,c:'fire'});e.hp=0;e.alive=false;L.events.push({k:'die',e,src:e});}break;
    }
    if(e.mana<m0-0.01||e.cds[f.k]!==c0||L.summ.length>n0||(a0&&!e.alive))fxCount(L,f.k);}}
// ---------------- lane simulation ----------------
function stepLane(g,L,dt){if(L.cleared)return;L.t+=dt;const T=L.t;
  // spawn queue (creeps trickle in at 0.1s each, summons from the opponent follow)
  for(let i=L.spawnQ.length-1;i>=0;i--){const s=L.spawnQ[i];if(s.t<=T){L.spawnQ.splice(i,1);const x=1.2+g.rnd()*(W-2.4),y=-0.4-g.rnd()*1.2;const c=mkCreep(s.d,x,y,L.owner,s.kind,s.kind==='c'?L.bountyMul:1);if(s.d.boss)c.x=4.5;L.creeps.push(c);L.events.push({k:'spawn',e:c});}}
  if((L.auT=(L.auT||0)-dt)<=0){L.auT=0.25;recalcAuras(L);}
  for(let i=L.pend.length-1;i>=0;i--){const h=L.pend[i];h.t-=dt;if(h.t<=0){L.pend.splice(i,1);applyHit(g,L,h);}}
  const mine=L.units.concat(L.summ),k=L.king;
  // per-entity upkeep: dots, regen, timers
  for(const e of mine.concat(L.creeps)){if(!e.alive)continue;const a=e.au||{};
    let reg=(e.d.hpRegen||0)+(a.regen||0);const b=buffOf(e,T);if(b&&b.drain)reg-=b.drain;if(reg)e.hp=Math.min(e.maxHp,e.hp+reg*dt);
    let dot=0;if(e.st.poison&&e.st.poison.until>T)dot+=e.st.poison.dps||0;if(e.st.haunt&&e.st.haunt.until>T)dot+=e.st.haunt.dps;dot+=a.burn||0;if(a.hpburn)dot+=e.maxHp*a.hpburn;
    if(dot>0){e.dotAcc=(e.dotAcc||0)+dot*dt;if(e.dotAcc>=4||e.hp<=e.dotAcc){const v=e.dotAcc;e.dotAcc=0;dealDamage(g,L,null,e,v,{atk:'spells'});}}
    if(e.side==='s'&&e.until<T&&e.alive){e.alive=false;L.events.push({k:'die',e,expire:true});}}
  // fighters + summoned allies
  for(const u of mine){if(!u.alive)continue;const st=statsOf(u);u.atkT-=dt;castAbilities(g,L,u,dt);if(!u.alive)continue;u.moving=false;if(stunned(u,T))continue;
    const acq=Math.max(st.rng+0.8,3.9);if(!u.tgt||!u.tgt.alive||(T%0.5<dt)){const n=nearest(u,L.creeps,acq);u.tgt=n||(u.tgt&&u.tgt.alive&&dist(u,u.tgt)<acq+2?u.tgt:null);}
    if(!u.tgt&&u.side==='s'){u.tgt=nearest(u,L.creeps,99);}
    const t=u.tgt;
    if(!t){if(u.side==='u'){const hx=u.c+0.5,hy=u.r+0.5,d=Math.hypot(hx-u.x,hy-u.y);if(d>0.1){const s=Math.min(d,st.spd*moveK(u,T)*dt||u.d.spd*dt);u.x+=(hx-u.x)/d*s;u.y+=(hy-u.y)/d*s;u.moving=true;}}continue;}
    const d=dist(u,t)-t.radius;if(d>st.rng){const s=u.d.spd*moveK(u,T)*dt,D2=dist(u,t)||1;u.x+=(t.x-u.x)/D2*s;u.y+=(t.y-u.y)/D2*s;u.moving=true;}
    else if(u.atkT<=0&&!has(u,'mine'))attack(g,L,u,t,st);u.face=Math.atan2(t.x-u.x,t.y-u.y);}
  // creeps (and the opponent's summons)
  for(const c of L.creeps){if(!c.alive)continue;const st=statsOf(c);c.atkT-=dt;if(c.d.fx&&c.d.fx.length)castAbilities(g,L,c,dt);c.moving=false;if(stunned(c,T))continue;
    if(!c.tgt||!c.tgt.alive||c.tgt.isKing||(T%0.5<dt)){const n=c.leaked?null:nearest(c,mine,st.ranged?st.rng+0.8:3.9);c.tgt=n||(c.tgt&&c.tgt.alive&&!c.tgt.isKing&&dist(c,c.tgt)<4.5?c.tgt:null);}
    let t=c.tgt;
    if(!t){if(c.y>LEAK_Y&&!c.leaked){c.leaked=true;L.leaks++;g.P[L.owner].leaked++;L.events.push({k:'leak',e:c});}if(c.leaked&&k.alive)t=k;}
    const sp=c.d.spd*moveK(c,T);
    if(t){const d=dist(c,t)-(t.isKing?0.9:t.radius);if(d>st.rng){const D2=dist(c,t)||1;c.x+=(t.x-c.x)/D2*sp*dt;c.y+=(t.y-c.y)/D2*sp*dt;c.moving=true;}else if(c.atkT<=0)attack(g,L,c,t,st);c.face=Math.atan2(t.x-c.x,t.y-c.y);}
    else{const tx=c.y>LEAK_Y-2.5?4.5:c.x;const D2=Math.hypot(tx-c.x,KING_POS.y-c.y)||1;c.x+=(tx-c.x)/D2*sp*dt;c.y+=(KING_POS.y-c.y)/D2*sp*dt;c.moving=true;c.face=Math.atan2(tx-c.x,KING_POS.y-c.y);}}
  // king
  if(k.alive){k.atkT-=dt;k.hp=Math.min(k.maxHp,k.hp+k.regen*dt);const t=nearest(k,L.creeps,k.rng+0.9,o=>o.y>LEAK_Y-3||o.leaked);
    if(t&&k.atkT<=0)attack(g,L,k,t,{dmin:k.dmin,dmax:k.dmax,rng:k.rng,cd:k.cd,ranged:true,atk:'hero'});
    k.mana=Math.min(k.maxMana,k.mana+k.manaRegen*dt);
    for(const f of k.ab||[]){const near=L.creeps.filter(o=>o.alive&&dist(o,k)<f.r/TILE+0.9);
      if(f.k==='immolation'){k.immAcc+=dt;if(k.immAcc>=1){k.immAcc-=1;for(const o of near)if(!o.fly)dealDamage(g,L,k,o,f.dps,{atk:'spells'});}}
      else if(f.k==='warstomp'&&near.length&&k.mana>=f.mana&&!(k.cds.ws>T)){k.mana-=f.mana;k.cds.ws=T+f.cd;for(const o of near)if(!o.fly){dealDamage(g,L,k,o,f.dmg,{atk:'spells'});if(o.alive)o.st.stun=Math.max(o.st.stun||0,T+f.stun*(o.boss?0.3:1));}L.events.push({k:'nova',x:k.x,y:k.y,r:f.r/TILE+0.9,c:'earth'});}
      else if(f.k==='shockwave'&&t&&k.mana>=f.mana&&!(k.cds.sw>T)){k.mana-=f.mana;k.cds.sw=T+f.cd;const dx=t.x-k.x,dy=t.y-k.y,dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;
        for(const o of L.creeps){if(!o.alive)continue;const px=o.x-k.x,py=o.y-k.y,along=px*ux+py*uy,perp=Math.abs(px*uy-py*ux);if(along>0&&along<f.len/TILE&&perp<f.w/TILE+o.radius)dealDamage(g,L,k,o,f.dmg,{atk:'spells'});}
        L.events.push({k:'wavefx',x:k.x,y:k.y,ux,uy,len:f.len/TILE,c:'earth'});}}}
  // separation (ground units only)
  const all=mine.concat(L.creeps).filter(e=>e.alive&&!e.fly);for(let i=0;i<all.length;i++){const a=all[i];for(let j=i+1;j<all.length;j++){const b=all[j];const dx=b.x-a.x,dy=b.y-a.y,rr=a.radius+b.radius,d2=dx*dx+dy*dy;
      if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2),push=(rr-d)*0.5;const nx=dx/d,ny=dy/d;const wa=a.boss?0.15:1,wb=b.boss?0.15:1;a.x-=nx*push*wa;a.y-=ny*push*wa;b.x+=nx*push*wb;b.y+=ny*push*wb;}}}
  for(const e of mine.concat(L.creeps)){if(!e.alive)continue;e.x=Math.max(0.3,Math.min(W-0.3,e.x));if(e.side!=='c')e.y=Math.max(-1,Math.min(H-0.5,e.y));}
  if(L.summ.length>40)L.summ=L.summ.filter(s=>s.alive);
  if(!L.spawnQ.length&&!L.creeps.some(c=>c.alive)&&!L.pend.length){L.cleared=true;L.events.push({k:'cleared',t:L.t,leaks:L.leaks});}
  if(L.t>240){for(const c of L.creeps)if(c.alive){c.alive=false;L.events.push({k:'die',e:c});}L.spawnQ=[];}}
function stepEco(g,dt){for(let p=0;p<2;p++){const P=g.P[p];P.wispT+=dt;if(P.wispT>=ECO.wispInt){P.wispT-=ECO.wispInt;P.lumber+=P.wisps*(ECO.wispLumber+P.lj);}
    for(const s of D.summons){const st=P.stock[s.id];if(st.n<(s.stockMax||1)){st.t+=dt;if(st.t>=(s.stockRegen||10)){st.t=0;st.n++;}}}}}
function step(g,dt){if(g.over)return;g.t+=dt;stepEco(g,dt);
  if(g.phase==='build'){g.timer-=dt;AI.think(g,1,dt);if(g.autoP0)AI.think(g,0,dt);if(g.timer<=0)startWave(g);return;}
  if(g.phase==='battle'){for(const L of g.lanes)stepLane(g,L,dt);AI.think(g,1,dt);if(g.autoP0)AI.think(g,0,dt);
    const dead=g.lanes.map(L=>!L.king.alive);if(dead[0]||dead[1]){g.over=dead[0]?'lose':'win';g.phase='over';return;}
    if(g.lanes.every(L=>L.cleared))endWave(g);}}
// ---------------- AI (plays any race: builds a mixed front/back line, upgrades, wisps, farms, lumber summons, king) ----------------
const ACOLS=[4,3,5,2,6,1,7,0,8];
const AI={think(g,p,dt){const A=g.ai||(g.ai=[{cd:0,w:-1},{cd:0,w:-1}]);const s=A[p];
    if(s.w!==g.wave){s.w=g.wave;s.plan=true;}s.cd-=dt;if(s.cd>0)return;s.cd=0.6;AI.act(g,p,s);},
  act(g,p,s){const L=g.lanes[p],P=g.P[p],R=g.rnd,bt=g.phase==='build';
    const nextW=bt?g.wave+1:g.wave;const rec=(D.waves[Math.min(nextW,MAXW)]||{}).recommendedValue||0;const armyOk=P.value>=rec*(0.9+0.1*R());
    const foodFree=P.foodCap-P.food;const farmNeed=P.farm<ECO.farmMax&&foodFree<=4;
    if(farmNeed&&P.lumber>=ECO.farmLumber&&P.gold>=ECO.farmGold)return buyFarm(g,p);
    const keep=P.farm<ECO.farmMax&&foodFree<=8?ECO.farmLumber:0;
    if(P.lumber-keep>=80&&L.king.hp<L.king.maxHp*0.7){const k=['hp','regen','attack'][Math.floor(R()*3)];const r=kingUpgrade(g,p,k);if(r.ok)return r;}
    if(g.wave>=3&&P.lumber-keep>=40&&R()<0.6){const opts=D.summons.filter(x=>x.lumber<=P.lumber-keep&&P.stock[x.id].n>0);if(opts.length){const t=opts[Math.max(0,opts.length-1-Math.floor(R()*2))];return sendSummon(g,p,t.id);}}
    if(!bt)return;
    const wispGoal=Math.min(ECO.wispMax,3+g.wave);const need=rec*0.7;
    if(P.value>=need&&P.wisps<wispGoal&&P.gold>=ECO.wispGold&&foodFree>=1)return buyWisp(g,p);
    if(P.value>=rec*0.85&&P.lj<15&&P.wisps>=5&&g.wave>=4){const c=ljCost(P.lj+1);if(P.gold>=c.g&&P.lumber>=c.l+keep&&R()<0.5)return buyLumberjack(g,p);}
    const lines=raceLines(g,p);
    if(P.race==='Prophet'&&P.rerolls<2&&g.wave===3&&P.gold>=60&&P.lumber>=60)return rollProphet(g,p);
    if(P.value>=rec*1.15&&g.timer>6)return;   // enough army: bank gold
    // choose the most efficient purchase (power gained per gold) among upgrades and new placements
    const wv=D.waves[Math.min(nextW,MAXW)]||{};const mm=d=>wv.atk?Math.pow(mult(d.atk==='unknown'?'spells':d.atk,wv.arm),1.5)/Math.pow(mult(wv.atk,d.arm),1.5):1;
    const pw=d=>Math.sqrt(Math.max(1,d.hp)*((d.dmin+d.dmax)/2)/Math.max(0.3,d.cd))*(1+0.15*(d.fx||[]).length)*mm(d);
    const melee=L.units.filter(u=>!u.d.ranged).length,ranged=L.units.length-melee;const wantR=melee>=2&&ranged<melee*0.7;
    const opts=[];
    for(const u of L.units)for(const to of (u.d.upgrades||[])){const nd=D.units[to];const c=upCost(u.d,nd);if(c>0&&c<=P.gold&&P.food+(nd.food||1)-(u.d.food||1)<=P.foodCap)opts.push({sc:(pw(nd)-pw(u.d))/c*(nd.ranged===wantR?1.1:1),u,to});}
    for(const id of lines){const d=D.units[id];if(!d||d.gold>P.gold||P.food+(d.food||1)>P.foodCap||has({d},'mine'))continue;opts.push({sc:pw(d)/d.gold*(d.ranged===wantR?1.35:0.85)*(L.units.length<2?1.5:1),id});}
    if(!opts.length)return;for(const o of opts)o.sc*=0.85+0.3*R();opts.sort((a,b)=>b.sc-a.sc);const best=opts[0];
    if(best.u)return upgrade(g,p,best.u.id,best.to);
    const id=best.id;const isR=D.units[id].ranged;
    const rows=isR?[8,9,7,10,6,11,5]:[4,5,3,6,2,7,8,9,10,11];
    for(const r of rows)for(const c of ACOLS)if(cellFree(L,c,r))return place(g,p,id,c,r);}};
// ---------------- ability text (Simplified Chinese, generated from the structured specs) ----------------
const pc=v=>Math.round(v*100)+'%';
const STZ={as:'攻击速度',ms:'移动速度',arm:'护甲',dmg:'攻击力',regen:'生命恢复',ls:'吸血',rdmg:'远程伤害',thorns:'近战反伤',burn:'灼烧伤害',hpburn:'每秒最大生命',mregen:'法力恢复'};
function fxText(f){const r=f.r?`（范围${f.r}）`:'';switch(f.k){
  case 'poison':return `攻击${f.air?'(仅对空)':''}使目标${f.ms?'移速-'+pc(f.ms):''}${f.as?' 攻速-'+pc(f.as):''}${f.dps?' 每秒'+f.dps+'毒伤':''}，持续${f.dur}秒${f.stack?'（可叠加）':''}`;
  case 'crit':return `${f.ch>=1?'每次攻击':pc(f.ch)+'几率'}造成${f.x}倍伤害${f.air?'（仅对空中单位）':''}`;
  case 'bash':return `${pc(f.ch)}几率${f.x?f.x+'倍伤害':f.dmg?'额外'+f.dmg+'伤害':''}${f.x||f.dmg?'并':''}击晕${f.stun}秒（首领减免）`;
  case 'evade':return `${pc(f.ch)}几率闪避攻击`;
  case 'aura':{const s=STZ[f.st]||f.st;const v=f.st==='arm'||f.st==='regen'||f.st==='burn'?(f.v>0?'+':'')+f.v:(f.v>0?'+':'')+pc(f.v);
    if(f.who==='enemy')return `光环：附近敌人${s}${f.st==='burn'?'每秒'+f.v:f.st==='hpburn'?'流失'+pc(f.v):v}${r}`;return `光环：附近${f.melee?'近战':''}友军${s}${v}${f.ms&&f.st==='as'?' 移速+'+pc(f.ms):''}${r}`;}
  case 'summon':{const s=D.summoned[f.u];return `法力满时召唤${f.n>1?f.n+'个':''}${s?s.zh:'单位'}（${s?`${s.hp}血 ${s.dmin}-${s.dmax}攻`:''}），持续${f.dur}秒，冷却${f.cd}秒`;}
  case 'bonus':return `消耗法力，攻击附加${f.dmg}伤害`;case 'surge':return `每次攻击回复1法力，法力满时附加能量弹${f.dmg}伤害`;
  case 'selfbuff':return `${f.dur>=999?'整关持续':'战斗中'}自我强化：${[f.as&&'攻速+'+pc(f.as),f.ms&&'移速+'+pc(f.ms),f.dmg&&'伤害+'+pc(f.dmg),f.arm&&'护甲+'+f.arm,f.drain&&'每秒流失'+f.drain+'生命'].filter(Boolean).join(' ')}${f.dur>=999?'':'，持续'+f.dur+'秒'}`;
  case 'manashield':return `法力护盾：吸收${pc(f.pct)}伤害，每1法力抵消${f.ratio}伤害`;
  case 'massheal':return `法力满时治疗附近${f.n}个友军各${f.v}生命${r}`;case 'deathheal':return `死亡时治疗附近${f.n}个友军各${f.v}生命`;
  case 'reflect':return `反弹${pc(f.v)}近战伤害`;case 'deathburst':return `死亡时对附近最多${f.n}个敌人造成${f.dmg}伤害`;
  case 'castslow':return `对敌人施法：攻速-${pc(f.as)} 移速-${pc(f.ms)}，${f.dur}秒（冷却${f.cd}秒）`;
  case 'armred':return `攻击降低目标护甲${f.v}点，持续${f.dur}秒`;case 'fan':return `对周围最多${f.n}个敌人造成${f.dmg}伤害${f.cd?'（冷却'+f.cd+'秒）':'（消耗法力）'}`;
  case 'insanity':return `攻击时${pc(f.ch)}几率疯狂：伤害+${pc(f.dmg)} 护甲+${f.arm}，${f.dur}秒`;
  case 'haunt':return `缠绕敌人：每秒${f.dps}伤害、攻速-${pc(f.as)}，${f.dur}秒${f.rupture?'；目标死亡时爆裂造成'+f.rupture+'范围伤害':''}（冷却${f.cd}秒）`;
  case 'fury':return `${f.ch?pc(f.ch)+'几率':'攻击时'}狂怒：攻速+${pc(f.as)}，${f.dur}秒`;case 'mend':return `治疗波：治疗${f.v}并弹射${f.jumps}次，每次减少${pc(f.decay)}`;
  case 'guardian':return f.v?`守护之灵：相邻友军受到的伤害-${pc(f.v)}`:'守护灵（数据不完整）';case 'nova':return `震击地面：${f.dmg}伤害${f.stun?'并击晕'+f.stun+'秒':''}${f.ms?'，减速'+pc(f.ms):''}${r}（冷却${f.cd}秒）`;
  case 'sphere':return `为友军施加水之护盾：护甲+${f.arm}，${f.dur}秒（冷却${f.cd}秒）`;case 'geyser':return `风暴喷泉：对区域造成${f.dmg}伤害（冷却${f.cd}秒）`;
  case 'flat':return `每次攻击附加${f.dmg}伤害`;case 'frostnova':return `霜冻新星：目标${f.dmg}伤害，周围${f.nova}伤害并减速（冷却${f.cd}秒）`;
  case 'breath':return `冰霜吐息：${f.dmg}伤害，之后每秒${f.dps}伤害持续${f.dur}秒（冷却${f.cd}秒）`;case 'frostarmor':return `蓝龙之甲：护甲+${f.arm}${f.ms?`，近战攻击者移速-${pc(f.ms)} 攻速-${pc(f.as)}`:'，减速攻击者'}（被动）`;
  case 'mirage':return `制造幻象：幻象造成50%伤害、承受200%伤害，持续${f.dur}秒`;case 'procbolt':return `攻击时${pc(f.ch)}几率释放${f.dmg}伤害并击晕${f.stun}秒`;
  case 'mine':return `接触敌人时自爆，对范围内地面敌人造成${f.dmg}伤害`;case 'rockets':return `集束火箭：区域${f.dmg}伤害并击晕${f.stun}秒（冷却${f.cd}秒）`;
  case 'overclock':return `超频：使一个友军攻速+${pc(f.as)}，${f.dur}秒（冷却${f.cd}秒）`;case 'multishot':return `多重射击：同时攻击${f.n}个目标`;
  case 'defend':return `防御姿态：受到的穿刺伤害降为${pc(f.p)}`;case 'heal':return `治疗一个受伤友军${f.v}生命`;
  case 'harden':return `${pc(f.ch)}几率使受到的攻击伤害减少${f.red}`;case 'finisher':return f.dmg?`终结一击：${pc(f.ch)}几率造成约${f.dmg}伤害（对首领同样有效）`:`${pc(f.ch)}几率一击必杀（非首领）`;
  case 'procslow':return `攻击时${pc(f.ch)}几率致残：移速-${pc(f.ms)} 攻速-${pc(f.as)}`;case 'pulverize':return `攻击时${pc(f.ch)}几率粉碎周围地面敌人${f.dmg}伤害`;
  case 'ls':return `吸血${pc(f.v)}`;case 'entangle':return `缠绕根须：定身目标${f.stun}秒并每秒${f.dps}伤害`;case 'net':return `投网：定身一个敌人${f.dur}秒`;
  case 'deathspawn':{const s=D.summoned[f.u];return `死亡时生成${f.n>1?f.n+'个':''}${s?s.zh:'单位'}${s?`（${s.hp}血）`:''}`;}
  case 'wrath':return `自然之怒：${f.dmg}法术伤害，弹射${f.jumps}次（冷却${f.cd}秒）`;case 'cripple':return `攻击使目标伤害-${pc(f.v)}，持续${f.dur}秒`;
  case 'stormbolt':return `风暴之锤：${f.dmg}伤害并击晕${f.stun}秒（冷却${f.cd}秒）`;case 'berserk':return '狂暴：生命低于60%/40%/20%时攻速+40%/60%/80%';
  case 'aftershock':return `余震：每次攻击对另一个敌人额外造成${f.dmg}伤害`;case 'mark':return `标记目标：受到的穿刺伤害+${pc(f.v)}，${f.dur}秒`;
  case 'spree':return `杀戮狂潮：攻击时${pc(f.ch)}几率伤害+${pc(f.dmg)}，${f.dur}秒`;case 'mindwarp':return `心灵扭曲：使一个友军攻速+${pc(f.as)}`;
  case 'seduce':return `魅惑：区域内敌人${pc(f.miss)}几率攻击落空，${f.dur}秒（冷却${f.cd}秒）`;case 'triple':return `三重攻击：同时攻击${f.n}个目标（副目标${pc(f.x)}伤害）`;
  case 'feast':return `盛宴：每${f.every}次攻击回复${f.v}生命`;case 'withdraw':return `退缩：生命低于10%时无敌${f.dur}秒（每关一次）`;
  case 'delicacy':return `美味佳肴：出售返还${pc(f.v)}`;case 'submerge':return `潜水：首次受到攻击时下潜无敌${f.dur}秒`;
  case 'slavetrade':return `奴隶贸易：每关结束时若存活额外获得${f.v}金（估计值）`;case 'bleed':return `流血：自身生命低于${pc(f.below)}时攻击造成每秒${f.dps}流血并降低攻速${pc(f.as)}`;
  case 'lineshock':return `震荡波：直线对地面敌人造成${f.dmg}伤害（长${f.len}，宽${f.w}，冷却${f.cd}秒）`;case 'bouncenote':return `激流：攻击弹射${(f.targets||2)-1}次，每次伤害-${pc(f.loss||0.3)}`;case 'visual':return f.note||'攻击特效';case 'bossnote':return f.note||'首领单位';
  case 'immolation':return `永久献祭：每秒对周围地面敌人造成${f.dps}伤害`;case 'shockwave':return `震荡波：直线${f.dmg}伤害（消耗${f.mana}法力，冷却${f.cd}秒）`;case 'warstomp':return `战争践踏：周围${f.dmg}伤害并击晕${f.stun}秒（消耗${f.mana}法力）`;
  case 'kaura':return f.st==='dmg'?`光环：友军攻击力+${Math.round(f.v*100)}%`:f.st==='arm'?`光环：友军护甲+${f.v}`:`光环：友军攻速+${Math.round(f.v*100)}% 移速+${Math.round((f.ms||0)*100)}%`;
  case 'shrapnel':return `弹片：${pc(f.ch)}几率对周围${f.n}个敌人造成${f.dmg}伤害`;case 'focus':return `聚能：每${f.per}点法力+1攻击力`;case 'kingx':return '对国王造成双倍伤害';case 'immune':return '魔法免疫';case 'regen':return `额外生命恢复`;}
  return f.name||f.k;}
const api={W,H,BUILD,KING_POS,LEAK_Y,TILE,MAXW,ATK,ARM,COLS,RACES,ECO,KUP_MAX,D,load,newGame,place,canPlace,upgrade,sell,sellValue,buyWisp,buyFarm,buyLumberjack,ljCost,kingUpgrade,sendSummon,rollProphet,
  startWave,step,waveDef,waveBonus,AI,cellFree,upCost,mult,armorK,statsOf,raceLines,unitSpec,upgradesOf,fxText,get TBL(){return TBL;},get LINE_POOL(){return LINE_POOL;}};
if(typeof module!=='undefined'){module.exports=api;try{load(require('./data/roster_mega.json'));}catch(e){}}else root.LT=api;
})(this);
