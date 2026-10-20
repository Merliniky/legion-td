// 军团战争 (Legion TD-style) — pure game logic, no rendering. Browser: window.LT ; node: require('./lt_core.js')
(function(root){'use strict';
const W=9,H=18;                                  // lane grid (columns × rows); row 0 = top (spawn), king at bottom
const BUILD={c0:0,c1:8,r0:3,r1:10};              // build zone rows 3..10 inclusive
const KING_POS={x:4.5,y:16.3},LEAK_Y=12.2;
const MAXW=12,BUILD_T=35,FIRST_BUILD_T=45;
// ---------- damage / armor types (WC3-style table) ----------
const ATK={n:'普通',p:'穿刺',m:'魔法',s:'攻城',c:'混沌'};
const ARM={l:'轻甲',m:'中甲',h:'重甲',f:'城甲',u:'无甲'};
const TBL={n:{l:1,m:1.5,h:1,f:0.7,u:1},p:{l:2,m:0.75,h:1,f:0.35,u:1.5},m:{l:1.25,m:0.75,h:2,f:0.35,u:1},s:{l:1,m:0.5,h:1,f:1.5,u:1.5},c:{l:1,m:1,h:1,f:1,u:1}};
// ---------- builder roster (HoMM3 Castle creatures). up = upgrade target ----------
const U={
 pikeman:  {n:'枪兵',cost:15,hp:240,dmg:11,rng:0.9,cd:1.0,atk:'p',arm:'h',spd:2.0,up:'halberdier',d:'廉价前排，重甲抗打'},
 halberdier:{n:'戟兵',cost:30,hp:520,dmg:22,rng:1.0,cd:1.0,atk:'p',arm:'h',spd:2.1,base:'pikeman',d:'升级：生命与攻击翻倍'},
 archer:   {n:'弓箭手',cost:25,hp:140,dmg:15,rng:4.0,cd:1.2,atk:'p',arm:'l',spd:2.0,up:'marksman',d:'远程射手'},
 marksman: {n:'神射手',cost:40,hp:230,dmg:18,rng:4.4,cd:1.2,atk:'p',arm:'l',spd:2.0,dbl:1,base:'archer',d:'升级：每次射出两箭'},
 dwarf:    {n:'矮人',cost:40,hp:600,dmg:16,rng:0.9,cd:1.3,atk:'n',arm:'f',spd:1.6,up:'battleDwarf',d:'城甲：极其耐打的坦克'},
 battleDwarf:{n:'战斗矮人',cost:50,hp:1150,dmg:30,rng:0.9,cd:1.25,atk:'n',arm:'f',spd:1.7,base:'dwarf',d:'升级：钢铁城墙'},
 woodElf:  {n:'木精灵',cost:55,hp:200,dmg:32,rng:4.6,cd:1.05,atk:'p',arm:'m',spd:2.2,up:'grandElf',d:'高伤害远程'},
 grandElf: {n:'大精灵',cost:65,hp:330,dmg:34,rng:5.0,cd:1.0,atk:'p',arm:'m',spd:2.2,dbl:1,base:'woodElf',d:'升级：双重射击'},
 monk:     {n:'僧侣',cost:65,hp:230,dmg:36,rng:3.8,cd:1.5,atk:'m',arm:'l',spd:1.9,splash:1.0,up:'zealot',d:'魔法弹，范围溅射'},
 zealot:   {n:'狂热者',cost:75,hp:380,dmg:62,rng:4.2,cd:1.4,atk:'m',arm:'l',spd:1.9,splash:1.2,base:'monk',d:'升级：更强的神圣溅射'},
 griffin:  {n:'狮鹫',cost:75,hp:560,dmg:34,rng:1.0,cd:0.85,atk:'n',arm:'m',spd:3.0,up:'royalGriffin',d:'迅捷的近战猛兽'},
 royalGriffin:{n:'皇家狮鹫',cost:85,hp:980,dmg:58,rng:1.0,cd:0.8,atk:'n',arm:'m',spd:3.2,base:'griffin',d:'升级：攻速更快、伤害更高'},
 swordsman:{n:'剑士',cost:95,hp:950,dmg:44,rng:1.0,cd:1.05,atk:'n',arm:'h',spd:2.0,up:'crusader',d:'重装前排主力'},
 crusader: {n:'十字军',cost:110,hp:1600,dmg:46,rng:1.0,cd:1.0,atk:'n',arm:'h',spd:2.1,dbl:1,base:'swordsman',d:'升级：每次攻击两次'},
 angel:    {n:'天使',cost:170,hp:1700,dmg:95,rng:1.1,cd:1.0,atk:'c',arm:'h',spd:2.6,up:'archangel',d:'混沌伤害，无视护甲类型'},
 archangel:{n:'大天使',cost:200,hp:2900,dmg:150,rng:1.2,cd:0.95,atk:'c',arm:'h',spd:2.8,heal:60,base:'angel',d:'升级：攻击时治疗周围友军'},
};
const ROSTER=['pikeman','archer','dwarf','woodElf','monk','griffin','swordsman','angel'];
// ---------- mercenaries (sent into the opponent's lane with the next wave; raise income) ----------
const MERC={
 imp:        {n:'小鬼',cost:20,inc:2,hp:220,dmg:10,rng:0.9,cd:0.9,atk:'n',arm:'l',spd:2.6,d:'便宜快速，+2收入'},
 hobgoblin:  {n:'大哥布林',cost:40,inc:4,hp:480,dmg:18,rng:0.9,cd:1.0,atk:'n',arm:'m',spd:2.0,d:'+4收入'},
 ogre:       {n:'食人魔',cost:80,inc:7,hp:1050,dmg:34,rng:1.0,cd:1.2,atk:'n',arm:'h',spd:1.6,d:'皮糙肉厚，+7收入'},
 medusa:     {n:'美杜莎',cost:110,inc:9,hp:620,dmg:42,rng:3.6,cd:1.3,atk:'p',arm:'m',spd:1.8,d:'远程射手，+9收入'},
 cerberus:   {n:'三头犬',cost:150,inc:12,hp:1500,dmg:52,rng:1.0,cd:1.0,atk:'c',arm:'m',spd:2.8,splash:1.0,d:'混沌溅射，+12收入'},
 blackKnight:{n:'黑骑士',cost:240,inc:18,hp:3400,dmg:85,rng:1.1,cd:1.1,atk:'n',arm:'h',spd:2.2,d:'精英重骑，+18收入'},
};
const MERCS=Object.keys(MERC);
// ---------- waves (HoMM3 neutrals / monsters) ----------
// hp/dmg are derived from the expected army value at that wave (HPG = hp per gold of army), k = per-wave tweak
const WAVES=[null,
 {t:'goblin',n:'哥布林',cnt:12,k:0.9,atk:'n',arm:'m',spd:1.5},
 {t:'skeleton',n:'骷髅兵',cnt:12,k:0.9,atk:'n',arm:'h',spd:1.4},
 {t:'gnoll',n:'豺狼人',cnt:12,k:1,atk:'p',arm:'m',spd:1.5},
 {t:'wolfRider',n:'狼骑兵',cnt:10,k:0.85,atk:'n',arm:'l',spd:2.4,fast:1},
 {t:'harpy',n:'鹰身女妖',cnt:12,k:0.9,atk:'n',arm:'l',spd:2.0,fly:1},
 {t:'orc',n:'半兽人投手',cnt:10,k:0.8,atk:'p',arm:'m',spd:1.4,rng:3.2},
 {t:'lizardman',n:'蜥蜴人',cnt:12,k:0.85,atk:'p',arm:'m',spd:1.5,rng:3.2},
 {t:'walkingDead',n:'僵尸',cnt:14,k:0.9,atk:'n',arm:'h',spd:1.0,tank:1},
 {t:'minotaur',n:'牛头人',cnt:10,k:1,atk:'n',arm:'h',spd:1.6},
 {t:'hellHound',n:'地狱犬',cnt:12,k:0.9,atk:'m',arm:'l',spd:2.5,fast:1},
 {t:'stoneGolem',n:'石魔像',cnt:10,k:0.85,atk:'n',arm:'h',spd:1.0,tank:1},
 {t:'boneDragon',n:'骨龙王',cnt:1,k:1.15,atk:'c',arm:'h',spd:1.1,boss:1,splash:1.4,rng:1.6,esc:{t:'skeleton',n:'骷髅护卫',cnt:8,k:0.35,atk:'n',arm:'h',spd:1.3}},
];
const ECO={gold:120,income:20,bonus:w=>15+w*6,bounty:w=>16+w*5,HPG:9,DPH:1/12};
function armyAt(w){let a=ECO.gold;for(let i=1;i<w;i++)a+=ECO.income+ECO.bonus(i)+ECO.bounty(i);return a;}
(function(){for(let w=1;w<WAVES.length;w++){const d=WAVES[w];const A=armyAt(w);const tot=A*ECO.HPG*d.k*(d.boss?1:1);
  const fill=(x,share,cnt)=>{x.hp=Math.round(tot*share/cnt);x.dmg=Math.max(4,Math.round(x.hp*ECO.DPH*(x.boss?0.25:1)*(x.rng?0.8:1)));x.gold=Math.max(1,Math.round(ECO.bounty(w)*share/cnt));};
  if(d.esc){fill(d,0.65,1);d.esc.boss=0;fill(d.esc,0.35,d.esc.cnt);}else fill(d,1,d.cnt);}})();
const KING={hp:3000,dmg:70,rng:3.4,cd:0.8,atk:'m',arm:'f',splash:1.3};
const KUP={cost:[60,100,150,220],hp:300,dmg:25};
// ---------- rng ----------
function mkRng(seed){let s=(seed>>>0)||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
let NID=1;
function newLane(owner){return {owner,units:[],creeps:[],king:{hp:KING.hp,maxHp:KING.hp,dmg:KING.dmg,lvl:0,atkT:0,x:KING_POS.x,y:KING_POS.y,alive:true,isKing:true,arm:KING.arm,r:0.9},pend:[],events:[],active:false,leaks:0,t:0,cleared:true};}
function newGame(seed){const g={seed:seed||((Math.random()*1e9)|0),wave:0,phase:'build',timer:FIRST_BUILD_T,t:0,over:null,
  lanes:[newLane(0),newLane(1)],gold:[ECO.gold,ECO.gold],income:[ECO.income,ECO.income],sendQ:[[],[]],sent:[0,0],kills:[0,0],leaked:[0,0],log:[]};
  g.rnd=mkRng(g.seed);return g;}
// ---------- unit placement / upgrade / sell ----------
function cellFree(L,c,r){return c>=BUILD.c0&&c<=BUILD.c1&&r>=BUILD.r0&&r<=BUILD.r1&&!L.units.some(u=>u.c===c&&u.r===r);}
function mkFighter(type,c,r,owner){const d=U[type];return {id:NID++,side:'u',owner,type,d,c,r,x:c+0.5,y:r+0.5,hp:d.hp,maxHp:d.hp,atkT:0,alive:true,value:d.cost,fresh:true,inactive:false,tgt:null,radius:0.34};}
function canPlace(g,p,type,c,r){const L=g.lanes[p];if(g.over)return '游戏已结束';if(!U[type]||U[type].base)return '无效单位';if(g.gold[p]<U[type].cost)return '金币不足';if(!cellFree(L,c,r))return '这里不能建造';return '';}
function place(g,p,type,c,r){const why=canPlace(g,p,type,c,r);if(why)return {ok:false,reason:why};const L=g.lanes[p];g.gold[p]-=U[type].cost;const u=mkFighter(type,c,r,p);
  if(g.phase==='battle'){u.inactive=true;u.alive=false;}L.units.push(u);L.events.push({k:'place',u});return {ok:true,u};}
function upgrade(g,p,id){const L=g.lanes[p],u=L.units.find(x=>x.id===id);if(!u)return {ok:false,reason:'找不到单位'};const to=u.d.up;if(!to)return {ok:false,reason:'已是最高级'};
  if(g.phase==='battle'&&!u.inactive)return {ok:false,reason:'战斗中无法升级'};const cost=U[to].cost;if(g.gold[p]<cost)return {ok:false,reason:'金币不足'};
  g.gold[p]-=cost;u.type=to;u.d=U[to];u.maxHp=u.hp=u.d.hp;u.value+=cost;L.events.push({k:'upgrade',u});return {ok:true,u};}
function sellValue(g,u){return u.fresh?u.value:Math.floor(u.value*0.5);}
function sell(g,p,id){const L=g.lanes[p],i=L.units.findIndex(x=>x.id===id);if(i<0)return {ok:false,reason:'找不到单位'};const u=L.units[i];
  if(g.phase==='battle'&&!u.inactive)return {ok:false,reason:'战斗中无法出售'};const v=sellValue(g,u);g.gold[p]+=v;L.units.splice(i,1);L.events.push({k:'sell',u,v});return {ok:true,v};}
function sendMerc(g,p,type){const m=MERC[type];if(!m)return {ok:false,reason:'无效'};if(g.over)return {ok:false,reason:'游戏已结束'};if(g.gold[p]<m.cost)return {ok:false,reason:'金币不足'};
  if(g.sendQ[p].length>=20)return {ok:false,reason:'本波派兵已达上限'};g.gold[p]-=m.cost;g.income[p]+=m.inc;g.sendQ[p].push(type);g.sent[p]+=m.cost;return {ok:true};}
function kingUpgrade(g,p){const k=g.lanes[p].king;const c=KUP.cost[k.lvl];if(c==null)return {ok:false,reason:'国王已满级'};if(g.gold[p]<c)return {ok:false,reason:'金币不足'};
  g.gold[p]-=c;k.lvl++;k.maxHp+=KUP.hp;k.hp+=KUP.hp;k.dmg+=KUP.dmg;g.lanes[p].events.push({k:'kingup'});return {ok:true};}
// ---------- waves ----------
function waveDef(w){return WAVES[Math.min(w,MAXW)];}
function mkCreep(d,x,y,owner,merc){return {id:NID++,side:'c',type:d.t||d.type,d,x,y,hp:d.hp,maxHp:d.hp,atkT:0.3,alive:true,tgt:null,merc:!!merc,boss:!!d.boss,fly:!!d.fly,radius:d.boss?0.7:0.34,owner,
  dmg:d.dmg,rng:d.rng||0.9,cd:d.cd||1.1,atk:d.atk,arm:d.arm,spd:d.spd,gold:d.gold||0,splash:d.splash||0};}
function spawnGroup(L,list,y0,g){// list of creep defs → formation rows of 5 above the board
  const per=5;list.forEach((d,i)=>{const row=Math.floor(i/per),col=i%per,n=Math.min(per,list.length-row*per);const x=4.5+(col-(n-1)/2)*1.25+(g.rnd()-0.5)*0.3;
    const e=mkCreep(d,x,y0-row*1.1+(g.rnd()-0.5)*0.3,L.owner,d.merc);if(d.boss)e.x=4.5;L.creeps.push(e);L.events.push({k:'spawn',e});});}
function startWave(g){if(g.phase!=='build'||g.over)return;g.wave++;g.phase='battle';g.timer=0;const wd=waveDef(g.wave);
  for(let p=0;p<2;p++){const L=g.lanes[p];L.creeps=[];L.pend=[];L.t=0;L.cleared=false;
    for(const u of L.units){u.inactive=false;u.alive=true;u.fresh=false;u.hp=u.maxHp;u.x=u.c+0.5;u.y=u.r+0.5;u.tgt=null;u.atkT=0.2+g.rnd()*0.3;}
    const list=[];if(wd.boss){list.push(wd);}else for(let i=0;i<wd.cnt;i++)list.push(wd);
    spawnGroup(L,list,1.0,g);if(wd.esc){const es=[];for(let i=0;i<wd.esc.cnt;i++)es.push(wd.esc);spawnGroup(L,es,-1.2,g);}
    // mercs sent by the other player
    const q=g.sendQ[1-p];if(q.length){const ms=q.map(t=>Object.assign({t,merc:1,gold:Math.round(MERC[t].cost*0.2)},MERC[t]));spawnGroup(L,ms,-1.8-(wd.esc?2.2:0)-Math.ceil(list.length/5)*1.1,g);}
    L.mercIn=q.length;}
  g.sendQ=[[],[]];g.lanes.forEach(L=>L.events.push({k:'wave',w:g.wave,wd}));}
const clearBonus=w=>ECO.bonus(w);
function endWave(g){g.phase='build';for(let p=0;p<2;p++){const L=g.lanes[p];const bonus=clearBonus(g.wave);g.gold[p]+=g.income[p]+bonus;L.events.push({k:'income',v:g.income[p],bonus});
    for(const u of L.units){u.alive=true;u.hp=u.maxHp;u.x=u.c+0.5;u.y=u.r+0.5;u.tgt=null;}L.creeps=[];L.pend=[];
    const k=L.king;if(k.alive)k.hp=Math.min(k.maxHp,k.hp+Math.round(k.maxHp*0.1));}
  if(g.wave>=MAXW){g.over='win';g.phase='over';return;}
  g.timer=BUILD_T;g.lanes.forEach(L=>L.events.push({k:'build',w:g.wave+1}));}
// ---------- combat ----------
function mult(atk,arm){return (TBL[atk]||TBL.n)[arm]||1;}
function dmgCalc(src,tgt){const atk=src.d?src.d.atk||src.atk:src.atk;const arm=tgt.isKing?tgt.arm:(tgt.d?tgt.d.arm:tgt.arm);return mult(atk||'n',arm||'m');}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function statsOf(e){if(e.side==='u'){const d=e.d;return {dmg:d.dmg,rng:d.rng,cd:d.cd,spd:d.spd,splash:d.splash||0,dbl:d.dbl||0,heal:d.heal||0,ranged:d.rng>2};}
  return {dmg:e.dmg,rng:e.rng,cd:e.cd,spd:e.spd,splash:e.splash,dbl:0,heal:0,ranged:e.rng>2};}
function nearest(e,list,maxD){let best=null,bd=maxD;for(const o of list){if(!o.alive)continue;const d=dist(e,o)-(o.radius||0.34);if(d<bd){bd=d;best=o;}}return best;}
function applyHit(g,L,h){const t=h.tgt;if(!t.alive)return;let dmg=h.dmg;
  const hitOne=(x,k)=>{if(!x.alive)return;const m=dmgCalc(h.src,x);const v=dmg*m*k*(0.9+g.rnd()*0.2);x.hp-=v;if(x.side==='c'&&h.src&&h.src.side==='u'&&(!x.tgt||x.tgt.isKing||!x.tgt.alive))x.tgt=h.src;L.events.push({k:'hit',e:x,v,src:h.src,crit:m>=1.5});
    if(x.hp<=0){x.hp=0;x.alive=false;onDeath(g,L,x,h.src);}};
  hitOne(t,1);
  if(h.splash){const pool=t.side==='c'?L.creeps:(t.isKing?[]:L.units);for(const o of pool)if(o!==t&&o.alive&&dist(o,t)<h.splash)hitOne(o,0.5);
    if(t.side!=='c'&&!t.isKing&&L.king.alive&&dist(L.king,t)<h.splash)hitOne(L.king,0.5);L.events.push({k:'splash',x:t.x,y:t.y,r:h.splash,src:h.src});}
  if(h.heal){for(const o of L.units)if(o.alive&&dist(o,h.src)<2.5){o.hp=Math.min(o.maxHp,o.hp+h.heal);}L.events.push({k:'heal',e:h.src});}}
function onDeath(g,L,x,src){L.events.push({k:'die',e:x,src});
  if(x.isKing){L.events.push({k:'kingdie'});return;}
  if(x.side==='c'){const p=L.owner;g.gold[p]+=x.gold;g.kills[p]++;L.events.push({k:'gold',v:x.gold,x:x.x,y:x.y});}}
function attack(g,L,e,t,st){e.atkT=st.cd;const wind=st.ranged?0.22:0.28;const travel=st.ranged?dist(e,t)/9:0;
  L.events.push({k:'atk',e,t,ranged:st.ranged,wind,travel});
  const n=st.dbl?2:1;for(let i=0;i<n;i++)L.pend.push({t:wind+travel+i*0.18,src:e,tgt:t,dmg:st.dmg,splash:st.splash,heal:i===0?st.heal:0});}
function stepLane(g,L,dt){if(L.cleared)return;L.t+=dt;
  const units=L.units.filter(u=>u.alive),creeps=L.creeps.filter(c=>c.alive),k=L.king;
  // pending hits
  for(let i=L.pend.length-1;i>=0;i--){const h=L.pend[i];h.t-=dt;if(h.t<=0){L.pend.splice(i,1);if(h.src.alive||h.src.side==='c'||true)applyHit(g,L,h);}}
  // fighters
  for(const u of units){if(!u.alive)continue;const st=statsOf(u);u.atkT-=dt;
    const acq=Math.max(st.rng+1.2,2.8);if(!u.tgt||!u.tgt.alive||(L.t%0.5<dt)){const n=nearest(u,creeps,acq);u.tgt=n||(u.tgt&&u.tgt.alive&&dist(u,u.tgt)<acq+3?u.tgt:null);}const t=u.tgt;u.moving=false;
    if(!t){// return home
      const hx=u.c+0.5,hy=u.r+0.5,d=Math.hypot(hx-u.x,hy-u.y);if(d>0.1){const s=Math.min(d,st.spd*dt);u.x+=(hx-u.x)/d*s;u.y+=(hy-u.y)/d*s;u.moving=true;}continue;}
    const d=dist(u,t)-t.radius;if(d>st.rng){const s=st.spd*dt,D=dist(u,t);u.x+=(t.x-u.x)/D*s;u.y+=(t.y-u.y)/D*s;u.moving=true;}
    else if(u.atkT<=0)attack(g,L,u,t,st);u.face=Math.atan2(t.x-u.x,t.y-u.y);}
  // creeps
  for(const c of creeps){if(!c.alive)continue;const st=statsOf(c);c.atkT-=dt;c.moving=false;
    if(!c.tgt||!c.tgt.alive||c.tgt.isKing||(L.t%0.5<dt)){const n=nearest(c,units,c.y>LEAK_Y?1.6:(st.ranged?st.rng+1:4.2));c.tgt=n||(c.tgt&&c.tgt.alive&&!c.tgt.isKing&&dist(c,c.tgt)<4?c.tgt:null);}
    let t=c.tgt;
    if(!t){if(c.y>LEAK_Y&&!c.leaked){c.leaked=true;L.leaks++;g.leaked[L.owner]++;L.events.push({k:'leak',e:c});}
      if(c.y>LEAK_Y-0.5&&k.alive)t=k;}
    if(t){const d=dist(c,t)-(t.isKing?0.9:t.radius);if(d>st.rng){const s=st.spd*dt,D=dist(c,t);c.x+=(t.x-c.x)/D*s;c.y+=(t.y-c.y)/D*s;c.moving=true;}else if(c.atkT<=0)attack(g,L,c,t,st);c.face=Math.atan2(t.x-c.x,t.y-c.y);}
    else{// march down toward the king, drifting to the lane centre near the bottom
      const tx=c.y>LEAK_Y-2?4.5:c.x;const D=Math.hypot(tx-c.x,KING_POS.y-c.y)||1;c.x+=(tx-c.x)/D*st.spd*dt;c.y+=(KING_POS.y-c.y)/D*st.spd*dt;c.moving=true;c.face=Math.atan2(tx-c.x,KING_POS.y-c.y);}}
  // king
  if(k.alive){k.atkT-=dt;const t=nearest(k,creeps,KING.rng+0.9);if(t&&k.atkT<=0){k.atkT=KING.cd;L.events.push({k:'atk',e:k,t,ranged:true,wind:0.15,travel:dist(k,t)/10});L.pend.push({t:0.15+dist(k,t)/10,src:{atk:KING.atk,alive:true,side:'k'},tgt:t,dmg:k.dmg,splash:KING.splash});}}
  // separation (cheap O(n²))
  const all=units.concat(creeps).filter(e=>e.alive);for(let i=0;i<all.length;i++){const a=all[i];for(let j=i+1;j<all.length;j++){const b=all[j];const dx=b.x-a.x,dy=b.y-a.y,rr=a.radius+b.radius,d2=dx*dx+dy*dy;
      if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2),push=(rr-d)*0.5;const nx=dx/d,ny=dy/d;const wa=a.boss?0.15:1,wb=b.boss?0.15:1;a.x-=nx*push*wa;a.y-=ny*push*wa;b.x+=nx*push*wb;b.y+=ny*push*wb;}}}
  for(const e of all){e.x=Math.max(0.3,Math.min(W-0.3,e.x));if(e.side==='u')e.y=Math.min(H-0.5,e.y);}
  // done?
  if(!L.creeps.some(c=>c.alive)&&!L.pend.length){L.cleared=true;L.events.push({k:'cleared',t:L.t,leaks:L.leaks});}
  if(L.t>150){for(const c of L.creeps)if(c.alive){c.alive=false;L.events.push({k:'die',e:c});}}}
function step(g,dt){if(g.over)return;g.t+=dt;
  if(g.phase==='build'){g.timer-=dt;AI.think(g,1,dt);if(g.timer<=0)startWave(g);return;}
  if(g.phase==='battle'){for(const L of g.lanes)stepLane(g,L,dt);AI.think(g,1,dt);
    const dead=g.lanes.map(L=>!L.king.alive);if(dead[0]||dead[1]){g.over=dead[0]?'lose':'win';g.phase='over';return;}
    if(g.lanes.every(L=>L.cleared))endWave(g);}}
// ---------- AI opponent ----------
const COLS=[4,3,5,2,6,1,7,0,8];
const AI={think(g,p,dt){const A=g.ai||(g.ai=[{cd:0,w:-1},{cd:0,w:-1}]);const s=A[p];
    if(g.phase==='build'&&s.w!==g.wave){s.w=g.wave;// plan once per build phase
      const L=g.lanes[p];const lastLeak=L.leaks||0;s.merc=g.wave>=2&&lastLeak<=3?Math.floor(g.gold[p]*(0.25+0.15*g.rnd())):0;L.leaks=0;}
    s.cd-=dt;if(s.cd>0)return;s.cd=0.8;AI.act(g,p,s);},
  act(g,p,s){const L=g.lanes[p],R=g.rnd;
    if(s.merc>0){const opts=MERCS.filter(t=>MERC[t].cost<=Math.min(s.merc,g.gold[p]));if(opts.length){const t=opts[opts.length-1];s.merc-=MERC[t].cost;return sendMerc(g,p,t);}s.merc=0;}
    if(g.phase==='battle')return;
    // upgrades (prefer when the board is getting full or the upgrade is cheap)
    const ups=L.units.filter(u=>u.d.up).sort((a,b)=>a.value-b.value);const full=L.units.length>=14;
    if(ups.length&&(full||R()<0.4)){const u=ups[0];if(U[u.d.up].cost<=g.gold[p])return upgrade(g,p,u.id);if(full)return;}
    const aff=ROSTER.filter(t=>U[t].cost<=g.gold[p]);if(!aff.length)return;
    const melee=L.units.filter(u=>u.d.rng<2).length,ranged=L.units.length-melee;const wantRanged=melee>=2&&ranged<melee*0.9;
    const pool=aff.filter(t=>(U[t].rng>2)===wantRanged);const pick=pool.length?pool:aff;
    // save up a little for better units later in the game
    const best=pick[pick.length-1];if(g.wave>=4&&U[best].cost<40&&g.timer>12)return;
    const t=pick[Math.max(0,pick.length-1-(R()<0.25?1:0))];
    const isR=U[t].rng>2;const rows=isR?[7,8,6,9,10,5]:[4,3,5,6,7,8,9,10];
    for(const r of rows)for(const c of COLS)if(cellFree(L,c,r))return place(g,p,t,c,r);}};
// ---------- auto-defend for the human lane in node sims ----------
const api={W,H,BUILD,KING_POS,LEAK_Y,MAXW,BUILD_T,FIRST_BUILD_T,ATK,ARM,TBL,U,ROSTER,MERC,MERCS,WAVES,ECO,armyAt,KING,KUP,
  newGame,clearBonus,place,canPlace,upgrade,sell,sellValue,sendMerc,kingUpgrade,startWave,step,waveDef,AI,cellFree,mult,statsOf};
if(typeof module!=='undefined')module.exports=api;else root.LT=api;
})(this);
